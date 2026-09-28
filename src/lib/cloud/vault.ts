/**
 * NEXUS Private Cloud — vault orchestration.
 *
 * Storage policy on the device:
 *   makaut-nexus:v1          plaintext app state (as always — this device is yours)
 *   nexus:session             Nhost auth session (short-lived access + refresh token)
 *   nexus:vaultkey            unlocked AES key + salt after sign-in (re-locks on sign-out)
 *   nexus:v1:dirtyAt          epoch ms of the last local change (drives sync conflicts)
 *   nexus:v1:lastSync         epoch ms of the last successful cloud sync
 *   nexus:v1:backup           automatic pre-pull rollback copy (one generation)
 *
 * Conflict policy is last-writer-wins by wall clock:
 *   - local changed after the cloud row was written -> PUSH (keep newer local)
 *   - cloud row is newer                          -> PULL (local copied to backup first)
 * The server only ever receives AES-GCM ciphertext.
 */
import type { CloudConfig } from './config';
import type { Session, VaultRow } from './client';
import {
  fetchVault, refreshSession as refreshSessionApi, saveVault, deleteVault as deleteVaultApi,
  signIn as signInApi, signUp as signUpApi, signOut as signOutApi,
} from './client';
import { decryptJson, deriveVaultKey, encryptJson, exportKeyB64, importKeyB64, randomB64 } from './crypto';

const SESSION_KEY = 'nexus:session';
const VAULT_KEY = 'nexus:vaultkey';
const DIRTY_KEY = 'nexus:v1:dirtyAt';
const LAST_SYNC_KEY = 'nexus:v1:lastSync';
const BACKUP_KEY = 'nexus:v1:backup';
const LOCAL_KEY = 'makaut-nexus:v1';

export interface UnlockedVault {
  key: CryptoKey;
  salt: string;
}

/* ── local bookkeeping ──────────────────────────────────────────── */

export function markDirty(): void {
  try {
    localStorage.setItem(DIRTY_KEY, String(Date.now()));
  } catch { /* ignore */ }
}

export function dirtyAt(): number {
  return Number(localStorage.getItem(DIRTY_KEY) || 0);
}

export function clearDirty(): void {
  localStorage.removeItem(DIRTY_KEY);
}

export function lastSyncAt(): number {
  return Number(localStorage.getItem(LAST_SYNC_KEY) || 0);
}

function setLastSync(ms: number): void {
  try {
    localStorage.setItem(LAST_SYNC_KEY, String(ms));
  } catch { /* ignore */ }
}

export function readLocalState(): string | null {
  try {
    return localStorage.getItem(LOCAL_KEY);
  } catch {
    return null;
  }
}

export function backupLocalState(): void {
  const raw = readLocalState();
  if (!raw) return;
  try {
    localStorage.setItem(BACKUP_KEY, raw);
  } catch { /* ignore */ }
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.access && s.refresh && s.userId ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function restoreVault(userId: string): Promise<UnlockedVault | null> {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as { userId: string; salt: string; key: string };
    if (v.userId !== userId || !v.salt || !v.key) return null;
    return { salt: v.salt, key: await importKeyB64(v.key) };
  } catch {
    return null;
  }
}

export function storeVault(userId: string, vault: UnlockedVault): void {
  void (async () => {
    try {
      const exported = await exportKeyB64(vault.key);
      localStorage.setItem(
        VAULT_KEY,
        JSON.stringify({ userId, salt: vault.salt, key: exported }),
      );
    } catch { /* ignore */ }
  })();
}

export function relockVault(): void {
  localStorage.removeItem(VAULT_KEY);
}

/* ── auth flows ─────────────────────────────────────────────────── */

export type LoginResult =
  | { ok: true; session: Session; vault: UnlockedVault; remote: VaultRow | null }
  | { ok: false; error: string };

export async function login(
  cfg: CloudConfig,
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const session = await signInApi(cfg, email, password);
    const remote = await fetchVault(cfg, session);
    // Always derive freshly from the password so the key is proven correct.
    const salt = remote?.salt || randomB64(16);
    const key = await deriveVaultKey(password, salt);
    if (remote) {
      try {
        await decryptJson(key, { iv: remote.iv, data: remote.data });
      } catch {
        return { ok: false, error: 'This password does not match your encrypted vault.' };
      }
    }
    saveSession(session);
    storeVault(session.userId, { key, salt });
    return { ok: true, session, vault: { key, salt }, remote };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Sign-in failed.' };
  }
}

export type RegisterResult =
  | { ok: true; needsConfirm: false; session: Session; vault: UnlockedVault }
  | { ok: true; needsConfirm: true }
  | { ok: false; error: string };

export async function register(
  cfg: CloudConfig,
  email: string,
  password: string,
): Promise<RegisterResult> {
  try {
    const { session, needsConfirm } = await signUpApi(cfg, email, password);
    if (needsConfirm) return { ok: true, needsConfirm: true as const };
    const salt = randomB64(16);
    const key = await deriveVaultKey(password, salt);
    saveSession(session!);
    storeVault(session!.userId, { key, salt });
    return { ok: true, needsConfirm: false as const, session: session!, vault: { key, salt } };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Sign-up failed.' };
  }
}

export async function refreshSession(cfg: CloudConfig): Promise<Session | null> {
  const s = loadSession();
  if (!s) return null;
  try {
    const next = await refreshSessionApi(cfg, s.refresh);
    saveSession(next);
    return next;
  } catch {
    clearSession();
    return null;
  }
}

export async function signOut(cfg: CloudConfig): Promise<void> {
  const s = loadSession();
  if (s) await signOutApi(cfg, s);
  clearSession();
  relockVault(); // vault re-locks; local data stays on the device
}

/* ── sync primitives ────────────────────────────────────────────── */

export async function pushVault(
  cfg: CloudConfig,
  session: Session,
  vault: UnlockedVault,
  stateJson: string,
): Promise<void> {
  const sealed = await encryptJson(vault.key, stateJson);
  await saveVault(cfg, session, { salt: vault.salt, iv: sealed.iv, data: sealed.data });
  setLastSync(Date.now());
  clearDirty();
}

export async function pullVault(
  cfg: CloudConfig,
  session: Session,
  vault: UnlockedVault,
): Promise<string | null> {
  const row = await fetchVault(cfg, session);
  if (!row) return null;
  const json = await decryptJson(vault.key, { iv: row.iv, data: row.data });
  backupLocalState();
  setLastSync(Date.now());
  clearDirty();
  return json;
}

export async function destroyVault(cfg: CloudConfig): Promise<void> {
  const s = loadSession();
  if (s) await deleteVaultApi(cfg, s);
  setLastSync(0);
  clearDirty();
}

/** Decide the winner after sign-in. Returns 'push' | 'pull'. */
export function decideSync(remote: VaultRow | null): 'push' | 'pull' {
  if (!remote) return 'push';
  const remoteAt = Date.parse(remote.updated_at || '') || 0;
  const localAt = dirtyAt();
  // Local unsaved-after-sync changes win only if they are actually newer.
  if (localAt > remoteAt) return 'push';
  return 'pull';
}
