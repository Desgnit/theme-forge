// Monday → Ricoman Tasks mention-sync bridge.
//
// Watches every board in the Monday account for new updates (comments).
// When a comment @mentions one or more people, a task is created for each
// mentioned person in the Ricoman tasks app via its HTTP API.
//
// Zero npm dependencies — runs on plain Node 20+.

const http = require('http');

const {
  MONDAY_API_TOKEN,
  PUBLIC_WEBHOOK_URL,
  TASKS_API_URL,
  TASKS_API_TOKEN = '',
  WEBHOOK_SECRET = '',
  PORT = 8080,
  RESYNC_INTERVAL_MINUTES = 360,
  STATE_FILE = '/data/state.json',
} = process.env;

const fs = require('fs');
const path = require('path');

if (!MONDAY_API_TOKEN || !PUBLIC_WEBHOOK_URL || !TASKS_API_URL) {
  console.error('Missing required env vars: MONDAY_API_TOKEN, PUBLIC_WEBHOOK_URL, TASKS_API_URL');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Persistent state (processed updates for dedup + registered webhooks)
// ---------------------------------------------------------------------------

let state = { processedUpdates: [], webhooks: {}, users: {}, teams: {} };
try {
  state = { ...state, ...JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) };
} catch (_) { /* first run */ }

