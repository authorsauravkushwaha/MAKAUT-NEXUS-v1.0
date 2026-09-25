import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Calculator, TrendingUp, ArrowRight, RotateCcw } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, ProgressRing, SourceBadge, SectionLabel, Button, StatusPill, cn } from '@/components/ui';
import { computeSGPA, formatSGPA, SGPA_RULE, gradePoint } from '@/lib/sgpa';
import { THEORY_COURSES } from '@/data';

export function SGPAPage() {
  const { state, setMarks, resetMarks } = useNexus();
  const result = useMemo(() => computeSGPA(state.marks), [state.marks]);

  // What-if: deltas applied to a selected course's total marks
  const [whatIfCourse, setWhatIfCourse] = useState('beee');
  const [whatIfDelta, setWhatIfDelta] = useState(0);

  const whatIfSGPA = useMemo(() => {
    if (!whatIfDelta) return result.sgpa;
    const marks = { ...state.marks };
    const entry = marks[whatIfCourse] ?? { internal: '', ese: '' };
    if (entry.internal === '' || entry.ese === '') return result.sgpa;
    const currentTotal = Number(entry.internal) + Number(entry.ese);
    const targetTotal = Math.max(0, Math.min(100, currentTotal + whatIfDelta));
    const newTotal = targetTotal;
    // keep internal fixed, move ESE (clamp 0–70)
    const ese = Math.max(0, Math.min(70, newTotal - Number(entry.internal)));
    marks[whatIfCourse] = { internal: entry.internal, ese };
    return computeSGPA(marks).sgpa;
  }, [whatIfDelta, whatIfCourse, state.marks, result.sgpa]);

  const delta = whatIfSGPA !== null && result.sgpa !== null ? whatIfSGPA - result.sgpa : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Performance"
        title="SGPA COMMAND CENTER"
        sub="Enter internal + ESE marks, project your SGPA, and run what-if scenarios before the university does."
        right={
          <div className="flex items-center gap-3">
            <StatusPill status={SGPA_RULE.status} />
            <SourceBadge fact={{ source_ref: SGPA_RULE.sourceRef, source_type: 'primary', verification_status: 'pending', checked: '2026-09-25' }} />
          </div>
        }
      />

      {/* ── Provisional rule safety banner ───────────────────────── */}
      <GlassPanel className="mb-5 flex flex-wrap items-start gap-4 border-amber-400/25 bg-amber-400/[0.05] p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/40 bg-amber-400/10">
          <ShieldAlert size={18} className="text-amber-300" />
        </span>
        <div className="min-w-[260px] flex-1">
          <div className="text-[13px] font-semibold text-amber-200">Assessment rule — 🟡 provisional source</div>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-200/70">
            <b>{SGPA_RULE.label}</b>. Last verified: <b>{SGPA_RULE.lastVerified}</b>. Until we have the official
            applicable regulation (SRC-003 pending), NEXUS refuses to hard-code uncertain university rules as final —
            this projection is a planning aid, not a university result.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-2.5">
          <div className="text-[9px] uppercase tracking-[0.16em] text-slate-500">Projected SGPA</div>
          <motion.div key={formatSGPA(result.sgpa)} initial={{ scale: 0.8, opacity: 0.4 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-3xl font-bold text-cyan-300">
            {formatSGPA(result.sgpa)}
          </motion.div>
        </div>
      </GlassPanel>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        {/* ── Marks entry ────────────────────────────────────────── */}
        <GlassPanel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <SectionLabel className="flex items-center gap-1.5"><Calculator size={12} /> Marks entry</SectionLabel>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-500">{result.enteredCredits}/17 credits entered</span>
              <button onClick={resetMarks} className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-300">
                <RotateCcw size={11} /> Clear
              </button>
            </div>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {THEORY_COURSES.map((c) => {
              const m = state.marks[c.id] ?? { internal: '', ese: '' };
              const entered = m.internal !== '' && m.ese !== '';
              const total = entered ? Number(m.internal) + Number(m.ese) : null;
              const gp = total !== null ? gradePoint(total) : null;
              return (
                <div key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                  <div className="w-44 shrink-0">
                    <div className="text-[13.5px] font-semibold text-white">{c.title}</div>
                    <div className="text-[10px] text-slate-600">{c.credits} credits</div>
                  </div>

                  <label className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Internal</span>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={m.internal}
                      onChange={(e) => setMarks(c.id, e.target.value === '' ? '' : Math.max(0, Math.min(30, Number(e.target.value))), m.ese)}
                      className="w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-center font-mono text-[13px] text-white outline-none focus:border-cyan-400/60"
                      placeholder="30"
                    />
                  </label>

                  <label className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">ESE</span>
                    <input
                      type="number"
                      min={0}
                      max={70}
                      value={m.ese}
                      onChange={(e) => setMarks(c.id, m.internal, e.target.value === '' ? '' : Math.max(0, Math.min(70, Number(e.target.value))))}
                      className="w-16 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-center font-mono text-[13px] text-white outline-none focus:border-cyan-400/60"
                      placeholder="70"
                    />
                  </label>

                  <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Total</div>
                      <div className="font-mono text-[15px] font-bold text-white">{total ?? '—'}</div>
                    </div>
                    <div
                      className="flex h-11 w-14 items-center justify-center rounded-xl border font-display text-lg font-bold"
                      style={{
                        borderColor: gp !== null ? `${c.color}66` : 'rgba(255,255,255,0.08)',
                        background: gp !== null ? `${c.color}12` : 'transparent',
                        color: gp !== null ? c.color : '#475569',
                      }}
                    >
                      {gp ?? '—'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-white/[0.06] px-5 py-4">
            <SectionLabel className="mb-3">Grade table (provisional)</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {SGPA_RULE.table.filter(([min]) => min > 0).map(([min, gp]) => (
                <span key={min} className="rounded-md border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[10px] text-slate-400">
                  ≥{min} → {gp}
                </span>
              ))}
              <span className="rounded-md border border-rose-400/25 bg-rose-500/10 px-2 py-1 font-mono text-[10px] text-rose-300">
                &lt;40 → 0 (fail)
              </span>
            </div>
          </div>
        </GlassPanel>

        {/* ── Projection + what-if ───────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <GlassPanel className="flex flex-col items-center p-6 text-center">
            <SectionLabel>Projected SGPA</SectionLabel>
            <div className="my-4">
              <ProgressRing
                value={((result.sgpa ?? 0) / 10) * 100}
                size={160}
                stroke={12}
                color="#22d3ee"
                label={<span className="font-display text-4xl font-bold text-white">{formatSGPA(result.sgpa)}</span>}
                sublabel={`target ${state.profile.targetSgpa.toFixed(1)}`}
              />
            </div>
            <div className="text-[12px] text-slate-500">
              {result.allEntered ? 'All theory courses entered.' : 'Partial entries project over entered credits only.'}
            </div>
            {(result.sgpa ?? 0) >= state.profile.targetSgpa ? (
              <div className="mt-3 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1.5 text-[11px] text-emerald-300">
                ✓ At or above target {state.profile.targetSgpa.toFixed(1)}
              </div>
            ) : (
              <div className="mt-3 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1.5 text-[11px] text-amber-300">
                {(state.profile.targetSgpa - (result.sgpa ?? 0)).toFixed(2)} below target {state.profile.targetSgpa.toFixed(1)}
              </div>
            )}
          </GlassPanel>

          {/* What-if simulator */}
          <GlassPanel className="p-5" glow="#8b5cf6">
            <SectionLabel className="flex items-center gap-1.5"><TrendingUp size={12} /> What-if simulator</SectionLabel>

            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {THEORY_COURSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setWhatIfCourse(c.id);
                      setWhatIfDelta(0);
                    }}
                    className={cn(
                      'rounded-lg border px-2.5 py-1.5 text-[11px] transition-all',
                      whatIfCourse === c.id
                        ? 'border-violet-400/60 bg-violet-400/12 text-violet-200'
                        : 'border-white/[0.08] text-slate-500 hover:border-white/25',
                    )}
                  >
                    {c.short}
                  </button>
                ))}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="text-slate-400">
                    Change {THEORY_COURSES.find((c) => c.id === whatIfCourse)?.short} total by
                  </span>
                  <span className={cn('font-mono font-bold', whatIfDelta > 0 ? 'text-emerald-300' : whatIfDelta < 0 ? 'text-rose-300' : 'text-slate-400')}>
                    {whatIfDelta > 0 ? '+' : ''}{whatIfDelta} marks
                  </span>
                </div>
                <input
                  type="range"
                  min={-20}
                  max={20}
                  value={whatIfDelta}
                  onChange={(e) => setWhatIfDelta(Number(e.target.value))}
                  className="w-full accent-violet-400"
                />
              </div>

              <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">Current projection</span>
                  <span className="font-mono text-[15px] font-bold text-slate-300">{formatSGPA(result.sgpa)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[12px] text-slate-400">With change</span>
                  <span className="font-mono text-[15px] font-bold text-violet-300">{formatSGPA(whatIfSGPA)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-[12px] text-slate-400">Projected shift</span>
                  <motion.span
                    key={delta}
                    initial={{ y: -6, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={cn('inline-flex items-center gap-1 font-mono text-lg font-bold', delta > 0 ? 'text-emerald-300' : delta < 0 ? 'text-rose-300' : 'text-slate-400')}
                  >
                    {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {Math.abs(delta).toFixed(2)}
                  </motion.span>
                </div>
              </div>

              {whatIfDelta !== 0 && (
                <div className="flex items-start gap-2 rounded-lg border border-violet-400/25 bg-violet-500/[0.07] p-3 text-[11px] leading-relaxed text-violet-200/80">
                  <ArrowRight size={13} className="mt-0.5 shrink-0" />
                  Recomputed live through the provisional grade table — internal held fixed, ESE absorbs the change (clamped 0–70).
                </div>
              )}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
