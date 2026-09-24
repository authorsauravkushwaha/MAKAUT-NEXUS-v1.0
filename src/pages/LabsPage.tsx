import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FlaskConical, FileCheck2, BadgeCheck, ChevronRight, ClipboardList, Activity } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, ProgressRing, SourceBadge, SectionLabel, Button, StatusPill, cn } from '@/components/ui';
import { labSubStats } from '@/lib/derive';
import { LAB_COURSES, COURSE_MAP } from '@/data';

const STATUS_META = {
  not_started: { label: 'Not Started', dot: 'bg-slate-500', cls: 'text-slate-400' },
  in_progress: { label: 'In Progress', dot: 'bg-amber-400', cls: 'text-amber-300' },
  completed: { label: 'Completed', dot: 'bg-emerald-400', cls: 'text-emerald-300' },
} as const;

export function LabsPage() {
  const { state, setLabExperiment, markExperimentComplete } = useNexus();
  const [activeLab, setActiveLab] = useState(LAB_COURSES[0].id);
  const [expanded, setExpanded] = useState<string | null>('ph-04');

  const lab = COURSE_MAP[activeLab] ?? LAB_COURSES[0];
  const stats = useMemo(() => labSubStats(state, lab), [state, lab]);

  const overall = useMemo(() => {
    const all = LAB_COURSES.map((l) => labSubStats(state, l));
    const total = all.reduce((a, s) => a + s.total, 0) || 1;
    return (all.reduce((a, s) => a + s.completionPct * s.total, 0) / total);
  }, [state]);

  return (
    <div>
      <PageHeader
        eyebrow="Operations"
        title="LAB COMMAND CENTER"
        sub="Experiments · records · teacher verification. Your grade isn't just your written exam — track every operation gate."
        right={
          <div className="flex items-center gap-3">
            <ProgressRing value={overall} size={64} stroke={6} color="#34d399" />
            <StatusPill status={lab.verification_status} />
            <SourceBadge fact={lab} />
          </div>
        }
      />

      {/* lab switcher */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {LAB_COURSES.map((l) => {
          const s = labSubStats(state, l);
          const on = l.id === activeLab;
          return (
            <button
              key={l.id}
              onClick={() => setActiveLab(l.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-left transition-all',
                on ? 'border-cyan-400/50 bg-cyan-400/10 shadow-glow-cyan' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20',
              )}
            >
              <FlaskConical size={15} style={{ color: on ? '#22d3ee' : l.color }} />
              <div>
                <div className="text-[13px] font-semibold text-white">{l.short}</div>
                <div className="text-[10px] text-slate-500">{s.total} experiments · {Math.round(s.completionPct)}%</div>
              </div>
            </button>
          );
        })}
        <div className="ml-auto">
          <Link to="/sessionals" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-[12px] text-slate-300 transition-colors hover:border-amber-400/40 hover:text-amber-200">
            Non-theory requirements <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* stats */}
        <div className="flex flex-col gap-4">
          <GlassPanel className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <SectionLabel>{lab.title}</SectionLabel>
                <div className="mt-1.5 text-[12px] text-slate-400">{lab.credits} credit · {lab.hours} hours</div>
              </div>
              <ProgressRing value={stats.completionPct} size={78} stroke={7} color={lab.color} sublabel="status" />
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-400"><Activity size={12} /> Experiments</span>
                  <span className="font-mono text-slate-200">{Math.round(stats.experimentsPct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500/50 to-emerald-400" style={{ width: `${stats.experimentsPct}%`, transition: 'width .8s' }} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-400"><FileCheck2 size={12} /> Records</span>
                  <span className="font-mono text-slate-200">{Math.round(stats.recordsPct)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500/50 to-cyan-400" style={{ width: `${stats.recordsPct}%`, transition: 'width .8s' }} />
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5 text-slate-400"><BadgeCheck size={12} /> Teacher verified</span>
                  <span className="font-mono text-slate-200">{stats.verified}/{stats.total}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500/50 to-violet-400" style={{ width: `${(stats.verified / (stats.total || 1)) * 100}%`, transition: 'width .8s' }} />
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-[11px] leading-relaxed text-slate-500">
              <ClipboardList size={11} className="mr-1 inline" />
              Status flow: <span className="text-slate-300">Not started → In progress → Completed</span>, then record →
              teacher verification. Records pending: <span className="text-amber-300">{stats.total - stats.recordsDone}</span>.
            </div>
          </GlassPanel>
        </div>

        {/* experiments */}
        <GlassPanel className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
            <SectionLabel>Experiment roster</SectionLabel>
            <span className="text-[11px] text-slate-500">
              {stats.recordsDone}/{stats.total} records in
            </span>
          </div>

          <div className="divide-y divide-white/[0.05]">
            {(lab.experiments ?? []).map((e, i) => {
              const st = state.labs[lab.id]?.[e.id] ?? { status: 'not_started', record: 'pending', verified: false };
              const meta = STATUS_META[st.status];
              const open = expanded === e.id;
              return (
                <motion.div
                  key={e.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <button
                    onClick={() => setExpanded(open ? null : e.id)}
                    className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] font-mono text-[12px] text-slate-400">
                      {e.index}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium text-white">{e.title}</div>
                      <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                          <span className={meta.cls}>{meta.label}</span>
                        </span>
                        <span>· {e.hours}h</span>
                        <span className={st.record === 'done' ? 'text-emerald-400' : ''}>· record {st.record}</span>
                        <span className={st.verified ? 'text-emerald-400' : ''}>· {st.verified ? 'verified ✓' : 'verification pending'}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className={cn('shrink-0 text-slate-600 transition-transform', open && 'rotate-90')} />
                  </button>

                  {open && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden bg-white/[0.015]">
                      <div className="grid gap-4 px-5 py-4 md:grid-cols-3">
                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                          <SectionLabel>Status</SectionLabel>
                          <div className="mt-2 space-y-1.5">
                            {(['not_started', 'in_progress', 'completed'] as const).map((s) => (
                              <button
                                key={s}
                                onClick={() => setLabExperiment(lab.id, e.id, { status: s })}
                                className={cn(
                                  'flex w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-left text-[12px] transition-all',
                                  st.status === s ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-200' : 'border-white/[0.07] text-slate-500 hover:border-white/20',
                                )}
                              >
                                <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_META[s].dot)} />
                                {STATUS_META[s].label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                          <SectionLabel>Record</SectionLabel>
                          <button
                            onClick={() => setLabExperiment(lab.id, e.id, { record: st.record === 'done' ? 'pending' : 'done' })}
                            className={cn(
                              'mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-all',
                              st.record === 'done'
                                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                                : 'border-white/[0.07] text-slate-400 hover:border-emerald-400/40 hover:text-emerald-300',
                            )}
                          >
                            <FileCheck2 size={13} /> {st.record === 'done' ? 'Record written ✓' : 'Mark record done'}
                          </button>
                          <button
                            onClick={() => setLabExperiment(lab.id, e.id, { verified: !st.verified })}
                            className={cn(
                              'mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] transition-all',
                              st.verified
                                ? 'border-violet-400/40 bg-violet-400/10 text-violet-300'
                                : 'border-white/[0.07] text-slate-400 hover:border-violet-400/40 hover:text-violet-300',
                            )}
                          >
                            <BadgeCheck size={13} /> {st.verified ? 'Teacher verified ✓' : 'Pending verification'}
                          </button>
                        </div>

                        <div className="flex flex-col justify-between rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
                          <div className="text-[11px] leading-relaxed text-slate-500">
                            Completing grants the full operation gate (status + record + verification) and logs a 30-minute
                            session toward today's streak.
                          </div>
                          <Button
                            size="sm"
                            className="mt-3 w-full"
                            onClick={() => markExperimentComplete(lab.id, e.id)}
                            disabled={st.verified && st.record === 'done' && st.status === 'completed'}
                          >
                            {st.verified ? 'Fully complete' : 'Mark complete'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
