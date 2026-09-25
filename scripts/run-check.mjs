import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

await build({
  entryPoints: [path.join(root, 'scripts/check.ts')],
  outfile: '/tmp/nexus-check.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  logLevel: 'error',
  alias: {
    '@': path.join(root, 'src'),
    '@data': path.join(root, 'data'),
  },
});

const r = spawnSync('node', ['/tmp/nexus-check.cjs'], { stdio: 'inherit' });
process.exit(r.status ?? 0);
