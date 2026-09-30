/* NEXUS DB v2 — the database IS JSON files in this GitHub repository. */
/**
 * Storage layout (all committed under dbPath, default data/nexus-db):
 *   meta.json            schema/counts
 *   accounts.json        hashed ids + masked display (+ public GitHub profile)
 *   vaults/<id>.json     AES-256-GCM ciphertext only (one file per account)
 *
 * Reads : api.github.com contents API when a PAT is available,
 *         raw.githubusercontent.com anonymously otherwise (public repo).
 * Writes: contents API PUT (requires Contents:Write) with 409-retry merge.
 * The PAT is used only in memory — it is never written to any file.
 */
import type { CloudConfig } from './config';
import type { AuthMethod } from './auth';
import { b64FromBytes, bytesFromB64 } from './crypto';

export interface AccountRecord {
  id: string;
  method: AuthMethod;
  /** masked email/phone, or the public GitHub login */
  display: string;
  gh?: { login: string; id: number };
  /** PBKDF2 password proof — the password itself is never stored */
  auth?: { salt: string; hash: string };
  created: string;
  updated: string;
}

export interface AccountsFile {
  accounts: AccountRecord[];
}

export interface VaultFile {
  v: 1;
  id: string;
  updated: string;
  salt: string;
  iv: string;
  data: string;
}

/** Read shape expected by decideSync(). */
export interface VaultRow {
  user_id: string;
  salt: string;
  iv: string;
  data: string;
  updated_at?: string;
}

const ID_RE = /^[a-f0-9]{32}$/;

function apiBase(cfg: CloudConfig): string {
  return (cfg.apiBase || 'https://api.github.com').replace(/\/+$/, '');
}
function rawBase(cfg: CloudConfig): string {
  return (cfg.rawBase || 'https://raw.githubusercontent.com').replace(/\/+$/, '');
}
function branch(cfg: CloudConfig): string {
  return cfg.branch || 'main';
}
function apiHeaders(pat?: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    ...(pat ? { Authorization: `Bearer ${pat}` } : {}),
  };
}
function decodeContent(b64: string): string {
  return new TextDecoder().decode(bytesFromB64(b64.replace(/\n/g, '')));
}

async function getContents(
  cfg: CloudConfig,
  path: string,
  pat?: string,
): Promise<{ sha: string | null; text: string | null }> {
  if (pat) {
    let res: Response;
    try {
      res = await fetch(
        `${apiBase(cfg)}/repos/${cfg.repo}/contents/${path}?ref=${branch(cfg)}`,
        { headers: apiHeaders(pat) },
      );
    } catch {
      throw new Error('Cannot reach GitHub — check your internet connection.');
    }
    if (res.status === 404) return { sha: null, text: null };
    if (!res.ok) {
      throw new Error(
        res.status === 401
          ? 'GitHub rejected your sync key — sign in again with a fresh token.'
          : `GitHub contents API said HTTP ${res.status}.`,
      );
    }
    const j = (await res.json()) as { sha?: string; content?: string };
    if (typeof j.content !== 'string') return { sha: j.sha ?? null, text: null };
    return { sha: j.sha ?? null, text: decodeContent(j.content) };
  }
  // anonymous read via raw (public repo)
  let res: Response;
  try {
    res = await fetch(`${rawBase(cfg)}/${cfg.repo}/${branch(cfg)}/${path}?t=${Date.now()}`, {
      cache: 'no-store',
    });
  } catch {
    throw new Error('Cannot reach GitHub — check your internet connection.');
  }
  if (res.status === 404) return { sha: null, text: null };
  if (!res.ok) {
    throw new Error(
      'Cannot read the database anonymously — if the repo is private, add your GitHub sync key.',
    );
  }
  return { sha: null, text: await res.text() };
}

