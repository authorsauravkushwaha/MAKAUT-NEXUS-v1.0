# NEXUS Private Cloud — 5-minute setup (no coding)

NEXUS ID gives students login + an **encrypted** cloud database so progress never
disappears when they change devices. The app is fully functional without this —
setup only activates sign-in.

## Why this stack

| Requirement | How it is met |
| --- | --- |
| Login | Nhost Auth (email + password, JWT + refresh rotation, rate-limited) |
| Database | Postgres through Nhost's GraphQL API (free tier is plenty for thousands of students) |
| "Unlimited privacy" | **Zero-knowledge**: AES-256-GCM encryption happens in the browser; the DB stores ciphertext only |
| Isolation | Row permissions — every query is bound to the signed-in user's id (`x-hasura-user-id`); no token can reach another student's row |
| No tracking | No cookies/analytics; only the account itself |
| Cost | Free tier is enough; no card required |

## Step 1 — Create the project

1. Go to <https://nhost.io> → **Sign up** (GitHub sign-in is fine) → **New project**.
2. Name: `makaut-nexus` · set a database password (any strong password) · Region: closest
   (e.g. `ap-south-1` for India).
3. Wait ~2 minutes for the project to be ready.
4. On the **project overview** note two values: the **subdomain** (long random string)
   and the **region** (like `ap-south-1`).

## Step 2 — Create the vault table

Dashboard → **Database** → open the **SQL editor** (if your project shows the console
instead, use its *SQL* tab) → paste this entire block → **Run**:

```sql
-- Encrypted per-user vault (ciphertext only — server cannot read it)
create table if not exists public.nexus_vaults (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  salt       text not null,
  iv         text not null,
  data       text not null,
  updated_at timestamptz not null default now()
);
```

Expect a success message (`Success` / `No rows returned`). The table appears under
**Database → Tables → nexus_vaults**.

## Step 3 — Permissions (who can see which rows)

Dashboard → **Database** → context menu on `nexus_vaults` → **Edit Permissions** →
role **`user`** (create it if asked). Set all four operations:

| Operation | Setting |
| --- | --- |
| **insert** | *Without any checks* → allow columns `salt`, `iv`, `data`, `updated_at` → **Column preset**: `user_id` = `x-hasura-user-id` |
| **select** | *With custom check*: `user_id` `_eq` `x-hasura-user-id` → allow all columns → row limit 100 |
| **update** | *With custom check*: `user_id` `_eq` `x-hasura-user-id` → allow columns `salt`, `iv`, `data`, `updated_at` |
| **delete** | *With custom check*: `user_id` `_eq` `x-hasura-user-id` |

Save after each operation. That is the whole security model: a token can only ever
touch rows whose `user_id` equals its own user id.

## Step 4 — Put the project into the site

Edit `public/nexus-cloud.json` (easiest: on GitHub.com → `public/nexus-cloud.json` →
pencil icon) so it contains your two values:

```json
{
  "subdomain": "abcdefghijklmnopq",
  "region": "ap-south-1"
}
```

Commit the change. GitHub Actions redeploys automatically (~45 s).

## Step 5 — Email settings (recommended)

Dashboard → **Authentication → Sign In / Providers → Email**:

- **Confirm email**: keep **ON** (students click a link before first sign-in),
  or turn OFF for quicker testing.
- If sign-in fails with a CORS error, add your site to **Settings → CORS**
  (`https://authorsauravkushwaha.github.io` and `https://learn-anything.xyz`).

## Step 6 — Test

1. Open the site → **Sign in** in the top bar → **Create account**.
2. Confirm email (if enabled) → sign in.
3. Change something (mark a topic, add marks) → watch `Syncing… → Synced`.
4. Open the site on another device/browser with the same account → your data appears.
5. Sign out → local data stays; cloud vault re-locks.

## Security model (what "most secure" means here)

- **PBKDF2-SHA256, 600,000 iterations** derives the AES-256-GCM key from the password.
- The key and password **never leave the device**; the server receives only
  `salt`, `iv`, `data` (ciphertext).
- Row permissions bind every request to the signed-in user; a leaked token still
  cannot read anyone else's rows.
- Content-Security-Policy limits network calls to the site itself + the Nhost project.
- Data export (JSON) and permanent vault deletion are one click in the app.
- Deleting the account in the dashboard cascades the vault row (`on delete cascade`).

## Limits (free tier)

- Free tier: 500 MB database class + generous monthly active users — effectively
  unlimited for this audience (a full student vault is ~100–300 KB).
- If you outgrow it, the same SQL + permissions move to any Postgres/Hasura
  without app changes.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Private Cloud not configured" | `nexus-cloud.json` empty or not deployed yet |
| `Email or password is incorrect` | Wrong email/password — or typo'd subdomain (signup may have gone to another project) |
| "Confirm your email first" | Click the verification link (or turn Confirm email off in Authentication settings) |
| `Vault table missing` | SQL in Step 2 not run (or run in the wrong project) |
| `Vault permission denied` | Step 3 permissions not saved (all four operations, role `user`) |
| CORS error on sign-in | Step 5 — add your site origin under Settings → CORS |
| Sign-in loop after email confirm | Sign in again from the site (the confirmation tab carries no session) |
