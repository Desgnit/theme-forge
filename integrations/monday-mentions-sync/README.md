# Monday → Ricoman Tasks mention sync

Whenever anyone posts a comment (an "update") on **any Monday.com board** and
@mentions somebody, this service automatically creates a task for the mentioned
person in the Ricoman tasks app (tasks.ricoman.com).

It is a single small Docker container designed to run on the same Synology NAS
that already hosts the tasks app. No changes to Monday are needed by hand — on
startup (and every 6 hours) it finds **every board in the account** and
registers itself as a webhook listener, so newly created boards are picked up
automatically.

## How it works

1. On startup it lists all active boards via the Monday GraphQL API and
   registers a `create_update` (and `create_subitem_update`) webhook on each,
   pointing at `PUBLIC_WEBHOOK_URL`.
2. When someone posts a comment, Monday calls the webhook. The service parses
   the comment HTML for @mentioned users **and teams** — mentioning a team
   (e.g. @Production or @Technical) creates a task for every member of that
   team, titled "…mentioned Production on…". The comment's author never gets
   a task for their own comment.
3. For each mentioned person it looks up their **email** in Monday (the tasks
   app also identifies people by email, so that is the join key) and POSTs a
   task to `TASKS_API_URL`.
4. Every processed comment is remembered in `/data/state.json` so nothing is
   ever double-created, even after a restart.

## Task payload sent to the tasks app

The service POSTs JSON like this (with `Authorization: Bearer <TASKS_API_TOKEN>`
if configured):

```json
{
  "title": "Jane Smith mentioned you on \"Q3 price list\"",
  "description": "@Rob can you check this?\n\nFrom a Monday comment by Jane Smith on \"Q3 price list\"\nhttps://ricoman.monday.com/boards/123/pulses/456",
  "assignee_email": "rob@ricoman.com",
  "source": "monday-mention",
  "external_id": "monday-update-987654-user-1122",
  "link": "https://ricoman.monday.com/boards/123/pulses/456"
}
```

The tasks app needs one endpoint that accepts this payload, finds (or creates)
the user by `assignee_email`, and creates the task. Treat `external_id` as
unique — if a task with that `external_id` already exists, return 200 and do
nothing (extra safety against duplicates).

> **If the tasks app doesn't have such an endpoint yet**, ask the Claude that
> maintains it: *"Add a POST endpoint (e.g. `/api/integrations/tasks`),
> protected by a bearer token, that accepts `{title, description,
> assignee_email, source, external_id, link}` and creates a task for the user
> with that email, skipping duplicates by external_id."*

## Setup on the Synology

1. Copy this folder onto the NAS (e.g. `/volume1/docker/monday-mentions-sync`).
2. `cp .env.example .env` and fill it in:
   - `MONDAY_API_TOKEN` — Monday admin token: avatar → **Developers** →
     **My access tokens**. Must belong to an admin so all boards are visible.
   - `PUBLIC_WEBHOOK_URL` — a public HTTPS URL routed to this container.
     In DSM: **Control Panel → Login Portal → Advanced → Reverse Proxy**, add
     e.g. `monday-sync.ricoman.com` → `localhost:8712` (same pattern already
     used for tasks.ricoman.com), then set
     `https://monday-sync.ricoman.com/monday-webhook`.
     Monday must be able to reach this URL from the internet — registration
     fails otherwise (it sends a challenge that the service echoes back).
   - `TASKS_API_URL` — the tasks app's create-task endpoint.
   - `TASKS_API_TOKEN` / `WEBHOOK_SECRET` — recommended; any long random
     strings.
3. `docker compose up -d --build`
4. Check the log: `docker logs -f monday-mentions-sync` — you should see
   `Resync: found N boards` followed by one `Registered ... webhook` line per
   board.
5. Test: comment on any Monday item and @mention someone — a task should
   appear for them in the tasks app within a few seconds.

`GET /health` on the container returns `{"ok":true,...}` for monitoring.

## API usage (why this won't eat the Monday quota)

This service is **push-based**: Monday calls it when a comment is posted, and
incoming webhooks cost no API quota at all. The only API calls it makes are:

- the board scan + user-directory refresh every 6 hours (a handful of queries
  in total, regardless of how many comments are posted), and
- **one** small query per mention-comment to fetch the item's name and link
  for the task title.

Sitting idle it uses essentially nothing — unlike scheduled polling (e.g. a
recurring pull into a spreadsheet), which pays the full query cost on every
run whether anything changed or not. If the account's daily limit is being
exhausted, the polling jobs are where the quota is going.

## Notes

- User mentions create a task for that person; team mentions create a task
  for every member of the team (using the team roster cached from Monday).
- A mentioned user with no email in Monday is skipped (logged in the container
  log).
- If the Monday API daily quota is exhausted at startup, the service reads
  the reset time from Monday's error and retries automatically right after
  the quota resets — no manual intervention needed.
- Webhooks registered by this service are visible in Monday under each board's
  **Integrations → Board integrations**.
