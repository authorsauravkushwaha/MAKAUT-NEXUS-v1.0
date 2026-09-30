import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, CloudOff, Github, KeyRound, Lock, LogOut, Mail, Phone, ShieldCheck, Upload, Download,
  Trash2, RefreshCw, Sparkles, AlertTriangle, Smartphone,
} from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, SectionLabel, Button, cn } from '@/components/ui';
import type { AuthMethod } from '@/lib/cloud/vault';

type Mode = 'signin' | 'signup';

/** Country dial codes — identity only; SMS codes are intentionally not used. */
const COUNTRIES: { iso: string; dial: string; flag: string; name: string }[] = [
  { iso: 'IN', dial: '+91', flag: '🇮🇳', name: 'India' },
  { iso: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladesh' },
  { iso: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
  { iso: 'LK', dial: '+94', flag: '🇱🇰', name: 'Sri Lanka' },
  { iso: 'US', dial: '+1', flag: '🇺🇸', name: 'USA' },
  { iso: 'GB', dial: '+44', flag: '🇬🇧', name: 'UK' },
  { iso: 'AE', dial: '+971', flag: '🇦🇪', name: 'UAE' },
  { iso: 'SA', dial: '+966', flag: '🇸🇦', name: 'Saudi Arabia' },
  { iso: 'QA', dial: '+974', flag: '🇶🇦', name: 'Qatar' },
  { iso: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { iso: 'OM', dial: '+968', flag: '🇴🇲', name: 'Oman' },
  { iso: 'SG', dial: '+65', flag: '🇸🇬', name: 'Singapore' },
  { iso: 'MY', dial: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { iso: 'AU', dial: '+61', flag: '🇦🇺', name: 'Australia' },
  { iso: 'CA', dial: '+1', flag: '🇨🇦', name: 'Canada' },
  { iso: 'DE', dial: '+49', flag: '🇩🇪', name: 'Germany' },
  { iso: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { iso: 'IT', dial: '+39', flag: '🇮🇹', name: 'Italy' },
  { iso: 'ES', dial: '+34', flag: '🇪🇸', name: 'Spain' },
  { iso: 'NL', dial: '+31', flag: '🇳🇱', name: 'Netherlands' },
  { iso: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { iso: 'RU', dial: '+7', flag: '🇷🇺', name: 'Russia' },
  { iso: 'TR', dial: '+90', flag: '🇹🇷', name: 'Turkey' },
  { iso: 'ZA', dial: '+27', flag: '🇿🇦', name: 'South Africa' },
  { iso: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { iso: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { iso: 'EG', dial: '+20', flag: '🇪🇬', name: 'Egypt' },
  { iso: 'JP', dial: '+81', flag: '🇯🇵', name: 'Japan' },
  { iso: 'KR', dial: '+82', flag: '🇰🇷', name: 'South Korea' },
  { iso: 'CN', dial: '+86', flag: '🇨🇳', name: 'China' },
  { iso: 'TH', dial: '+66', flag: '🇹🇭', name: 'Thailand' },
  { iso: 'ID', dial: '+62', flag: '🇮🇩', name: 'Indonesia' },
  { iso: 'PH', dial: '+63', flag: '🇵🇭', name: 'Philippines' },
  { iso: 'PK', dial: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { iso: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brazil' },
  { iso: 'MX', dial: '+52', flag: '🇲🇽', name: 'Mexico' },
  { iso: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina' },
  { iso: 'IE', dial: '+353', flag: '🇮🇪', name: 'Ireland' },
  { iso: 'SE', dial: '+46', flag: '🇸🇪', name: 'Sweden' },
  { iso: 'CH', dial: '+41', flag: '🇨🇭', name: 'Switzerland' },
];

const INPUT =
  'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-400/50';

export function AuthPage() {
  const nav = useNavigate();
  const { cloud, cloudSignIn, cloudSignUp, cloudSignOut, cloudSyncNow, exportBackup, importBackup } =
    useNexus();
  const [mode, setMode] = useState<Mode>('signin');
  const [method, setMethod] = useState<AuthMethod>('github');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [dial, setDial] = useState('+91');
  const [syncPat, setSyncPat] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalError(null);
    setInfo(null);
  }, [mode, method]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfo(null);
    try {
      if (method === 'github') {
        const pat = password.trim();
        if (pat.length < 10) return setLocalError('Paste your GitHub token (PAT).');
        setBusy(true);
        const r = await cloudSignIn(pat, '', 'github');
        if (!r.ok) setLocalError(r.error || 'Sign-in failed.');
        else {
          setInfo(r.note || 'Signed in with GitHub — vault unlocked.');
          setTimeout(() => nav('/dashboard'), 700);
        }
        return;
      }
      if (method === 'email' && !identifier.includes('@')) {
        return setLocalError('Enter a valid email address.');
      }
      if (method === 'phone' && identifier.replace(/[^0-9]/g, '').length < 4) {
        return setLocalError('Enter your phone number.');
      }
      if (password.length < 8) return setLocalError('Password must be at least 8 characters.');
      if (mode === 'signup' && password !== confirm) return setLocalError('Passwords do not match.');
      const opts = { dial, syncPat: syncPat.trim() || undefined };
      setBusy(true);
      if (mode === 'signin') {
        const r = await cloudSignIn(identifier.trim(), password, method, opts);
        if (!r.ok) setLocalError(r.error || 'Sign-in failed.');
        else {
          setInfo(r.note || 'Signed in — vault unlocked.');
          setTimeout(() => nav('/dashboard'), 700);
        }
      } else {
        const r = await cloudSignUp(identifier.trim(), password, method, opts);
        if (!r.ok) setLocalError(r.error || 'Sign-up failed.');
        else {
          setInfo(r.note || 'Account created — progress sealed into your encrypted vault.');
          setTimeout(() => nav('/dashboard'), 900);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const signedIn = cloud.status === 'signedin';

  const methodTab = (m: AuthMethod, label: string, Icon: typeof Github) => (
    <button
      key={m}
      type="button"
      onClick={() => setMethod(m)}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
        method === m ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-500 hover:text-slate-300',
      )}
    >
      <Icon size={13} /> {label}
    </button>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="NEXUS ID · GitHub database"
        title={signedIn ? 'YOUR ACCOUNT' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        sub={
          signedIn
            ? 'Your vault is encrypted in this browser — the repository only ever holds ciphertext and hashed IDs.'
            : 'Three ways in, zero third parties: your GitHub key, your email, or your phone number. The database lives inside this GitHub repository.'
        }
      />

      {cloud.status === 'disabled' && (
        <GlassPanel className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <CloudOff size={26} className="text-amber-300" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-white">Database not configured</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-slate-400">
            <code className="text-cyan-300">public/nexus-cloud.json</code> is missing or invalid.
            It must point at this repository (repo + dbPath) — run the setup block again.
          </p>
        </GlassPanel>
      )}

      {cloud.status === 'loading' && (
        <GlassPanel className="p-10 text-center text-[13px] text-slate-500">Opening the vault…</GlassPanel>
      )}

      {cloud.status === 'signedout' && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-7">
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {methodTab('github', 'GitHub', Github)}
              {methodTab('email', 'Email', Mail)}
              {methodTab('phone', 'Phone', Smartphone)}
            </div>

            {method !== 'github' && (
              <div className="mt-4 flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {(['signin', 'signup'] as Mode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={cn(
                      'flex-1 rounded-lg px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors',
                      mode === m ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-500 hover:text-slate-300',
                    )}
                  >
                    {m === 'signin' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
              {method === 'github' && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <Github size={11} /> GitHub token (PAT)
                  </span>
                  <input
                    type="password"
                    autoComplete="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ghp_… or github_pat_…"
                    className={INPUT}
                  />
                  <span className="mt-2 block text-[11px] leading-relaxed text-slate-500">
                    Create it at{' '}
                    <a
                      href="https://github.com/settings/tokens/new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline decoration-dotted"
                    >
                      github.com/settings/tokens/new
                    </a>{' '}
                    — fine-grained: <b>Contents: Read and write</b> on this repository (classic:{' '}
                    <code className="text-cyan-300">repo</code>). It stays in this tab only and is never
                    written to any file.
                  </span>
                </label>
              )}

              {method === 'email' && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <Mail size={11} /> Email
                  </span>
                  <input
                    type="email"
                    autoComplete="email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com"
                    className={INPUT}
                  />
                </label>
              )}

              {method === 'phone' && (
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    <Phone size={11} /> Phone number
                  </span>
                  <span className="flex gap-2">
                    <select
                      value={dial}
                      onChange={(e) => setDial(e.target.value)}
                      className="w-[132px] shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-[14px] text-white outline-none focus:border-cyan-400/50"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.iso} value={c.dial} className="bg-slate-900">
                          {c.flag} {c.dial}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      autoComplete="tel-national"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="98765 43210"
                      className={INPUT}
                    />
                  </span>
                  <span className="mt-2 block text-[11px] leading-relaxed text-slate-500">
                    Identity only — no SMS codes (that would need a third-party SMS service, which this
                    project refuses to use).
                  </span>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <KeyRound size={11} /> {method === 'github' ? 'Uses this token as the vault key' : 'Password'}
                </span>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={method === 'github' ? 'token doubles as your encryption key' : 'At least 8 characters'}
                  className={INPUT}
                />
              </label>

              {method !== 'github' && mode === 'signup' && (
                <label className="block">
                  <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-slate-500">
                    Confirm password
                  </span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className={INPUT}
                  />
                </label>
              )}

              {method !== 'github' && (
                <details className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                  <summary className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    GitHub sync key (optional)
                  </summary>
                  <input
                    type="password"
                    autoComplete="off"
                    value={syncPat}
                    onChange={(e) => setSyncPat(e.target.value)}
                    placeholder="ghp_… — saves encrypted data into the repository"
                    className={`${INPUT} mt-3`}
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                    With a key, your account + encrypted vault are committed to this repository (saved
                    forever). Skip it and everything stays on this device — you can Export a backup any time.
                  </p>
                </details>
              )}

              {localError && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-[12px] text-rose-200">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {localError}
                </div>
              )}
              {info && (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-[12px] text-emerald-200">
                  {info}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy
                  ? 'Working…'
                  : method === 'github'
                    ? 'Sign in with GitHub'
                    : mode === 'signin'
                      ? 'Sign in & unlock'
                      : 'Create my vault'}
              </Button>
            </form>
          </GlassPanel>

          <GlassPanel className="p-7">
            <SectionLabel className="flex items-center gap-1.5">
              <ShieldCheck size={12} /> How your privacy is protected
            </SectionLabel>
            <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-slate-400">
              {[
                ['🗄️', 'The database is this repository', 'Accounts and encrypted vaults are JSON files under data/nexus-db, versioned forever by git — no outside server exists.'],
                ['🔒', 'Zero-knowledge vaults', 'Your data is AES-256-GCM encrypted in this browser. The repository stores ciphertext only.'],
                ['🪪', 'Identities are hashed', 'Emails and phone numbers are never stored — only PBKDF2-keyed IDs and a masked hint like jo***@gm***.com.'],
                ['🗝️', 'Passwords are proven, not stored', 'PBKDF2-SHA256, 600,000 rounds, per-account salt. The plaintext never leaves your device.'],
                ['🚫', 'No third parties', 'No Nhost, no Supabase, no Google sign-in, no SMS gateway — GitHub is the only network service, and only when you bring your own key.'],
                ['🗑️', 'Delete means deleted', 'One tap erases your encrypted vault from the repository. Export a JSON backup any time.'],
              ].map(([emoji, title, body]) => (
                <div key={title} className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                  <span className="text-lg leading-none">{emoji}</span>
                  <div>
                    <div className="text-[12px] font-semibold text-white">{title}</div>
                    <div className="mt-0.5">{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
        </div>
      )}

      {signedIn && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-7">
            <SectionLabel className="flex items-center gap-1.5">
              <Cloud size={12} /> Vault status
            </SectionLabel>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-base">🛰️</span>
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-white">{cloud.email}</div>
                <div className="text-[11px] text-emerald-300/90">
                  {cloud.busy ? 'Syncing…' : 'Encrypted & saved'}
                  {cloud.lastSync ? ` · saved ${new Date(cloud.lastSync).toLocaleString()}` : ''}
                </div>
              </div>
            </div>
            {cloud.error && (
              <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-[12px] text-amber-200">
                {cloud.error}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Button variant="outline" size="sm" onClick={() => void cloudSyncNow()} disabled={cloud.busy}>
                <RefreshCw size={13} /> Sync now
              </Button>
              <Button variant="ghost" size="sm" onClick={exportBackup}>
                <Download size={13} /> Export backup
              </Button>
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                <Upload size={13} /> Import backup
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importBackup(f);
                  e.target.value = '';
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => void cloudSignOut()}>
                <LogOut size={13} /> Sign out
              </Button>
            </div>
          </GlassPanel>

          <GlassPanel className="p-7">
            <SectionLabel className="flex items-center gap-1.5">
              <Trash2 size={12} /> Danger zone
            </SectionLabel>
            <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
              Permanently erases your encrypted vault from the repository (and this device). Export a
              backup first if unsure.
            </p>
            <div className="mt-4">
              {!confirmDelete ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={13} /> Delete vault
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-500/60 bg-rose-500/15 text-rose-200"
                    onClick={async () => {
                      const { destroyVault } = await import('@/lib/cloud/vault');
                      const { loadCloudConfig } = await import('@/lib/cloud/config');
                      const cfg = await loadCloudConfig();
                      if (cfg) {
                        try {
                          await destroyVault(cfg);
                          setInfo('Vault erased.');
                        } catch (err) {
                          setLocalError(err instanceof Error ? err.message : 'Delete failed.');
                        }
                      }
                      setConfirmDelete(false);
                    }}
                  >
                    Yes — erase it
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      )}

      {cloud.status === 'signedout' && (
        <GlassPanel className="mt-6 flex flex-wrap items-center gap-3 p-5 text-[12px] text-slate-500">
          <Sparkles size={14} className="text-violet-300" />
          Guests keep full functionality — an account only adds encrypted backup into the repository.
          <span className="ml-auto flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]">
            <Lock size={11} /> end-to-end encrypted
          </span>
        </GlassPanel>
      )}
    </div>
  );
}
