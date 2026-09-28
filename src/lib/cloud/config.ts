/**
 * NEXUS Private Cloud — runtime configuration.
 * Values live in /public/nexus-cloud.json so credentials can be updated
 * without a rebuild (see docs/CLOUD_SETUP.md).
 *
 * Backend: Nhost (email/password auth + Postgres exposed through GraphQL).
 * All protection comes from role-based row permissions + client-side
 * end-to-end encryption; the server never sees plaintext.
 */
export interface CloudConfig {
  /** Nhost project subdomain (shown on the project overview). */
  subdomain: string;
  /** Nhost region, e.g. ap-south-1 (shown on the project overview). */
  region: string;
  /** Explicit service URLs — used by tests; win over subdomain/region when both set. */
  authUrl?: string;
  graphqlUrl?: string;
}

let cached: CloudConfig | null | undefined;

const TAG = /^[a-z0-9][a-z0-9-]*$/i;

export async function loadCloudConfig(): Promise<CloudConfig | null> {
  if (cached !== undefined) return cached;
  try {
    const res = await fetch('nexus-cloud.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config missing');
    const json = (await res.json()) as Partial<CloudConfig>;
    const subdomain = String(json.subdomain || '').trim();
    const region = String(json.region || '').trim();
    const authUrl = String(json.authUrl || '').trim().replace(/\/+$/, '');
    const graphqlUrl = String(json.graphqlUrl || '').trim().replace(/\/+$/, '');
    const explicit =
      Boolean(authUrl && graphqlUrl) &&
      (authUrl.startsWith('https://') ||
        authUrl.startsWith('http://127.0.0.1') ||
        authUrl.startsWith('http://localhost'));
    const pair =
      Boolean(subdomain && region) && TAG.test(subdomain) && TAG.test(region);
    cached = explicit
      ? { subdomain, region, authUrl, graphqlUrl }
      : pair
        ? { subdomain, region }
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
