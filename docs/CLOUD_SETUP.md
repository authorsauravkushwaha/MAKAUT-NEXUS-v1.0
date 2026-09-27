# NEXUS Private Cloud — 5-minute setup (no coding)

NEXUS ID gives students login + an **encrypted** cloud database so progress never
disappears when they change devices. The app is fully functional without this —
setup only activates sign-in.

## Why this stack

| Requirement | How it is met |
| --- | --- |
| Login | Supabase Auth (email + password, JWT + refresh, rate-limited) |
| Database | Supabase Postgres (free tier: 500 MB DB — holds thousands of students) |
| "Unlimited privacy" | **Zero-knowledge**: AES-256-GCM encryption happens in the browser; the DB stores ciphertext only |
| Isolation | Postgres Row Level Security — every row bound to `auth.uid()`; the public anon key cannot bypass it |
| No tracking | No cookies/analytics; only the account itself |
| Cost | Free tier is enough; no card required |

## Step 1 — Create the project

1. Go to <https://supabase.com> → **Start your project** (GitHub sign-in is fine) → **New project**.
2. Name: `makaut-nexus` · set a database password (any strong password) · Region: closest (e.g. Mumbai).
3. Wait ~2 minutes for the project to be ready.

## Step 2 — Create the vault table

Dashboard → **SQL Editor** → **New query** → paste this entire block → **Run**:

```sql
-- Encrypted per-user vault (ciphertext only — server cannot read it)
create table if not exists public.nexus_vaults (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  salt       text not null,
  iv         text not null,
  data       text not null,
  updated_at timestamptz not null default now()
);

alter table public.nexus_vaults enable row level security;

create policy "read own vault"  on public.nexus_vaults
  for select using (auth.uid() = user_id);
create policy "insert own vault" on public.nexus_vaults
  for insert with check (auth.uid() = user_id);
create policy "update own vault" on public.nexus_vaults
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own vault" on public.nexus_vaults
  for delete using (auth.uid() = user_id);

grant all on public.nexus_vaults to authenticated;
```

You should see `Success. No rows returned`.

## Step 3 — Copy the credentials

Dashboard → **Project Settings** (gear icon) → **API**:

- **Project URL** → looks like `https://abcdefghij.supabase.co`
- **anon public** key → long `eyJ…` string

## Step 4 — Put them in the site

Edit `public/nexus-cloud.json` (easiest: on GitHub.com → `public/nexus-cloud.json` →
pencil icon) so it contains:

```json
{
  "url": "https://abcdefghij.supabase.co",
  "anonKey": "eyJhbGciOi..."
}
```

Commit the change. GitHub Actions redeploys automatically (~45 s). The anon key is
**meant** to be public — RLS + client-side encryption are the actual protection.

## Step 5 — Email settings (recommended)

Dashboard → **Authentication** → **Sign In / Providers** → **Email**:

- **Confirm email**: keep **ON** (students click a link before first sign-in),
  or turn OFF for quicker testing.
- Supabase's built-in mail service handles delivery (check spam on first signup).

## Step 6 — Test

1. Open the site → **Sign in** in the top bar → **Create account**.
2. Confirm email (if enabled) → sign in.
3. Change something (mark a topic, add marks) → watch `Syncing… → Synced`.
4. Open the site on another device/browser with the same account → your data appears.
5. Sign out → local data stays; cloud vault re-locks.

## Security model (what "most secure" means here)

- **PBKDF2-SHA256, 600,000 iterations** derives the AES-256-GCM key from the password.
- The key and password **never leave the device**; server receives only `salt`, `iv`, `data` (ciphertext).
- RLS binds every row to the signed-in user; anon key alone grants nothing.
- Content-Security-Policy + GitHub Pages' default headers (nosniff, frame deny).
- Data export (JSON) and permanent vault deletion are one click in the app.
- Deleting the account in Supabase cascades the vault row (`on delete cascade`).

## Limits (free tier)

- 500 MB database, 50,000 monthly active users — effectively unlimited for this audience
  (a full student vault is ~100–300 KB).
- If you outgrow it, the same SQL migrates to any Postgres without app changes.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| "Private Cloud not configured" | `nexus-cloud.json` empty or not deployed yet |
| `Invalid login credentials` | Wrong email/password, or email not confirmed |
| `relation ... does not exist` | SQL in Step 2 not run (or run in wrong project) |
| CORS error | Project URL copied wrong (must start with `https://` and end without `/`) |
| Sign-in loop after email confirm | Sign in again from the site (the confirmation tab carries no session) |
