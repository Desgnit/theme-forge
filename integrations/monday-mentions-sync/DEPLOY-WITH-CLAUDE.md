# Deploying via the Claude that manages the Synology

Copy the prompt below and paste it to the Claude instance on the PC that
built the tasks app and manages the Synology Docker setup. It contains
everything needed; the only things it will have to ask you for are the
Monday API token and (possibly) a DNS/reverse-proxy step.

---

I want to deploy a new integration service alongside the Ricoman tasks app.
The code is on GitHub: repo `Desgnit/theme-forge`, branch
`claude/monday-comments-tasks-sync-n6lbfk`, folder
`integrations/monday-mentions-sync/`. Please:

1. Fetch that folder (git clone/pull of the branch, or download the files)
   and read its README.md — it explains the whole design.

2. **Add a task-creation endpoint to the tasks app** (tasks.ricoman.com):
   a POST endpoint, e.g. `/api/integrations/tasks`, protected by a bearer
   token, accepting JSON:
   `{title, description, assignee_email, source, external_id, link}`.
   It should find the user by `assignee_email` and create a task for them
   with the given title/description. If a task with the same `external_id`
   already exists, return 200 and do nothing (duplicate protection).
   Generate a long random bearer token for it.

3. **Fix cross-department task assignment in the tasks app**: users report
   they cannot assign a task to a person in another department (e.g. a
   lighting designer assigning to Production or Technical). Find whatever
   filter restricts the assignee picker to the current user's own
   department/team and remove or widen it so any active user can be chosen
   as assignee, regardless of department. Keep department grouping in the
   picker UI if it exists — just don't restrict selection by it.

4. **Deploy the bridge container** on the Synology next to the tasks app:
   copy the `monday-mentions-sync` folder to the Docker share, create `.env`
   from `.env.example`:
   - `MONDAY_API_TOKEN` — ask me for it (I'll create it in Monday under
     avatar → Developers → My access tokens; must be an admin token).
   - `PUBLIC_WEBHOOK_URL` — a public HTTPS URL that reaches this container's
     port 8712, e.g. `https://monday-sync.ricoman.com/monday-webhook`. Set up
     the same way tasks.ricoman.com is exposed (DSM reverse proxy + DNS
     record). If a step needs the DSM UI or the DNS provider, tell me exactly
     what to click/add.
   - `TASKS_API_URL` — the endpoint you created in step 2.
   - `TASKS_API_TOKEN` — the bearer token from step 2.
   - `WEBHOOK_SECRET` — generate a long random string.
   Then `docker compose up -d --build`.

5. **Verify**: `docker logs -f monday-mentions-sync` should show
   `Resync: found N boards` and `Registered create_update webhook on board …`
   lines, then `User cache refreshed: N users`. Note: if Monday returns
   "Daily limit exceeded", the account's API quota is exhausted for today —
   the service retries every 6 hours on its own, so just check the log again
   later.

6. When registration has succeeded, tell me — I'll post a test comment in
   Monday tagging someone, and we'll confirm a task appears for them in the
   tasks app within a few seconds.
