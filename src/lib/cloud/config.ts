/**
 * NEXUS Private Cloud — runtime configuration.
 * Values live in /public/nexus-cloud.json so credentials can be updated
 * without a rebuild (see docs/CLOUD_SETUP.md). The anon key is public by
 * design — all protection comes from Row Level Security + client-side
 * end-to-end encryption; the server never sees plaintext.
 */
export interface CloudConfig {
  /** Supabase project URL, e.g. https://abcdefgh.supabase.co */
  url: string;
  /** Supabase anon/publishable key (safe to ship in the client). */
  anonKey: string;
}

let cached: CloudConfig | null | undefined;

export async function loadCloudConfig(): Promise<CloudConfig | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch('nexus-cloud.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config missing');
    const json = (await res.json()) as Partial<CloudConfig>;
    const url = String(json.url || '').trim().replace(/\/+$/, '');
    const anonKey = String(json.anonKey || '').trim();
    cached = url && anonKey && url.startsWith('https://') ? { url, anonKey } : null;
  } catch {
    cached = null;
  }
  return cached;
}

/** Test hook — clears the memoized config. */
export function resetCloudConfigCache(): void {
  cached = undefined;
}
