/**
 * NEXUS RepoDB integration test (no third parties, runs against a local mock).
 *
 * Covers:
 *   1. email signup -> account committed to the mock repo
 *   2. email sign-in (wrong password rejected, right password opens vault)
 *   3. vault push -> pull -> decrypt round trip via repo files
 *   4. github sign-in (PAT verified against mock /user) + auto-provisioned account
 *   5. phone signup/signin with country dial code + masked display
 *   6. privacy: committed files never contain the raw email/phone/password/PAT
 *   7. write-permission failure surfaces the actionable 403 message
 *   8. device-local (no sync key) signup still works
 *
 * Run:  npx esbuild --bundle scripts/test-repodb.mjs --platform=node \
 *         --format=cjs --outfile=/tmp/nexusdb.test.cjs && node /tmp/nexusdb.test.cjs
 */
import { createServer } from 'node:http';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) globalThis.crypto = webcrypto;

/* ── tiny in-memory browser storage ─────────────────────────────── */
function makeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}
globalThis.localStorage = makeStorage();
globalThis.sessionStorage = makeStorage();

/* ── mock GitHub (contents API + raw + /user) ───────────────────── */
const PORT = 8951;
const API = `http://127.0.0.1:${PORT}/api`;
const RAW = `http://127.0.0.1:${PORT}/raw`;
const REPO = 'authorsauravkushwaha/MAKAUT-NEXUS-v1.0';
const GOOD_PAT = 'ghp_ZeRoThIrDpArTyKeY0123';
const BAD_PAT = 'ghp_wrongkey';
const READONLY_PAT = 'ghp_readonlykey';
const files = new Map(); // path -> { content, sha }
let shaSeq = 0;
let allowWrite = true;
const writeLog = [];

function b64encode(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}
function b64decode(b64) {
  return Buffer.from(b64, 'base64').toString('utf8');
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const send = (code, obj) => {
    const body = JSON.stringify(obj);
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(body);
  };
  const auth = req.headers.authorization || '';

  // /user (github profile)
  if (url.pathname === '/api/user') {
    if (auth !== `Bearer ${GOOD_PAT}` && auth !== `Bearer ${READONLY_PAT}`) return send(401, { message: 'Bad credentials' });
    const login = auth === `Bearer ${GOOD_PAT}` ? 'saurav-test' : 'readonly-user';
    return send(200, { login, id: auth === `Bearer ${GOOD_PAT}` ? 991 : 992 });
  }

  // contents API: /api/repos/{owner}/{repo}/contents/{path}
  const m = url.pathname.match(/^\/api\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
  if (m) {
    const path = decodeURIComponent(m[1]);
    if (auth !== `Bearer ${GOOD_PAT}`) return send(401, { message: 'Bad credentials' });
    if (req.method === 'GET') {
      const f = files.get(path);
      if (!f) return send(404, { message: 'Not Found' });
      return send(200, { sha: f.sha, content: b64encode(f.content) });
    }
    if (req.method === 'PUT') {
      if (!allowWrite) return send(403, { message: 'Write forbidden' });
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        const body = JSON.parse(raw || '{}');
        const existing = files.get(path);
        if (body.sha && (!existing || existing.sha !== body.sha)) return send(409, { message: 'Conflict' });
        if (!body.sha && existing) return send(422, { message: 'already exists' });
        const sha = `sha${++shaSeq}`;
        files.set(path, { content: b64decode(body.content), sha });
        writeLog.push(path);
        send(201, { commit: { sha } });
      });
      return undefined;
    }
    if (req.method === 'DELETE') {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        files.delete(path);
        writeLog.push(`DEL:${path}`);
        send(200, { commit: { sha: 'shax' } });
      });
      return undefined;
    }
  }

  // raw read: /raw/{owner}/{repo}/{branch}/{path}
  const rm = url.pathname.match(/^\/raw\/[^/]+\/[^/]+\/[^/]+\/(.+)$/);
  if (rm) {
    const path = decodeURIComponent(rm[1]);
    const f = files.get(path);
    res.writeHead(f ? 200 : 404, { 'Content-Type': 'text/plain' });
    res.end(f ? f.content : '404');
    return undefined;
  }

  return send(404, { message: 'no route' });
});

/* ── test harness ───────────────────────────────────────────────── */
const results = [];
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond, extra });
  console.log(`  ${cond ? 'GREEN' : 'RED'}  ${name}${cond ? '' : ' — ' + extra}`);
}

