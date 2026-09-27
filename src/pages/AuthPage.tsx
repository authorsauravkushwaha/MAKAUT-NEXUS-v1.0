import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Cloud, CloudOff, KeyRound, Lock, LogOut, Mail, ShieldCheck, Upload, Download,
  Trash2, RefreshCw, Sparkles, AlertTriangle,
} from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, SectionLabel, Button, cn } from '@/components/ui';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const nav = useNavigate();
  const { cloud, cloudSignIn, cloudSignUp, cloudSignOut, cloudSyncNow, exportBackup, importBackup } =
    useNexus();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalError(null);
    setInfo(null);
  }, [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setInfo(null);
    if (!email.includes('@')) return setLocalError('Enter a valid email address.');
    if (password.length < 8) return setLocalError('Password must be at least 8 characters.');
    if (mode === 'signup' && password !== confirm) return setLocalError('Passwords do not match.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        const r = await cloudSignIn(email.trim(), password);
        if (!r.ok) setLocalError(r.error || 'Sign-in failed.');
        else {
          setInfo(r.pulled ? 'Signed in — cloud data restored to this device.' : 'Signed in — your data is now syncing.');
          setTimeout(() => nav('/dashboard'), 700);
        }
      } else {
        const r = await cloudSignUp(email.trim(), password);
        if (!r.ok) setLocalError(r.error || 'Sign-up failed.');
        else if (r.needsConfirm) setConfirmSent(true);
        else {
          setInfo('Account created — your current progress was sealed into your private vault.');
          setTimeout(() => nav('/dashboard'), 900);
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const signedIn = cloud.status === 'signedin';

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        eyebrow="NEXUS ID · Private Cloud"
        title={signedIn ? 'YOUR ACCOUNT' : mode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}
        sub={
          signedIn
            ? 'Your vault is encrypted on this device before it syncs — nobody else, not even the database, can read it.'
            : 'Keep every streak, mark, lab record and level safe across devices — with zero-knowledge encryption.'
        }
      />

      {cloud.status === 'disabled' && (
        <GlassPanel className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-400/10">
            <CloudOff size={26} className="text-amber-300" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-white">Private Cloud not configured</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-slate-400">
            Login and cloud backup activate after the project owner links a free Supabase database —
            a five-minute, no-code setup. Everything below keeps working offline in the meantime.
          </p>
          <div className="mx-auto mt-5 grid max-w-xl gap-2 text-left text-[12px] leading-relaxed text-slate-400">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <b className="text-cyan-300">1 ·</b> Create a free project at supabase.com → copy the{' '}
              <b>Project URL</b> and <b>anon key</b>.
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <b className="text-cyan-300">2 ·</b> Run the one-time SQL in{' '}
              <code className="text-cyan-300">docs/CLOUD_SETUP.md</code> (creates your encrypted vault table).
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <b className="text-cyan-300">3 ·</b> Paste both values into{' '}
              <code className="text-cyan-300">public/nexus-cloud.json</code> and push — sign-in appears instantly.
            </div>
          </div>
        </GlassPanel>
      )}

      {cloud.status === 'loading' && (
        <GlassPanel className="p-10 text-center text-[13px] text-slate-500">Contacting Private Cloud…</GlassPanel>
      )}

      {cloud.status === 'signedout' && !confirmSent && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-7">
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {(['signin', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
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

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <Mail size={11} /> Email
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-400/50"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">
                  <KeyRound size={11} /> Password
                </span>
                <input
                  type="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-400/50"
                />
              </label>
              {mode === 'signup' && (
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
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white placeholder:text-slate-600 outline-none transition-colors focus:border-cyan-400/50"
                  />
                </label>
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
                {busy ? 'Working…' : mode === 'signin' ? 'Sign in & sync' : 'Create my vault'}
              </Button>
            </form>
          </GlassPanel>

          <GlassPanel className="p-7">
            <SectionLabel className="flex items-center gap-1.5">
              <ShieldCheck size={12} /> How your privacy is protected
            </SectionLabel>
            <div className="mt-4 space-y-3 text-[12.5px] leading-relaxed text-slate-400">
              {[
                ['🔒', 'Zero-knowledge', 'Your data is AES-256-GCM encrypted in this browser. The database stores ciphertext only — it cannot read a single mark or streak.'],
                ['🧱', 'Row-level isolation', 'Database policies bind every row to your user ID — no query can reach another student\u2019s vault, even with the public anon key.'],
                ['🗝️', 'Your password is the key', 'The encryption key is derived from your password (PBKDF2, 600,000 rounds). It never leaves the device.'],
                ['📉', 'No tracking', 'No cookies, no analytics, no third-party pixels. One optional account — solely so you never lose your data.'],
                ['🗑️', 'Delete means deleted', 'One tap erases your cloud vault forever. Export a full JSON backup any time.'],
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

      {confirmSent && cloud.status !== 'signedin' && (
        <GlassPanel className="p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
            <Mail size={26} className="text-cyan-300" />
          </div>
          <h2 className="mt-4 font-display text-xl font-bold text-white">Confirm your email</h2>
          <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-slate-400">
            We sent a confirmation link to <b className="text-cyan-300">{email}</b>. Click it (check spam too),
            then come back and sign in.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setConfirmSent(false); setMode('signin'); }}>
              Back to sign in
            </Button>
          </div>
        </GlassPanel>
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
                  {cloud.busy ? 'Syncing…' : 'Encrypted & synced'}
                  {cloud.lastSync ? ` · last sync ${new Date(cloud.lastSync).toLocaleString()}` : ''}
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
              Permanently erases your encrypted cloud vault. Your data on <i>this</i> device stays untouched.
              Export a backup first if unsure.
            </p>
            <div className="mt-4">
              {!confirmDelete ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={13} /> Delete cloud vault
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
                        await destroyVault(cfg);
                        setInfo('Cloud vault deleted permanently.');
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

      {cloud.status === 'signedout' && !confirmSent && (
        <GlassPanel className="mt-6 flex flex-wrap items-center gap-3 p-5 text-[12px] text-slate-500">
          <Sparkles size={14} className="text-violet-300" />
          Guests keep full functionality — an account only adds cross-device backup.
          <span className="ml-auto flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em]">
            <Lock size={11} /> end-to-end encrypted
          </span>
        </GlassPanel>
      )}
    </div>
  );
}
