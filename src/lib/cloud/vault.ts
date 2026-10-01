/**
 * NEXUS Private Cloud — vault orchestration over the GitHub RepoDB.
 *
 * Storage policy on the device:
 *   makaut-nexus:v1          plaintext app state (as always — this device is yours)
 *   nexus:session            login session, TAB-scoped (sessionStorage) — the
 *                            GitHub sync key lives here and dies with the tab
 *   nexus:vaultkey            unlocked AES key + salt after sign-in (re-locks on sign-out)
 *   nexus:v1:dirtyAt          epoch ms of the last local change (drives sync conflicts)
 *   nexus:v1:lastSync         epoch ms of the last successful save
 *   nexus:v1:backup           automatic pre-pull rollback copy (one generation)
 *   nexus:db:accounts         device cache of the hashed account index
 *   nexus:db:vault:<id>       device copy of the encrypted vault file
 *
 * Conflict policy is last-writer-wins by wall clock:
 *   - local changed after the cloud row was written -> PUSH (keep newer local)
 *   - cloud row is newer                          -> PULL (local copied to backup first)
 * The repository only ever receives AES-GCM ciphertext + hashed identities.
 */
import type { CloudConfig } from './config';
import {
  identityId, maskEmail, maskPhone, normalizeEmail, normalizePhone, passwordHash,
  verifyGithub, type AuthMethod,
} from './auth';
import {
  readAccounts, writeAccounts, readVaultFile, writeVaultFile, deleteVaultFile,
  vaultRowOf, type AccountRecord, type AccountsFile, type VaultFile, type VaultRow,
} from './db';
import { decryptJson, deriveVaultKey, encryptJson, exportKeyB64, importKeyB64, randomB64 } from './crypto';
import {
  assertPasskey, generateBackupCode, normalizeBackupCode,
  passkeyAvailable, verifyAssertion,
} from './webauthn';

const SESSION_KEY = 'nexus:session';
const VAULT_KEY = 'nexus:vaultkey';
const DIRTY_KEY = 'nexus:v1:dirtyAt';
const LAST_SYNC_KEY = 'nexus:v1:lastSync';
const BACKUP_KEY = 'nexus:v1:backup';
const LOCAL_KEY = 'makaut-nexus:v1';
const LOCAL_ACCOUNTS_KEY = 'nexus:db:accounts';
const LOCAL_VAULT_PREFIX = 'nexus:db:vault:';
/** Sessions never expire server-side; 10 years keeps JSON round-trips sane. */
const SESSION_TTL_MS = 10 * 365 * 24 * 3600 * 1000;

export interface UnlockedVault {
  key: CryptoKey;
  salt: string;
}

export interface Session {
  access: string;
  refresh: string;
  expiresAt: number;
  userId: string;
  email: string;
  method: AuthMethod;
  /** GitHub sync key (PAT) — held in this tab only, never committed */
  pat: string;
}

export type { AuthMethod };

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
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    return s && s.userId && s.method ? s : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
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

/* ── device caches (used when no sync key is present) ───────────── */

function readLocalAccounts(): AccountsFile {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (!raw) return { accounts: [] };
    const j = JSON.parse(raw) as AccountsFile;
    return Array.isArray(j.accounts) ? j : { accounts: [] };
  } catch {
    return { accounts: [] };
  }
}

function writeLocalAccounts(file: AccountsFile): void {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(file));
  } catch { /* ignore */ }
}

function readLocalVault(id: string): VaultFile | null {
  try {
    const raw = localStorage.getItem(LOCAL_VAULT_PREFIX + id);
    if (!raw) return null;
    const j = JSON.parse(raw) as VaultFile;
    return j && j.v === 1 && j.id === id ? j : null;
  } catch {
    return null;
  }
}

function writeLocalVault(file: VaultFile): void {
  try {
    localStorage.setItem(LOCAL_VAULT_PREFIX + file.id, JSON.stringify(file));
  } catch { /* ignore */ }
}

function dropLocalVault(id: string): void {
  try {
    localStorage.removeItem(LOCAL_VAULT_PREFIX + id);
  } catch { /* ignore */ }
}

