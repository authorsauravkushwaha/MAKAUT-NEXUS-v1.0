/**
 * NEXUS RepoDB — runtime configuration.
 * Values live in /public/nexus-cloud.json (3 lines, pushed by the setup block).
 * Backend: this GitHub repository itself — no third-party service.
 */
export interface CloudConfig {
  /** "owner/name" of the repository that IS the database */
  repo: string;
  /** folder inside the repo that holds the database files */
  dbPath: string;
  /** branch to read/write (default "main") */
  branch?: string;
  /** test hooks — explicit API bases win over the public defaults */
  apiBase?: string;
  rawBase?: string;
}

let cached: CloudConfig | null | undefined;

const REPO_SLUG = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;
const DB_PATH = /^[A-Za-z0-9._/-]+$/;

export async function loadCloudConfig(): Promise<CloudConfig | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch('nexus-cloud.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config missing');
    const json = (await res.json()) as Partial<CloudConfig>;
    const repo = String(json.repo || '').trim().replace(/\.git$/, '');
    const dbPath = String(json.dbPath || '').trim().replace(/^\/+|\/+$/g, '');
    const branch = String(json.branch || 'main').trim() || 'main';
    const apiBase = String(json.apiBase || '').trim();
    const rawBase = String(json.rawBase || '').trim();
    cached = REPO_SLUG.test(repo) && DB_PATH.test(dbPath) && dbPath.length > 0
      ? { repo, dbPath, branch, ...(apiBase ? { apiBase } : {}), ...(rawBase ? { rawBase } : {}) }
      : null;
  } catch {
    cached = null;
  }
  return cached;
}

/** Test hook — clears the memoized config. */
export function resetCloudConfigCache(): void {
  cached = undefined;
}