function saveState() {
  if (state.processedUpdates.length > 5000) {
    state.processedUpdates = state.processedUpdates.slice(-5000);
  }
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state));
  } catch (err) {
    console.error('Could not persist state:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Monday GraphQL helper
// ---------------------------------------------------------------------------

async function monday(query, variables = {}) {
  const res = await fetch('https://api.monday.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: MONDAY_API_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    const err = new Error(`Monday API error: ${JSON.stringify(json.errors)}`);
    const retryIn = json.errors[0] && json.errors[0].extensions
      && json.errors[0].extensions.retry_in_seconds;
    if (retryIn) err.retryInSeconds = Number(retryIn);
    throw err;
  }
  return json.data;
}

// ---------------------------------------------------------------------------
// Webhook registration across all boards
// ---------------------------------------------------------------------------

const WEBHOOK_EVENTS = ['create_update', 'create_subitem_update'];

async function listAllBoards() {
  const boards = [];
  for (let page = 1; ; page++) {
    const data = await monday(
      `query ($page: Int!) {
         boards (limit: 100, page: $page, state: active) { id name type }
       }`,
      { page },
    );
    const batch = (data.boards || []).filter((b) => b.type === 'board');
    boards.push(...batch);
    if (batch.length < 100) break;
  }
  return boards;
}

async function ensureWebhooks() {
  const boards = await listAllBoards();
  console.log(`Resync: found ${boards.length} boards`);
  for (const board of boards) {
    for (const event of WEBHOOK_EVENTS) {
      const key = `${board.id}:${event}`;
      if (state.webhooks[key]) continue;
      try {
        const existing = await monday(
          `query ($boardId: ID!) { webhooks (board_id: $boardId) { id url event } }`,
          { boardId: board.id },
        );
        const match = (existing.webhooks || []).find(
          (w) => w.url === webhookUrl() && String(w.event).toLowerCase() === event,
        );
        if (match) {
          state.webhooks[key] = match.id;
          continue;
        }
        const created = await monday(
          `mutation ($boardId: ID!, $url: String!) {
             create_webhook (board_id: $boardId, url: $url, event: ${event}) { id }
           }`,
          { boardId: board.id, url: webhookUrl() },
        );
        state.webhooks[key] = created.create_webhook.id;
        console.log(`Registered ${event} webhook on board "${board.name}" (${board.id})`);
      } catch (err) {
        // Some boards don't support subitem updates — not fatal.
        console.error(`Webhook setup failed for board ${board.id} / ${event}: ${err.message}`);
      }
    }
  }
  saveState();
}

function webhookUrl() {
  const url = new URL(PUBLIC_WEBHOOK_URL);
  if (WEBHOOK_SECRET) url.searchParams.set('secret', WEBHOOK_SECRET);
  return url.toString();
}

// ---------------------------------------------------------------------------
// Mention parsing
// ---------------------------------------------------------------------------

// Monday renders mentions in the update HTML body as anchors carrying the
// mentioned user's or team's id. The markup has varied across Monday
// versions, so try several known attribute patterns plus href fallbacks.
function extractMentions(html) {
  const userIds = new Set();
  const teamIds = new Set();
  if (!html) return { userIds: [], teamIds: [] };
  const anchorRe = /<a\b[^>]*>/gi;
  for (const [anchor] of html.matchAll(anchorRe)) {
    const isTeam = /data-mention-type\s*=\s*["']team["']/i.test(anchor) ||
      /team_mention/i.test(anchor);
    const isUser = !isTeam &&
      (/user_mention/i.test(anchor) ||
        /data-mention-type\s*=\s*["']user["']/i.test(anchor));
    if (!isTeam && !isUser) continue;
    const idMatch =
      anchor.match(/data-mentioned-object-id\s*=\s*["'](\d+)["']/i) ||
      anchor.match(/data-mention-id\s*=\s*["'](\d+)["']/i) ||
      anchor.match(/\/(?:users|teams)\/(\d+)/);
    if (!idMatch) continue;
    (isTeam ? teamIds : userIds).add(idMatch[1]);
  }
  return { userIds: [...userIds], teamIds: [...teamIds] };
}

function htmlToText(html) {
  return (html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

// The whole user + team directory is cached, refreshed on the resync
// interval, and persisted to the state file — so handling a comment normally
// costs zero directory API calls, and a quota outage can't blind the service.
const userCache = new Map(Object.entries(state.users || {}));
const teamCache = new Map(Object.entries(state.teams || {}));

async function refreshUserCache() {
  for (let page = 1; ; page++) {
    const data = await monday(
      `query ($page: Int!) { users (limit: 200, page: $page) { id name email } }`,
      { page },
    );
    const batch = data.users || [];
    for (const u of batch) userCache.set(String(u.id), u);
    if (batch.length < 200) break;
  }
  state.users = Object.fromEntries(userCache);
  saveState();
  console.log(`User cache refreshed: ${userCache.size} users`);
}

async function refreshTeamCache() {
  const data = await monday(
    `query { teams { id name users { id } } }`,
  );
  for (const t of data.teams || []) {
    teamCache.set(String(t.id), {
      id: String(t.id),
      name: t.name,
      memberIds: (t.users || []).map((u) => String(u.id)),
    });
  }
  state.teams = Object.fromEntries(teamCache);
  saveState();
  console.log(`Team cache refreshed: ${teamCache.size} teams`);
}

async function getUsers(ids) {
  const users = [];
  const missing = [];
  for (const id of ids) {
    const cached = userCache.get(String(id));
    if (cached) users.push(cached);
    else missing.push(String(id));
  }
  if (missing.length) {
    const data = await monday(
      `query ($ids: [ID!]) { users (ids: $ids) { id name email } }`,
      { ids: missing },
    );
    for (const u of data.users || []) {
      userCache.set(String(u.id), u);
      users.push(u);
    }
  }
  return users;
}

async function getItemContext(itemId) {
  try {
    const data = await monday(
      `query ($ids: [ID!]) {
         items (ids: $ids) { id name url board { id name } }
       }`,
      { ids: [String(itemId)] },
    );
    return (data.items || [])[0] || null;
  } catch (err) {
    console.error(`Item lookup failed for ${itemId}: ${err.message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Task creation in the Ricoman tasks app
// ---------------------------------------------------------------------------

async function createTask(task) {
  const res = await fetch(TASKS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(TASKS_API_TOKEN ? { Authorization: `Bearer ${TASKS_API_TOKEN}` } : {}),
    },
    body: JSON.stringify(task),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Tasks API responded ${res.status}: ${body.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------------------
// Webhook event handling
// ---------------------------------------------------------------------------

async function handleUpdateEvent(event) {
  const updateId = String(event.updateId || event.replyId || '');
  const dedupKey = `${updateId}:${event.pulseId}`;
  if (!updateId || state.processedUpdates.includes(dedupKey)) return;
  state.processedUpdates.push(dedupKey);
  saveState();

  const html = event.body || '';
  const { userIds, teamIds } = extractMentions(html);
  if (!userIds.length && !teamIds.length) return;

  const authorId = event.userId ? String(event.userId) : null;
  const directIds = [...new Set(userIds)].filter((id) => id !== authorId);
  const mentionedTeams = teamIds
    .map((id) => teamCache.get(String(id)))
    .filter(Boolean);
  for (const id of teamIds) {
    if (!teamCache.has(String(id))) {
      console.error(`Mentioned team ${id} not in cache — will resolve on next resync`);
    }
  }

  const idsToResolve = new Set(directIds);
  for (const team of mentionedTeams) {
    for (const memberId of team.memberIds) {
      if (memberId !== authorId) idsToResolve.add(memberId);
    }
  }

  const [resolvedUsers, authorArr, item] = await Promise.all([
    getUsers([...idsToResolve]),
    getUsers(authorId ? [authorId] : []),
    getItemContext(event.pulseId),
  ]);
  const usersById = new Map(resolvedUsers.map((u) => [String(u.id), u]));
  const author = authorArr[0];
  const authorName = author ? author.name : 'Someone';
  const itemName = item ? item.name : `item ${event.pulseId}`;
  const itemUrl = item
    ? item.url
    : `https://monday.com/boards/${event.boardId}/pulses/${event.pulseId}`;
  const text = event.textBody || htmlToText(html);
  const description =
    `${text}\n\nFrom a Monday comment by ${authorName} on "${itemName}"\n${itemUrl}`;

  const tasks = [];

  // A personal task for each directly @mentioned person.
  for (const id of directIds) {
    const user = usersById.get(String(id));
    if (!user || !user.email) {
      console.error(`No email for mentioned Monday user ${id} — skipping`);
      continue;
    }
    tasks.push({
      title: `${authorName} mentioned you on "${itemName}"`,
      description,
      assignee_email: user.email,
      source: 'monday-mention',
      external_id: `monday-update-${updateId}-user-${user.id}`,
      link: itemUrl,
    });
  }

  // ONE shared task per @mentioned team — visible to every member, and
  // completing it (by any member) completes it for the whole team.
  for (const team of mentionedTeams) {
    const emails = team.memberIds
      .filter((id) => id !== authorId)
      .map((id) => usersById.get(String(id)))
      .filter((u) => u && u.email)
      .map((u) => u.email);
    if (!emails.length) continue;
    tasks.push({
      title: `${authorName} mentioned ${team.name} on "${itemName}"`,
      description,
      assignee_emails: emails,
      team_name: team.name,
      shared: true,
      source: 'monday-mention',
      external_id: `monday-update-${updateId}-team-${team.id}`,
      link: itemUrl,
    });
  }

  for (const task of tasks) {
    try {
      await createTask(task);
      console.log(`Task created (${task.external_id})`);
    } catch (err) {
      console.error(`Task creation failed (${task.external_id}): ${err.message}`);
    }
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, webhooks: Object.keys(state.webhooks).length }));
    return;
  }

  if (req.method !== 'POST' || url.pathname !== '/monday-webhook') {
    res.writeHead(404);
    res.end();
    return;
  }

  if (WEBHOOK_SECRET && url.searchParams.get('secret') !== WEBHOOK_SECRET) {
    res.writeHead(403);
    res.end();
    return;
  }

  let raw = '';
  req.on('data', (chunk) => { raw += chunk; });
  req.on('end', () => {
    let body;
    try {
      body = JSON.parse(raw);
    } catch (_) {
      res.writeHead(400);
      res.end();
      return;
    }

    // Monday verifies the endpoint by sending a challenge to echo back.
    if (body.challenge) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ challenge: body.challenge }));
      return;
    }

    // Ack immediately; process in the background so Monday never times out.
    res.writeHead(200);
    res.end();
    if (body.event) {
      handleUpdateEvent(body.event).catch((err) =>
        console.error(`Event handling failed: ${err.message}`),
      );
    }
  });
});

server.listen(Number(PORT), () => {
  console.log(`monday-mentions-sync listening on :${PORT}`);
  let retryTimer = null;
  const resync = async () => {
    try {
      await ensureWebhooks();
      await refreshUserCache();
      await refreshTeamCache();
    } catch (err) {
      console.error(`Resync failed: ${err.message}`);
      // If the account's daily API quota is exhausted, Monday tells us when
      // it resets — schedule a one-off retry for just after that moment.
      if (err.retryInSeconds && !retryTimer) {
        const mins = Math.ceil(err.retryInSeconds / 60) + 5;
        console.log(`API daily limit exhausted — retrying resync in ${mins} minutes`);
        retryTimer = setTimeout(() => { retryTimer = null; resync(); }, mins * 60 * 1000);
      }
    }
  };
  resync();
  setInterval(resync, Number(RESYNC_INTERVAL_MINUTES) * 60 * 1000);
});
