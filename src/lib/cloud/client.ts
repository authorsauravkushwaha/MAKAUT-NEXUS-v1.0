/**
 * Nhost client implemented with plain `fetch`.
 *
 * Deliberately dependency-free — the app needs only seven calls
 * (signup, login, refresh, logout, vault select/upsert/delete).
 * Contract (docs.nhost.io/reference/auth):
 *   POST {auth}/signup/email-password  {email,password} -> {session|null}
 *   POST {auth}/signin/email-password  {email,password} -> {session,mfa}
 *   POST {auth}/token                  {refreshToken}   -> session (flat)
 *   POST {auth}/signout                Bearer           -> ok (best effort)
 * GraphQL vault access:
 *   POST {graphql}/v1/graphql          Bearer -> {data|errors[]}
 * The server only ever receives AES-GCM ciphertext (see vault.ts).
 */
import type { CloudConfig } from './config';

export interface Session {
  access: string;
  refresh: string;
  /** absolute expiry in epoch ms */
  expiresAt: number;
  userId: string;
  email: string;
}

export interface VaultRow {
  user_id: string;
  salt: string;
  iv: string;
  data: string;
  updated_at?: string;
}

export class CloudError extends Error {}

function authBase(cfg: CloudConfig): string {
  if (cfg.authUrl) return cfg.authUrl.replace(/\/+$/, '');
  return `https://${cfg.subdomain}.auth.${cfg.region}.nhost.run/v1`;
}

/** Candidate GraphQL endpoints — first one that answers wins and is cached. */
let gqlKey: string | null = null;
let gqlUrl: string | null = null;

function graphqlCandidates(cfg: CloudConfig): string[] {
  const key = cfg.graphqlUrl || `${cfg.subdomain}|${cfg.region}`;
  if (gqlKey === key && gqlUrl) return [gqlUrl];
  if (cfg.graphqlUrl) {
    const u = cfg.graphqlUrl.replace(/\/+$/, '');
    return u.endsWith('/graphql') ? [u, u.slice(0, -'/graphql'.length)] : [u, `${u}/graphql`];
  }
  const base = `https://${cfg.subdomain}.graphql.${cfg.region}.nhost.run`;
  return [`${base}/v1/graphql`, `${base}/v1`];
}

async function readError(res: Response): Promise<string> {
  let msg = `HTTP ${res.status}`;
  let code = '';
  try {
    const j = (await res.json()) as Record<string, unknown>;
    msg = String(j.message || j.msg || j.error_description || j.error || msg);
    code = String(j.error || '');
  } catch {
    /* keep status text */
  }
  const map: Record<string, string> = {
    'invalid-email-password': 'Email or password is incorrect.',
    'user-already-exists': 'An account with this email already exists — sign in instead.',
    'unverified-user': 'Confirm your email first (check your inbox / spam), then sign in.',
    'password-too-short': 'Password must be at least 8 characters.',
    'password-in-hibp-database':
      'That password appears in known data breaches — choose a stronger one.',
    'disabled-user': 'This account has been disabled.',
    'signup-disabled': 'Sign-ups are currently disabled for this project.',
    'invalid-refresh-token': 'Session expired — sign in again.',
    'internal-server-error': 'Cloud service hiccup — try again in a minute.',
  };
  if (code && map[code]) return map[code];
  const probes: [string, string][] = [
    ['Email or password is incorrect', 'Email or password is incorrect.'],
    ['already registered', 'An account with this email already exists — sign in instead.'],
    ['already exists', 'An account with this email already exists — sign in instead.'],
    ['not confirmed', 'Confirm your email first (check your inbox / spam), then sign in.'],
    ['Password must be at least', 'Password must be at least 8 characters.'],
    ['rate limit', 'Too many attempts — wait a minute and try again.'],
    ['Too many requests', 'Too many attempts — wait a minute and try again.'],
  ];
  for (const [k, v] of probes) if (msg.includes(k)) return v;
  return msg;
}