async function putContents(
  cfg: CloudConfig,
  path: string,
  text: string,
  message: string,
  pat: string,
): Promise<void> {
  const content = b64FromBytes(new TextEncoder().encode(text));
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { sha } = await getContents(cfg, path, pat);
    let res: Response;
    try {
      res = await fetch(`${apiBase(cfg)}/repos/${cfg.repo}/contents/${path}`, {
        method: 'PUT',
        headers: { ...apiHeaders(pat), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, content, branch: branch(cfg), ...(sha ? { sha } : {}) }),
      });
    } catch {
      throw new Error('Cannot reach GitHub — check your internet connection.');
    }
    if (res.ok) return;
    if (res.status === 409) continue; // sha raced — refetch and retry
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        'GitHub write denied — your sync key needs Contents: Write on this repository (owner must add you as collaborator).',
      );
    }
    if (res.status === 404) {
      throw new Error('Repository or path not found — check nexus-cloud.json.');
    }
    throw new Error(`GitHub said HTTP ${res.status} while saving.`);
  }
  throw new Error('Database was busy (concurrent updates) — try saving again.');
}

async function deleteContents(
  cfg: CloudConfig,
  path: string,
  message: string,
  pat: string,
): Promise<void> {
  const { sha } = await getContents(cfg, path, pat);
  if (!sha) return; // already gone
  let res: Response;
  try {
    res = await fetch(`${apiBase(cfg)}/repos/${cfg.repo}/contents/${path}`, {
      method: 'DELETE',
      headers: { ...apiHeaders(pat), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, branch: branch(cfg), sha }),
    });
  } catch {
    throw new Error('Cannot reach GitHub — check your internet connection.');
  }
  if (!res.ok && res.status !== 404 && res.status !== 409) {
    throw new Error(
      res.status === 401 || res.status === 403
        ? 'GitHub write denied — your sync key needs Contents: Write on this repository.'
        : `GitHub said HTTP ${res.status} while deleting.`,
    );
  }
}

function assertId(id: string): void {
  if (!ID_RE.test(id)) throw new Error('Bad account id — refusing to touch the database.');
}

/* ── accounts ──────────────────────────────────────────────────── */

export async function readAccounts(
  cfg: CloudConfig,
  pat?: string,
): Promise<AccountsFile> {
  const { text } = await getContents(cfg, `${cfg.dbPath}/accounts.json`, pat);
  if (!text) return { accounts: [] };
  try {
    const j = JSON.parse(text) as AccountsFile;
    return Array.isArray(j.accounts) ? j : { accounts: [] };
  } catch {
    return { accounts: [] };
  }
}

export async function writeAccounts(
  cfg: CloudConfig,
  file: AccountsFile,
  message: string,
  pat: string,
): Promise<void> {
  await putContents(cfg, `${cfg.dbPath}/accounts.json`, `${JSON.stringify(file, null, 2)}\n`, message, pat);
}

/* ── vaults (one encrypted file per account) ───────────────────── */

export async function readVaultFile(
  cfg: CloudConfig,
  id: string,
  pat?: string,
): Promise<VaultFile | null> {
  assertId(id);
  const { text } = await getContents(cfg, `${cfg.dbPath}/vaults/${id}.json`, pat);
  if (!text) return null;
  try {
    const j = JSON.parse(text) as VaultFile;
    return j && j.v === 1 && j.id === id && j.salt && j.iv && j.data ? j : null;
  } catch {
    return null;
  }
}

export function vaultRowOf(v: VaultFile): VaultRow {
  return { user_id: v.id, salt: v.salt, iv: v.iv, data: v.data, updated_at: v.updated };
}

export async function writeVaultFile(
  cfg: CloudConfig,
  file: VaultFile,
  message: string,
  pat: string,
): Promise<void> {
  assertId(file.id);
  await putContents(
    cfg,
    `${cfg.dbPath}/vaults/${file.id}.json`,
    `${JSON.stringify(file, null, 2)}\n`,
    message,
    pat,
  );
}

export async function deleteVaultFile(
  cfg: CloudConfig,
  id: string,
  message: string,
  pat: string,
): Promise<void> {
  assertId(id);
  await deleteContents(cfg, `${cfgPath(cfg, id)}`, message, pat);
}

function cfgPath(cfg: CloudConfig, id: string): string {
  return `${cfg.dbPath}/vaults/${id}.json`;
}
