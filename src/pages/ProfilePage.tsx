import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Target, Clock, Calendar, Database, ShieldCheck, RefreshCw, Rocket, ExternalLink } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, SectionLabel, Button, SourceBadge, StatusPill, cn } from '@/components/ui';
import { SOURCES, UNIVERSITY, ACADEMIC_YEAR, SEMESTER_1 } from '@/data';
import { addDays, todayISO, formatDate } from '@/lib/dates';
import { readiness } from '@/lib/derive';

export function ProfilePage() {
  const { state, updateProfile, resetAll, loadDemo } = useNexus();
  const nav = useNavigate();
  const [savedTick, setSavedTick] = useState(false);
  const r = readiness(state);

  const save = (patch: Parameters<typeof updateProfile>[0]) => {
    updateProfile(patch);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1600);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Pilot"
        title="PROFILE & DATA"
        sub="Your academic identity, mission parameters and the provenance of every fact NEXUS uses."
        right={
          <span className={cn('text-[11px] transition-opacity', savedTick ? 'text-emerald-300 opacity-100' : 'opacity-0')}>
            ✓ Saved locally
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* identity */}
        <GlassPanel className="p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 font-display text-2xl font-bold text-slate-950">
              {(state.profile.name || 'C').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <input
                value={state.profile.name}
                onChange={(e) => save({ name: e.target.value })}
                className="w-full rounded-lg border border-transparent bg-transparent font-display text-xl font-bold text-white outline-none hover:border-white/10 focus:border-cyan-400/60 px-1.5 py-0.5 -mx-1.5"
              />
              <div className="text-[12px] text-slate-500">
                {state.profile.college} · {state.profile.branch} · {state.profile.year}
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[13px]">
              <span className="inline-flex items-center gap-2 text-slate-400"><User size={13} /> Group</span>
              <span className="text-white">{state.profile.group}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[13px]">
              <span className="inline-flex items-center gap-2 text-slate-400"><Rocket size={13} /> Semester</span>
              <span className="text-white">{state.profile.semester}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5 text-[13px]">
              <span className="inline-flex items-center gap-2 text-slate-400"><Target size={13} /> Readiness</span>
              <span className="font-mono font-bold text-cyan-300">{r.readiness}%</span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500"><Target size={10} /> Target SGPA</div>
              <input
                type="number"
                min={5}
                max={10}
                step={0.1}
                value={state.profile.targetSgpa}
                onChange={(e) => save({ targetSgpa: Math.max(5, Math.min(10, Number(e.target.value) || 8.5)) })}
                className="mt-1 w-full bg-transparent font-display text-xl font-bold text-violet-300 outline-none"
              />
            </div>
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500"><Clock size={10} /> Daily time (min)</div>
              <input
                type="number"
                min={30}
                max={600}
                step={15}
                value={state.profile.dailyMinutes}
                onChange={(e) => save({ dailyMinutes: Math.max(30, Math.min(600, Number(e.target.value) || 180)) })}
                className="mt-1 w-full bg-transparent font-display text-xl font-bold text-cyan-300 outline-none"
              />
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-slate-500"><Calendar size={10} /> Exam date</div>
            <input
              type="date"
              min={addDays(todayISO(), 1)}
              value={state.profile.examDate}
              onChange={(e) => save({ examDate: e.target.value })}
              className="mt-1 w-full bg-transparent font-display text-lg font-bold text-white outline-none [color-scheme:dark]"
            />
            <div className="mt-1 text-[11px] text-slate-600">{formatDate(state.profile.examDate)}</div>
          </div>
        </GlassPanel>

        {/* sources / knowledge */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassPanel className="p-6">
            <SectionLabel className="flex items-center gap-1.5"><Database size={12} /> Knowledge sources</SectionLabel>
            <div className="mt-4 space-y-2.5">
              {SOURCES.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-cyan-400">{s.id}</span>
                    <span className="text-[13px] font-medium text-white">{s.label}</span>
                    <div className="ml-auto flex gap-1.5">
                      <StatusPill status={s.verification_status} />
                      <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-300">{s.source_type}</span>
                    </div>
                  </div>
                  {s.note && <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">{s.note}</p>}
                  <div className="mt-1.5 text-[10px] text-slate-600">Checked {formatDate(s.checked)}</div>
                </motion.div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <SectionLabel className="flex items-center gap-1.5"><ShieldCheck size={12} /> Data &amp; scope policy</SectionLabel>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.06] p-4 text-[12px] leading-relaxed text-emerald-200/85">
                <b>Stored on this device.</b> Profile, progress, marks, labs, streak and missions persist in localStorage
                only. No account, no tracking, no server.
              </div>
              <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4 text-[12px] leading-relaxed text-amber-200/85">
                <b>Provisional by default.</b> {UNIVERSITY.short_name} structure conflicts ({'CONF-01…03'}) remain
                visible in the product until the official registration list replaces them.
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-[12px] leading-relaxed text-slate-400">
                <b>In scope for v1.0:</b> Semester 1 · first year · Group A modelled. Out of scope: 30 branches, years
                2–4, historical papers, payments, social, teacher/parent dashboards, mobile app.
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-[12px] leading-relaxed text-slate-400">
                <b>Academic year {ACADEMIC_YEAR.academic_year}</b> · {SEMESTER_1.total_credits} credits* ·{' '}
                {SEMESTER_1.components_count} components. Verified dataset drops straight into{' '}
                <code className="text-cyan-300">/data</code> — the app re-reads it automatically.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button variant="ghost" size="sm" onClick={loadDemo}>
                <RefreshCw size={13} /> Restore demo pilot (Saurav)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                onClick={() => {
                  resetAll();
                  nav('/onboarding');
                }}
              >
                <RefreshCw size={13} /> Reset &amp; rebuild core
              </Button>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 text-[12px] text-slate-500 hover:text-cyan-300"
              >
                <ExternalLink size={12} /> Landing page
              </a>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