/** Merge an account into the device cache (idempotent). */
function cacheAccount(record: AccountRecord): void {
  const file = readLocalAccounts();
  const next = file.accounts.filter((a) => a.id !== record.id);
  next.push(record);
  writeLocalAccounts({ accounts: next });
}

/* ── remote helpers ─────────────────────────────────────────────── */

async function loadAccounts(cfg: CloudConfig, pat?: string): Promise<AccountsFile> {
  if (pat) {
    try {
      const remote = await readAccounts(cfg, pat);
      if (remote.accounts.length) {
        // merge device-only records in so nothing is ever lost
        const local = readLocalAccounts();
        const known = new Set(remote.accounts.map((a) => a.id));
        const extra = local.accounts.filter((a) => !known.has(a.id));
        if (extra.length) return { accounts: [...remote.accounts, ...extra] };
        return remote;
      }
    } catch { /* fall back to device */ }
  }
  return readLocalAccounts();
}

async function loadVault(cfg: CloudConfig, id: string, pat?: string): Promise<VaultFile | null> {
  if (pat) {
    try {
      const remote = await readVaultFile(cfg, id, pat);
      if (remote) return remote;
    } catch { /* fall back to device */ }
  }
  return readLocalVault(id);
}

function makeSession(method: AuthMethod, userId: string, display: string, pat: string): Session {
  return {
    access: pat || 'local',
    refresh: '',
    expiresAt: Date.now() + SESSION_TTL_MS,
    userId,
    email: display,
    method,
    pat,
  };
}

/* ── auth flows ─────────────────────────────────────────────────── */

export interface AuthInput {
  /** email address, E.164 phone (github tab passes '' here) */
  identifier: string;
  password: string;
  method: AuthMethod;
  dial?: string;
  /** optional GitHub sync key (PAT) for repo persistence */
  syncPat?: string;
  /** freshly created passkey to enroll at sign-up (email/phone) */
  passkey?: { credId: string; pub: string };
  /** one-time backup code — alternative to the device prompt at sign-in */
  passkeyBackup?: string;
}

export type LoginResult =
  | { ok: true; session: Session; vault: UnlockedVault; remote: VaultRow | null; note?: string; deviceLock?: boolean }
  | { ok: false; error: string };

/**
 * Second-factor gate for accounts with Device Lock enabled: a one-time
 * WebAuthn challenge (fingerprint/face/PIN) or the written backup code.
 * Password has already been proven when this runs.
 */
