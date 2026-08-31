# Turning on sync (and coach access)

One-time setup, about ten minutes. When it is done the app syncs your history
across devices behind a sign-in, and Ian can be given read-only access with an
invite code.

## 1. Create the project

1. Go to [supabase.com](https://supabase.com), sign up (free), **New project**.
2. Name it anything (`pb-tracker`), pick the region nearest you, generate a
   database password (you will not need it again — the app never uses it).

## 2. Create the tables

1. In the project, open **SQL Editor → New query**.
2. Paste the whole of [`schema.sql`](schema.sql) (the file next to this one)
   and press **Run**. It should finish with "Success".

That file also carries the security setup: every row is tied to a signed-in
user, coaches get read-only access and only via an invite code, and a stale
device can never overwrite a newer entry. Safe to re-run after edits.

## 3. Set up sign-in emails

1. **Authentication → Sign In / Up → Email** — make sure the Email provider
   is enabled (it is by default).
2. **Authentication → Emails → Magic Link template** — make sure the body
   includes the one-time code, e.g. add a line:

   ```
   Your sign-in code is {{ .Token }}
   ```

   Keep the `{{ .ConfirmationURL }}` link too — either route signs you in.
3. **Authentication → URL Configuration → Site URL** — set it to the address
   you use the app from (your GitHub Pages URL ending `/pb-tracker/`), so the
   emailed link lands back in the app.

The free tier sends a handful of auth emails an hour, which is plenty for a
couple of people signing in occasionally.

## 4. Connect the app

1. In Supabase: **Settings → API Keys**. Copy the **Project URL** and the
   **anon public** key. (The anon key is meant to be public — the security is
   the sign-in plus the row rules from step 2, not the key.)
2. In the app: cog (top right) → **Sync & coach** → paste both → **Connect**.
3. Enter your email → **Email me a sign-in code** → type the 6-digit code
   from the email (or just tap the email's link on the same device).

Done. The app syncs on start, shortly after anything changes, and on the
**Sync now** button. Repeat step 4 on the laptop with the same email and the
history follows.

## 5. Give Ian access

1. You (the athlete): **Data → Coach access → Create an invite code**.
2. Send Ian the code. He opens the app at the same address, connects the same
   project (same URL + anon key), signs in with **his** email, and enters the
   code under "Coaching someone?".
3. From then on he has a **Your athletes** screen with your PBs and scores,
   read-only. Remove his access any time from the same card.

## If something misbehaves

- **"The server said no (401/403)"** — the sign-in expired; sign in again.
- **No email arriving** — check spam; the sender is `noreply@mail.app.supabase.io`
  unless you configured your own SMTP.
- **Two devices edited the same entry** — the newer edit wins everywhere;
  nothing is ever half-merged.
- Sync never deletes local data on its own, and the backup file on the Data
  screen keeps working exactly as before — belt and braces.