async function main() {
  await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

  // dynamic imports AFTER globals exist
  const cfgMod = await import('../src/lib/cloud/config.ts');
  const vault = await import('../src/lib/cloud/vault.ts');
  const auth = await import('../src/lib/cloud/auth.ts');

  cfgMod.resetCloudConfigCache();
  const cfg = { repo: REPO, dbPath: 'data/nexus-db', branch: 'main', apiBase: API, rawBase: RAW };

  const EMAIL = 'student@makaut.example';
  const PASS = 'Sup3rSecret!vault';
  const state1 = JSON.stringify({ version: 1, profile: { name: 'Saurav' }, xp: 4242 });

  /* 1 — email signup with sync key */
  const r1 = await vault.register(cfg, { identifier: EMAIL, password: PASS, method: 'email', syncPat: GOOD_PAT });
  check('email signup ok', r1.ok === true, JSON.stringify(r1));
  check('signup note is empty when repo write works', r1.ok && !r1.note, r1.ok ? String(r1.note) : '');
  const acctPath = 'data/nexus-db/accounts.json';
  check('accounts.json committed', files.has(acctPath));
  const acctText = files.get(acctPath)?.content || '';
  const rec = JSON.parse(acctText).accounts[0];
  check('account record has 32-hex id', rec && /^[a-f0-9]{32}$/.test(rec.id), rec?.id);
  check('display is masked', rec && rec.display === 'st***@ma***.example', rec?.display);
  check('auth stores salt+hash only', rec && rec.auth && rec.auth.salt && rec.auth.hash && !JSON.stringify(rec).includes(PASS));

  /* 6 — privacy of committed files */
  check('no raw email anywhere in committed accounts', !acctText.includes('student@makaut'));
  check('no raw password in committed accounts', !acctText.includes(PASS));

  /* push initial vault */
  if (r1.ok) {
    await vault.pushVault(cfg, r1.session, r1.vault, state1);
  }
  const vaultPath = files.has(`data/nexus-db/vaults/${rec.id}.json`)
    ? `data/nexus-db/vaults/${rec.id}.json`
    : '';
  check('vault file committed', !!vaultPath);
  const vaultText = vaultPath ? files.get(vaultPath).content : '';
  check('vault file is ciphertext only', !!vaultText && !vaultText.includes('Saurav') && !vaultText.includes('4242'));
  check('no PAT in any committed file', ![...files.values()].some((f) => f.content.includes(GOOD_PAT)));

  /* 2 — sign-in flows */
  const bad = await vault.login(cfg, { identifier: EMAIL, password: 'wrong-password-1', method: 'email', syncPat: GOOD_PAT });
  check('wrong password rejected', bad.ok === false && /password/i.test(bad.error || ''), JSON.stringify(bad));
  const r2 = await vault.login(cfg, { identifier: EMAIL, password: PASS, method: 'email', syncPat: GOOD_PAT });
  check('email sign-in ok', r2.ok === true, JSON.stringify(r2));

  /* 3 — pull decrypts the pushed state */
  if (r2.ok) {
    const pulled = await vault.pullVault(cfg, r2.session, r2.vault);
    check('pull -> decrypt round trip', pulled === state1, String(pulled).slice(0, 80));
  }

  /* 4 — github sign-in, auto-provisioned */
  const g1 = await vault.login(cfg, { identifier: '', password: GOOD_PAT, method: 'github' });
  check('github sign-in ok', g1.ok === true, JSON.stringify(g1));
  check('github account auto-created in repo', (files.get(acctPath)?.content || '').includes('"github"'));
  check('github display is the public login', (files.get(acctPath)?.content || '').includes('saurav-test'));
  if (g1.ok) {
    await vault.pushVault(cfg, g1.session, g1.vault, state1);
    const ghVaultPath = `data/nexus-db/vaults/${g1.session.userId}.json`;
    check('github vault committed', files.has(ghVaultPath));
    check('github vault ciphertext only', !files.get(ghVaultPath).content.includes('Saurav'));
    const again = await vault.login(cfg, { identifier: '', password: GOOD_PAT, method: 'github' });
    check('github re-login verifies vault key', again.ok === true, JSON.stringify(again));
  }
  const badGh = await vault.login(cfg, { identifier: '', password: BAD_PAT, method: 'github' });
  check('bad PAT rejected', badGh.ok === false && /rejected that token/i.test(badGh.error || ''), JSON.stringify(badGh));

  /* 5 — phone signup/signin */
  const PHONE = '9876543210';
  const p1 = await vault.register(cfg, { identifier: PHONE, password: PASS, method: 'phone', dial: '+91', syncPat: GOOD_PAT });
  check('phone signup ok', p1.ok === true, JSON.stringify(p1));
  const acct2 = JSON.parse(files.get(acctPath).content);
  const phoneRec = acct2.accounts.find((a) => a.method === 'phone');
  check('phone display masked', phoneRec && phoneRec.display === '+91•••••210', phoneRec?.display);
  check('no raw phone in committed accounts', !files.get(acctPath).content.includes('9876543210'));
  const p2 = await vault.login(cfg, { identifier: PHONE, password: PASS, method: 'phone', dial: '+91', syncPat: GOOD_PAT });
  check('phone sign-in ok', p2.ok === true, JSON.stringify(p2));
  const pDup = await vault.register(cfg, { identifier: PHONE, password: PASS, method: 'phone', dial: '+91', syncPat: GOOD_PAT });
  check('duplicate phone rejected', pDup.ok === false && /already exists/i.test(pDup.error || ''), JSON.stringify(pDup));

  /* 7 — 403 write surfaces actionable message */
  allowWrite = false;
  const p3 = await vault.register(cfg, { identifier: 'another@x.example', password: PASS, method: 'email', syncPat: GOOD_PAT });
  check('403 surfaces actionable write message', p3.ok === true && /Contents: Write/i.test(p3.note || ''), JSON.stringify(p3));
  allowWrite = true;

  /* 8 — device-local (no sync key) */
  const l1 = await vault.register(cfg, { identifier: 'local@x.example', password: PASS, method: 'email' });
  check('local signup ok', l1.ok === true, JSON.stringify(l1));
  check('local signup notes device-only', l1.ok && /on this device/i.test(l1.note || ''), l1.ok ? String(l1.note) : '');
  const committed = files.get(acctPath).content;
  check('local account NOT written to repo', !committed.includes('local@x') && JSON.parse(committed).accounts.every((a) => a.display !== 'lo***@x***.example'));
  const l2 = await vault.login(cfg, { identifier: 'local@x.example', password: PASS, method: 'email' });
  check('local sign-in ok', l2.ok === true, JSON.stringify(l2));

  server.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} GREEN`);
  if (failed.length) {
    console.log('FAILURES:', failed.map((f) => f.name).join(' | '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('HARNESS ERROR:', e);
  process.exit(1);
});
