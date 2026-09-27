/**
 * Supabase REST client implemented with plain `fetch`.
 *
 * Deliberately dependency-free: shipping supabase-js would require rewriting
 * package-lock.json through a paste transfer, and this app needs only four
 * calls (signup, login, refresh, vault upsert/select/delete). Endpoints match
 * the public GoTrue (auth) and PostgREST (data) contracts.
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

function authHeaders(cfg: CloudConfig, access?: string): HeadersInit {
  const h: Record<string, string> = {
    apikey: cfg.anonKey,
    'Content-Type': 'application/json',
  };
  if (access) h.Authorization = `Bearer ${access}`;
  return h;
}

async function readError(res: Response): Promise<string> {
  let msg = `HTTP ${res.status}`;
  try {
    const j = await res.json();
    msg = String(j.msg || j.message || j.error_description || j.error || msg);
  } catch {
    /* keep status text */
  }
  const map: Record<string, string> = {
    'Invalid login credentials': 'Email or password is incorrect.',
    'User already registered': 'An account with this email already exists — sign in instead.',
    'Email not confirmed': 'Confirm your email first (check your inbox / spam), then sign in.',
    'Password should be at least': 'Password must be at least 8 characters.',
    'rate limit': 'Too many attempts — wait a minute and try again.',
  };
  for (const [k, v] of Object.entries(map)) if (msg.includes(k)) return v;
  return msg;
}

async function call(
  cfg: CloudConfig,
  path: string,
  init: { method?: string; body?: unknown; access?: string; headers?: Record<string, string> },
): Promise<Response> {
  const res = await fetch(`${cfg.url}${path}`, {
    method: init.method || 'GET',
    headers: { ...authHeaders(cfg, init.access), ...(init.headers || {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!res.ok) throw new CloudError(await readError(res));
  return res;
}

function sessionFrom(j: Record<string, unknown>): Session {
  const expiresIn = Number(j.expires_in ?? 3600);
  const user = (j.user || {}) as { id?: string; email?: string };
  return {
    access: String(j.access_token || ''),
    refresh: String(j.refresh_token || ''),
    expiresAt: Date.now() + expiresIn * 1000,
    userId: String(user.id || ''),
    email: String(user.email || ''),
  };
}

/** Create account. If email confirmation is on, returns needsConfirm (no session yet). */
export async function signUp(
  cfg: CloudConfig,
  email: string,
  password: string,
): Promise<{ session: Session | null; needsConfirm: boolean }> {
  const res = await call(cfg, '/auth/v1/signup', {
    method: 'POST',
    body: { email, password },
  });
  const j = (await res.json()) as Record<string, unknown>;
  if (j.access_token) return { session: sessionFrom(j), needsConfirm: false };
  return { session: null, needsConfirm: true };
}

export async function signIn(cfg: CloudConfig, email: string, password: string): Promise<Session> {
  const res = await call(cfg, '/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
  return sessionFrom((await res.json()) as Record<string, unknown>);
}

export async function refreshSession(cfg: CloudConfig, refreshToken: string): Promise<Session> {
  const res = await call(cfg, '/auth/v1/token?grant_type=refresh_token', {
    method: 'POST',
    body: { refresh_token: refreshToken },
  });
  return sessionFrom((await res.json()) as Record<string, unknown>);
}

export async function signOut(cfg: CloudConfig, session: Session): Promise<void> {
  try {
    await call(cfg, '/auth/v1/logout', { method: 'POST', access: session.access });
  } catch {
    /* best effort — local session is cleared regardless */
  }
}

/** Fetch this user's encrypted vault row (RLS guarantees isolation). */
export async function fetchVault(cfg: CloudConfig, session: Session): Promise<VaultRow | null> {
  const res = await call(
    cfg,
    `/rest/v1/nexus_vaults?select=*&user_id=eq.${encodeURIComponent(session.userId)}`,
    { access: session.access },
  );
  const rows = (await res.json()) as VaultRow[];
  return rows[0] || null;
}

/** Insert-or-replace this user's vault row. */
export async function saveVault(
  cfg: CloudConfig,
  session: Session,
  row: { salt: string; iv: string; data: string },
): Promise<void> {
  await call(cfg, '/rest/v1/nexus_vaults?on_conflict=user_id', {
    method: 'POST',
    access: session.access,
    headers: {
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: { user_id: session.userId, ...row },
  });
}

/** Permanently delete this user's vault row (data sovereignty). */
export async function deleteVault(cfg: CloudConfig, session: Session): Promise<void> {
  await call(
    cfg,
    `/rest/v1/nexus_vaults?user_id=eq.${encodeURIComponent(session.userId)}`,
    { method: 'DELETE', access: session.access },
  );
}