async function callAuth(
  cfg: CloudConfig,
  path: string,
  init: { method?: string; body?: unknown; access?: string },
): Promise<Response> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (init.access) h.Authorization = `Bearer ${init.access}`;
  const res = await fetch(`${authBase(cfg)}${path}`, {
    method: init.method || 'GET',
    headers: h,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new CloudError(await readError(res));
  return res;
}

/** Accepts both wrapper ({session}) and flat session response shapes. */
function sessionFrom(j: Record<string, unknown>): Session {
  const s = (j.session && typeof j.session === 'object' ? j.session : j) as Record<string, unknown>;
  const user = (s.user || {}) as { id?: string; email?: string };
  const expiresIn = Number(s.accessTokenExpiresIn ?? s.expires_in ?? 3600);
  return {
    access: String(s.accessToken || s.access_token || ''),
    refresh: String(s.refreshToken || s.refresh_token || ''),
    expiresAt: Date.now() + expiresIn * 1000,
    userId: String(user.id || ''),
    email: String(user.email || ''),
  };
}

/** Create account. If email verification is on, returns needsConfirm (no session yet). */
export async function signUp(
  cfg: CloudConfig,
  email: string,
  password: string,
): Promise<{ session: Session | null; needsConfirm: boolean }> {
  const res = await callAuth(cfg, '/signup/email-password', {
    method: 'POST',
    body: { email, password },
  });
  const j = (await res.json()) as Record<string, unknown>;
  const s = (j.session && typeof j.session === 'object' ? j.session : j) as Record<string, unknown>;
  if (s.accessToken) return { session: sessionFrom(j), needsConfirm: false };
  return { session: null, needsConfirm: true };
}

export async function signIn(cfg: CloudConfig, email: string, password: string): Promise<Session> {
  const res = await callAuth(cfg, '/signin/email-password', {
    method: 'POST',
    body: { email, password },
  });
  const j = (await res.json()) as Record<string, unknown>;
  if (j.mfa) {
    throw new CloudError(
      'Two-factor authentication is not supported in the app — disable MFA for this account in the dashboard.',
    );
  }
  const s = (j.session && typeof j.session === 'object' ? j.session : j) as Record<string, unknown>;
  if (!s.accessToken) throw new CloudError('Sign-in returned no session — try again.');
  return sessionFrom(j);
}

export async function refreshSession(cfg: CloudConfig, refreshToken: string): Promise<Session> {
  const res = await callAuth(cfg, '/token', {
    method: 'POST',
    body: { refreshToken },
  });
  const j = (await res.json()) as Record<string, unknown>;
  const s = sessionFrom(j);
  if (!s.access) throw new CloudError('Session expired — sign in again.');
  return s;
}

export async function signOut(cfg: CloudConfig, session: Session): Promise<void> {
  try {
    await callAuth(cfg, '/signout', {
      method: 'POST',
      access: session.access,
      body: { refreshToken: session.refresh },
    });
  } catch {
    /* best effort — local session is cleared regardless */
  }
}

function humanGql(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('permission') || m.includes('check constraint') || m.includes('not permitted')) {
    return 'Vault permission denied — finish the permissions step in docs/CLOUD_SETUP.md.';
  }
  if (
    (m.includes('relation') && m.includes('does not exist')) ||
    m.includes('unknown table') ||
    (m.includes('nexus_vaults') && m.includes('not found'))
  ) {
    return 'Vault table missing — run the SQL in docs/CLOUD_SETUP.md.';
  }
  return `Cloud error: ${raw}`;
}

async function gql<T>(
  cfg: CloudConfig,
  session: Session,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const tries = graphqlCandidates(cfg);
  for (let i = 0; i < tries.length; i++) {
    const url = tries[i];
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access}`,
      },
      body: JSON.stringify(variables ? { query, variables } : { query }),
    });
    if (res.status === 404 && i + 1 < tries.length) continue;
    if (!res.ok) throw new CloudError(await readError(res));
    const j = (await res.json()) as { data?: T; errors?: { message?: string }[] };
    if (j.errors && j.errors.length) {
      throw new CloudError(humanGql(String(j.errors[0].message || 'GraphQL error')));
    }
    if (j.data === undefined) throw new CloudError('Unexpected cloud response — try again.');
    gqlKey = cfg.graphqlUrl || `${cfg.subdomain}|${cfg.region}`;
    gqlUrl = url;
    return j.data;
  }
  throw new CloudError('GraphQL endpoint not found — check the project subdomain and region.');
}

/** Fetch this user's encrypted vault row (permissions guarantee isolation). */
export async function fetchVault(cfg: CloudConfig, session: Session): Promise<VaultRow | null> {
  const data = await gql<{ nexus_vaults?: VaultRow[] }>(
    cfg,
    session,
    `query { nexus_vaults { user_id salt iv data updated_at } }`,
  );
  return data.nexus_vaults?.[0] || null;
}

/** Insert-or-replace this user's vault row. */
export async function saveVault(
  cfg: CloudConfig,
  session: Session,
  row: { salt: string; iv: string; data: string },
): Promise<void> {
  const data = await gql<{ insert_nexus_vaults?: { affected_rows?: number } }>(
    cfg,
    session,
    `mutation($o: [nexus_vaults_insert_input!]!) {
       insert_nexus_vaults(
         objects: $o,
         on_conflict: { constraint: nexus_vaults_pkey, update_columns: [salt, iv, data, updated_at] }
       ) { affected_rows }
     }`,
    {
      o: [
        {
          user_id: session.userId,
          salt: row.salt,
          iv: row.iv,
          data: row.data,
          updated_at: new Date().toISOString(),
        },
      ],
    },
  );
  if (typeof data.insert_nexus_vaults?.affected_rows !== 'number') {
    throw new CloudError('Vault save was not acknowledged — try again.');
  }
}

/** Permanently delete this user's vault row (data sovereignty). */
export async function deleteVault(cfg: CloudConfig, session: Session): Promise<void> {
  const data = await gql<{ delete_nexus_vaults?: { affected_rows?: number } }>(
    cfg,
    session,
    `mutation { delete_nexus_vaults(where: {}) { affected_rows } }`,
  );
  if (typeof data.delete_nexus_vaults?.affected_rows !== 'number') {
    throw new CloudError('Vault delete was not acknowledged — try again.');
  }
}
