import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarRange, Zap, Clock3, Target, Flame, Download } from 'lucide-react';
import { useNexus } from '@/state/context';
import { generatePlan, planSummary } from '@/lib/planner';
import type { StudyPlan } from '@/types';
import { GlassPanel, PageHeader, Button, SectionLabel, StatBar, cn, StatusPill } from '@/components/ui';
import { daysUntil, formatDuration, formatDate } from '@/lib/dates';
import { COURSE_MAP } from '@/data';
import { readiness } from '@/lib/derive';

export function PlannerPage() {
  const { state, updateProfile } = useNexus();
  const [days, setDays] = useState(() => Math.max(3, daysUntil(state.profile.examDate)));
  const [daily, setDaily] = useState(state.profile.dailyMinutes);
  const [target, setTarget] = useState(state.profile.targetSgpa);
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const completion = useMemo(() => readiness(state).syllabus, [state]);

  const generate = () => {
    updateProfile({ examDate: state.profile.examDate, dailyMinutes: daily, targetSgpa: target });
    const p = generatePlan(state, { days, dailyMinutes: daily, startCompletion: completion, targetSgpa: target });
    setPlan(p);
  };

  const summary = plan ? planSummary(plan) : null;

  return (
    <div>
      <PageHeader
        eyebrow="AI study planner"
        title="Plan the runway"
        sub="Exam countdown × daily budget × module hours × current completion → a phased plan with daily tasks. Allocated by remaining hours, not vibes."
        right={<StatusPill status="verified" />}
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        {/* ── Inputs ─────────────────────────────────────────────── */}
        <GlassPanel className="h-fit p-5">
          <SectionLabel className="mb-4 flex items-center gap-1.5"><CalendarRange size={12} /> Mission parameters</SectionLabel>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-[12px]">
                <span className="text-slate-400">Exam in</span>
                <span className="font-mono font-bold text-cyan-300">{days} days</span>
              </div>
              <input type="range" min={3} max={60} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-full accent-cyan-400" />
              <div className="mt-1 text-[10px] text-slate-600">{formatDate(state.profile.examDate)}</div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[12px]">
                <span className="text-slate-400">Available</span>
                <span className="font-mono font-bold text-cyan-300">{formatDuration(daily)}/day</span>
              </div>
              <input type="range" min={60} max={420} step={15} value={daily} onChange={(e) => setDaily(Number(e.target.value))} className="w-full accent-cyan-400" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[12px]">
                <span className="text-slate-400">Current completion</span>
                <span className="font-mono font-bold text-violet-300">{completion}%</span>
              </div>
              <StatBar value={completion} color="#8b5cf6" height={7} />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-[12px]">
                <span className="text-slate-400">Target SGPA</span>
                <span className="font-mono font-bold text-emerald-300">{target.toFixed(1)}</span>
              </div>
              <input type="range" min={6} max={10} step={0.1} value={target} onChange={(e) => setTarget(Number(e.target.value))} className="w-full accent-emerald-400" />
            </div>

            <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5 text-[12px] text-slate-400">
              <div className="flex items-center justify-between">
                <span>Total runway</span>
                <span className="font-mono text-slate-200">{formatDuration(days * daily)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span>Phase split</span>
                <span className="text-slate-300">40 / 35 / 25</span>
              </div>
            </div>

            <Button size="lg" className="w-full" onClick={generate}>
              <Zap size={16} /> Generate plan
            </Button>
          </div>
        </GlassPanel>

        {/* ── Output ─────────────────────────────────────────────── */}
        <div>
          {!plan && (
            <GlassPanel className="flex h-[420px] flex-col items-center justify-center p-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10">
                <Flame size={26} className="text-cyan-300" />
              </div>
              <div className="mt-4 font-display text-lg font-bold text-white">No plan in orbit yet</div>
              <p className="mt-2 max-w-sm text-[13px] text-slate-500">
                Set your runway and hit GENERATE PLAN. NEXUS splits the days into Foundation → Coverage → Revision +
                Practice, then fills each day from module hours and your budget.
              </p>
              <Button className="mt-5" onClick={generate}>
                <Zap size={15} /> Generate my plan
              </Button>
            </GlassPanel>
          )}

          <AnimatePresence>
            {plan && summary && (
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* summary strip */}
                <GlassPanel className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
                  {[
                    { icon: Clock3, label: 'Plan size', value: `${summary.totalHours}h`, color: '#22d3ee' },
                    { icon: CalendarRange, label: 'Days', value: String(plan.days), color: '#3b82f6' },
                    { icon: Target, label: 'Target', value: plan.targetSgpa.toFixed(1), color: '#34d399' },
                    { icon: Zap, label: 'Intensity', value: `${plan.weeks.length} phases`, color: '#f59e0b' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${s.color}15`, color: s.color }}>
                        <s.icon size={16} />
                      </span>
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{s.label}</div>
                        <div className="font-display text-base font-bold text-white">{s.value}</div>
                      </div>
                    </div>
                  ))}
                </GlassPanel>

                {/* weeks */}
                {plan.weeks.map((week, wi) => (
                  <motion.div key={week.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: wi * 0.12 }}>
                    <GlassPanel className="overflow-hidden">
                      <div
                        className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5"
                        style={{ background: `linear-gradient(90deg, ${['#22d3ee12', '#3b82f612', '#8b5cf612'][wi]}, transparent)` }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: ['#22d3ee', '#3b82f6', '#8b5cf6'][wi] }}>
                            {week.label}
                          </span>
                          <span className="font-display text-sm font-bold text-white">{week.theme}</span>
                        </div>
                        <span className="text-[11px] text-slate-500">{week.days.length} days</span>
                      </div>

                      <div className="divide-y divide-white/[0.05]">
                        {week.days.slice(0, week.label === 'WEEK 1' ? 7 : week.label === 'WEEK 2' ? 7 : 7).map((d) => {
                          const key = `${week.label}-${d.day}`;
                          const open = expandedDay === key;
                          return (
                            <div key={key}>
                              <button
                                onClick={() => setExpandedDay(open ? null : key)}
                                className="flex w-full items-center justify-between px-5 py-3 text-left transition-colors hover:bg-white/[0.03]"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[11px] text-slate-600">D{String(d.day).padStart(2, '0')}</span>
                                  <span className="text-[12px] text-slate-300">{formatDate(d.date)}</span>
                                  <span className="hidden text-[11px] text-slate-600 md:inline">{d.focus}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono text-[11px] text-cyan-300">{formatDuration(d.totalMinutes)}</span>
                                  <span className={cn('text-[10px] text-slate-600 transition-transform', open && 'rotate-180')}>▾</span>
                                </div>
                              </button>
                              {open && (
                                <div className="space-y-1.5 bg-white/[0.015] px-5 pb-4 pt-1">
                                  {d.tasks.map((t, ti) => (
                                    <div key={ti} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                                      <div className="flex items-center gap-2.5">
                                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: COURSE_MAP[t.courseId]?.color ?? '#22d3ee' }} />
                                        <span className="text-[12px] text-slate-300">{t.label}</span>
                                      </div>
                                      <span className="whitespace-nowrap font-mono text-[11px] text-slate-500">{t.minutes} min</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </GlassPanel>
                  </motion.div>
                ))}

                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <span className="text-[11px] text-slate-500">
                    Deterministic planning engine — same inputs, same plan. Week 3 listed days shown; scroll-expand each.
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setPlan(null)}>
                      <Download size={13} /> Regenerate
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
