# Signed-URL access tests

Verifies the allow/deny matrix for `get-event-presentation` — the only edge
function in the app that mints signed URLs against the private
`event-presentations` bucket.

## What is covered

| Caller                                | Expected |
| ------------------------------------- | -------- |
| anon (no Authorization header)        | 401      |
| authenticated non-attendee            | 403      |
| RSVP attendee (`status = 'going'`)    | 200      |
| signup-by-email attendee              | 200      |
| event creator (non-admin)             | 200      |
| admin (no RSVP)                       | 200      |
| unknown `presentation_id`             | 404      |
| missing/invalid body                  | 400      |
| `presentation_access_log` allow+deny  | rows written |

Each run provisions a private past+published event, a 9-byte PDF in the
bucket, an RSVP, a signup, and five fresh auth users (creator, admin,
two attendees, one outsider). Everything is torn down in `afterAll`.

## Run locally

```bash
export SUPABASE_URL=https://<project>.supabase.co
export SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
export SIGNED_URL_TEST_USER_PASSWORD='Test!Pass-9001'

bun run test supabase/tests/signed-urls
```

When any of the three Supabase env vars is missing, the suite is skipped
(not failed) so `bun run test` stays green on laptops without Cloud creds.

## Run in CI

The Security workflow surfaces this suite via the same env vars set as
GitHub Actions secrets. The job:

1. Installs deps.
2. Exports `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Runs `bun run test supabase/tests/signed-urls`.

If the edge function is redeployed, re-run the suite — it hits the live
function, not a mock, so behavior drift is caught immediately.