async function deviceGate(
  record: AccountRecord,
  input: AuthInput,
): Promise<{ ok: boolean; error?: string }> {
  const pk = record.pk;
  if (!pk) return { ok: true };
  if (input.passkeyBackup) {
    if (!pk.backup) return { ok: false, error: 'This account has no backup code on file.' };
    const h = await passwordHash(normalizeBackupCode(input.passkeyBackup), pk.backup.salt);
    if (h !== pk.backup.hash) return { ok: false, error: 'Wrong backup code for this account.' };
    return { ok: true };
  }
  if (!passkeyAvailable()) {
    return {
      ok: false,
      error: 'Device Lock is required for this account — enter your backup code, or open it in a browser with device-lock support.',
    };
  }
  try {
    const parts = await assertPasskey(pk.credId);
    if (!(await verifyAssertion(pk.credId, pk.pub, parts))) {
      return { ok: false, error: 'Device check failed — try again or use your backup code.' };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Device check failed.';
    return { ok: false, error: `${msg} — try again or use your backup code.` };
  }
}

export async function login(cfg: CloudConfig, input: AuthInput): Promise<LoginResult> {
  try {
    let id: string;
    let display: string;
    let pat = '';
    let record: AccountRecord | null = null;
    let e2eSecret: string;
    let note: string | undefined;

    if (input.method === 'github') {
      const prof = await verifyGithub(input.password, cfg.apiBase);
      pat = input.password;
      id = await identityId('github', `${prof.id}:${prof.login}`);
      display = prof.login;
      e2eSecret = pat;
      const file = await loadAccounts(cfg, pat);
      record = file.accounts.find((a) => a.id === id) || null;
      if (!record) {
        record = {
          id,
          method: 'github',
          display,
          gh: { login: prof.login, id: prof.id },
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
        };
        file.accounts.push(record);
        cacheAccount(record);
        try {
          await writeAccounts(cfg, file, `db: account github:${prof.login}`, pat);
        } catch {
          note = 'Saved on this device — GitHub sync key lacks Contents: Write.';
        }
      }
    } else {
      const normalized =
        input.method === 'email' ? normalizeEmail(input.identifier) : normalizePhone(input.dial || '', input.identifier);
      id = await identityId(input.method, normalized);
      display = input.method === 'email' ? maskEmail(normalized) : maskPhone(normalized);
      const file = await loadAccounts(cfg, input.syncPat);
      record = file.accounts.find((a) => a.id === id) || null;
      if (!record) throw new Error('No account with those details — create one first.');
      if (!record.auth) throw new Error('This account cannot be opened with a password.');
      const hash = await passwordHash(input.password, record.auth.salt);
      if (hash !== record.auth.hash) throw new Error('Wrong password for this account.');
      pat = input.syncPat || '';
      e2eSecret = input.password;
      cacheAccount(record);
    }

    // Device Lock (OTP-equivalent): one-time challenge before the vault opens.
    const gate = await deviceGate(record, input);
    if (!gate.ok) return { ok: false, error: gate.error || 'Device check failed.' };

    // The vault salt proves which key opens the remote ciphertext.
    const existing = await loadVault(cfg, id, pat || undefined);
    const salt = existing?.salt || randomB64(16);
    const key = await deriveVaultKey(e2eSecret, salt);
    if (existing) {
      try {
        await decryptJson(key, { iv: existing.iv, data: existing.data });
      } catch {
        return {
          ok: false,
          error:
            input.method === 'github'
              ? 'This GitHub key cannot open your vault — use the key you originally signed up with.'
              : 'This password does not match your encrypted vault.',
        };
      }
    }
    const session = makeSession(input.method, id, display, pat);
    saveSession(session);
    storeVault(id, { key, salt });
    return {
      ok: true, session, vault: { key, salt },
      remote: existing ? vaultRowOf(existing) : null, note,
      deviceLock: !!record.pk,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Sign-in failed.' };
  }
}

export type RegisterResult =
  | { ok: true; needsConfirm: false; session: Session; vault: UnlockedVault; note?: string; backupCode?: string; deviceLock?: boolean }
  | { ok: false; error: string };

export async function register(cfg: CloudConfig, input: AuthInput): Promise<RegisterResult> {
  try {
    if (input.method === 'github') {
      // GitHub accounts are provisioned automatically on first sign-in.
      return { ok: false, error: 'Use Sign in — your GitHub account is created on first use.' };
    }
    const normalized =
      input.method === 'email' ? normalizeEmail(input.identifier) : normalizePhone(input.dial || '', input.identifier);
    if (input.password.length < 8) throw new Error('Password must be at least 8 characters.');
    const id = await identityId(input.method, normalized);
    const display = input.method === 'email' ? maskEmail(normalized) : maskPhone(normalized);
    const file = await loadAccounts(cfg, input.syncPat);
    if (file.accounts.some((a) => a.id === id)) {
      throw new Error('An account with these details already exists — sign in instead.');
    }
    const salt = randomB64(16);
    const record: AccountRecord = {
      id,
      method: input.method,
      display,
      auth: { salt, hash: await passwordHash(input.password, salt) },
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };
    // Device Lock enrollment — backup code is returned to the UI exactly once.
    let backupCode: string | undefined;
    if (input.passkey) {
      const code = generateBackupCode();
      const bsalt = randomB64(16);
      record.pk = {
        credId: input.passkey.credId,
        pub: input.passkey.pub,
        backup: { salt: bsalt, hash: await passwordHash(code, bsalt) },
        created: new Date().toISOString(),
      };
      backupCode = code;
    }
    file.accounts.push(record);
    cacheAccount(record);

    let note: string | undefined;
    if (input.syncPat) {
      try {
        await writeAccounts(cfg, file, `db: account ${input.method}:${display}`, input.syncPat);
      } catch (e) {
        note = e instanceof Error ? e.message : 'Repo save failed.';
      }
    } else {
      note = 'Saved on this device — add a GitHub sync key to also save it in the repository.';
    }

    const vaultSalt = randomB64(16);
    const key = await deriveVaultKey(input.password, vaultSalt);
    const session = makeSession(input.method, id, display, input.syncPat || '');
    saveSession(session);
    storeVault(id, { key, salt: vaultSalt });
    return {
      ok: true, needsConfirm: false as const, session,
      vault: { key, salt: vaultSalt }, note, backupCode,
      deviceLock: !!record.pk,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Sign-up failed.' };
  }
}

export async function refreshSession(_cfg: CloudConfig): Promise<Session | null> {
  const s = loadSession();
  if (!s) return null;
  if (Date.now() > s.expiresAt - 60_000) {
    clearSession();
    return null;
  }
  return s;
}

export async function signOut(_cfg: CloudConfig): Promise<void> {
  clearSession();
  relockVault(); // vault re-locks; local data stays on the device
}

/** Whether the current device cache shows Device Lock for this user. */
export function hasDeviceLock(userId: string): boolean {
  return !!readLocalAccounts().accounts.find((a) => a.id === userId)?.pk;
}

/**
 * Enroll (or refresh) Device Lock for the signed-in account. The backup code
 * is generated here and returned once — the UI must show it immediately.
 */
export async function enrollDeviceLock(
  cfg: CloudConfig,
  session: Session,
  credential: { credId: string; pub: string },
): Promise<{ ok: boolean; error?: string; backupCode?: string; note?: string }> {
  try {
    const file = await loadAccounts(cfg, session.pat || undefined);
    const record = file.accounts.find((a) => a.id === session.userId);
    if (!record) return { ok: false, error: 'Account not found — sign in again.' };
    if (record.pk?.credId === credential.credId) return { ok: true };
    const code = generateBackupCode();
    const bsalt = randomB64(16);
    record.pk = {
      credId: credential.credId,
      pub: credential.pub,
      backup: { salt: bsalt, hash: await passwordHash(code, bsalt) },
      created: new Date().toISOString(),
    };
    record.updated = new Date().toISOString();
    cacheAccount(record);
    let note: string | undefined;
    if (session.pat) {
      try {
        await writeAccounts(cfg, file, `db: device-lock ${session.method}:${session.email}`, session.pat);
      } catch {
        note = 'Saved on this device — add a GitHub sync key to share the lock across devices.';
      }
    } else {
      note = 'Saved on this device — add a GitHub sync key to share the lock across devices.';
    }
    return { ok: true, backupCode: code, note };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Device Lock setup failed.' };
  }
}

/* ── sync primitives ────────────────────────────────────────────── */

export async function fetchVault(cfg: CloudConfig, session: Session): Promise<VaultRow | null> {
  const file = await loadVault(cfg, session.userId, session.pat || undefined);
  return file ? vaultRowOf(file) : null;
}

export async function pushVault(
  cfg: CloudConfig,
  session: Session,
  vault: UnlockedVault,
  stateJson: string,
): Promise<void> {
  const sealed = await encryptJson(vault.key, stateJson);
  const file: VaultFile = {
    v: 1,
    id: session.userId,
    updated: new Date().toISOString(),
    salt: vault.salt,
    iv: sealed.iv,
    data: sealed.data,
  };
  writeLocalVault(file); // device copy first — never lose data
  if (session.pat) {
    await writeVaultFile(cfg, file, `db: vault ${session.userId.slice(0, 8)}`, session.pat);
  }
  setLastSync(Date.now());
  clearDirty();
}

export async function pullVault(
  cfg: CloudConfig,
  session: Session,
  vault: UnlockedVault,
): Promise<string | null> {
  const file = await loadVault(cfg, session.userId, session.pat || undefined);
  if (!file) return null;
  const json = await decryptJson(vault.key, { iv: file.iv, data: file.data });
  writeLocalVault(file);
  backupLocalState();
  setLastSync(Date.now());
  clearDirty();
  return json;
}

export async function destroyVault(cfg: CloudConfig): Promise<void> {
  const s = loadSession();
  setLastSync(0);
  clearDirty();
  if (!s) return;
  dropLocalVault(s.userId);
  if (s.pat) {
    await deleteVaultFile(cfg, s.userId, `db: erase vault ${s.userId.slice(0, 8)}`, s.pat);
  }
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
