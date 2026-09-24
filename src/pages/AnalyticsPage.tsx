import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, ProgressRing, SectionLabel, StatBar, Button, StatusPill, cn } from '@/components/ui';
import { SemesterSummaryCard } from '@/pages/SemesterSummaryCard';
import { allComponentProgress, explainSemester, readiness } from '@/lib/derive';
import { ACHIEVEMENTS, evaluateAchievements } from '@/lib/achievements';
import { deriveContext } from '@/lib/derive';
import { THEORY_COURSES, LAB_COURSES, SEMESTER_1 } from '@/data';
import { todayISO, weekdayShort, formatDuration } from '@/lib/dates';

/* ── Academic Radar ──────────────────────────────────────────────── */
function RadarChart({ axes }: { axes: { label: string; value: number; color: string }[] }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const maxR = 104;
  const n = axes.length;
  const pt = (i: number, r: number) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r] as const;
  };
  const poly = axes.map((ax, i) => pt(i, (ax.value / 100) * maxR).join(',')).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[340px]">
      <defs>
        <radialGradient id="radarFill">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={axes.map((_, i) => pt(i, maxR * f).join(',')).join(' ')}
          fill="none"
          stroke="rgba(148,163,184,0.16)"
          strokeWidth="1"
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(148,163,184,0.16)" />;
      })}
      <motion.polygon
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
        points={poly}
        fill="url(#radarFill)"
        stroke="#22d3ee"
        strokeWidth="2"
      />
      {axes.map((ax, i) => {
        const [x, y] = pt(i, (ax.value / 100) * maxR);
        const [lx, ly] = pt(i, maxR + 26);
        return (
          <g key={ax.label}>
            <circle cx={x} cy={y} r="4" fill={ax.color} stroke="#04060d" strokeWidth="1.5" />
            <text
              x={lx}
              y={ly - 6}
              textAnchor="middle"
              className="fill-slate-400"
              style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' }}
            >
              {ax.label}
            </text>
            <text x={lx} y={ly + 10} textAnchor="middle" className="fill-white" style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Space Grotesk' }}>
              {ax.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function AnalyticsPage() {
  const { state } = useNexus();
  const [showSummary, setShowSummary] = useState(false);
  const r = readiness(state);
  const comps = allComponentProgress(state);
  const ctx = deriveContext(state);
  const ach = evaluateAchievements(ctx);

  const axes = useMemo(
    () => [
      { label: 'Syllabus', value: r.syllabus, color: '#22d3ee' },
      { label: 'Practice', value: r.practice, color: '#8b5cf6' },
      { label: 'Labs', value: r.labs, color: '#34d399' },
      { label: 'Revision', value: r.revision, color: '#f59e0b' },
    ],
    [r],
  );

  const week = useMemo(() => {
    const today = todayISO();
    const start = new Date(today + 'T00:00:00');
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { iso, label: weekdayShort(iso), done: state.streak.days.includes(iso), isToday: iso === today, future: iso > today };
    });
  }, [state.streak.days]);

  const summary = explainSemester(state);

  return (
    <div>
      <PageHeader
        eyebrow="Analytics"
        title="Where you stand"
        sub="Readiness, academic radar, course board, streak and achievements — all computed from your live state."
        right={
          <Button variant="violet" onClick={() => setShowSummary((s) => !s)}>
            <Sparkles size={15} /> Explain my semester
          </Button>
        }
      />

      <AnimateShow show={showSummary}>
        <div className="mb-5 grid gap-4 lg:grid-cols-[380px_1fr]">
          <SemesterSummaryCard data={summary} />
          <GlassPanel className="p-5">
            <SectionLabel className="mb-4">Component board</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {comps.map((c, i) => (
                <motion.div
                  key={c.course.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-medium text-white">
                      <span className="h-2 w-2 rounded-full" style={{ background: c.course.color, boxShadow: `0 0 6px ${c.course.color}` }} />
                      {c.course.short}
                    </span>
                    <span className="font-mono text-[12px]" style={{ color: c.course.color }}>
                      {Math.round(c.progressPct)}%
                    </span>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                    <div className="h-full rounded-full" style={{ width: `${c.progressPct}%`, background: c.course.color, transition: 'width 1s' }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassPanel>
        </div>
      </AnimateShow>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* radar */}
        <GlassPanel className="flex flex-col items-center justify-center p-5">
          <div className="self-start">
            <SectionLabel>Academic radar</SectionLabel>
          </div>
          <RadarChart axes={axes} />
          <p className="mt-1 text-center text-[11px] text-slate-600">Instant read on where you're behind.</p>
        </GlassPanel>

        {/* readiness */}
        <GlassPanel className="flex flex-col items-center justify-center p-6 text-center">
          <SectionLabel>Current readiness</SectionLabel>
          <div className="my-4">
            <ProgressRing value={r.readiness} size={150} stroke={11} color="#22d3ee" sublabel="mission ready" />
          </div>
          <div className="grid w-full grid-cols-2 gap-2.5">
            {[
              ['Syllabus', r.syllabus, '#22d3ee'],
              ['Practice', r.practice, '#8b5cf6'],
              ['Labs', r.labs, '#34d399'],
              ['Revision', r.revision, '#f59e0b'],
            ].map(([l, v, c]) => (
              <div key={l as string} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-2">
                <div className="text-[9px] uppercase tracking-[0.14em] text-slate-500">{l}</div>
                <div className="font-mono text-sm font-bold" style={{ color: c as string }}>{v as number}</div>
              </div>
            ))}
          </div>
        </GlassPanel>

        {/* streak + study log */}
        <GlassPanel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel className="flex items-center gap-1.5"><Flame size={12} className="text-orange-400" /> Streak</SectionLabel>
            <span className="font-display text-sm font-bold text-white">{state.streak.current} DAY STREAK</span>
          </div>

          <div className="mt-4 flex justify-between gap-1.5">
            {week.map((d) => (
              <div key={d.iso} className="flex flex-1 flex-col items-center gap-1.5">
                <span className={cn('text-[9px] uppercase', d.isToday ? 'text-cyan-300' : 'text-slate-600')}>{d.label}</span>
                <span
                  className={cn(
                    'flex h-8 w-full items-center justify-center rounded-lg border text-[12px]',
                    d.done
                      ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                      : d.isToday
                        ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300'
                        : 'border-white/[0.07] text-slate-700',
                  )}
                >
                  {d.done ? '✓' : d.isToday ? '•' : '○'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2">
            <SectionLabel>Study log (7 days)</SectionLabel>
            {state.studyLog.slice(-7).map((l) => {
              const max = Math.max(...state.studyLog.slice(-7).map((x) => x.minutes), 60);
              return (
                <div key={l.date} className="flex items-center gap-2.5">
                  <span className="w-12 shrink-0 font-mono text-[10px] text-slate-600">{l.date.slice(5)}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500/60 to-amber-400" style={{ width: `${(l.minutes / max) * 100}%` }} />
                  </div>
                  <span className="w-14 shrink-0 text-right font-mono text-[10px] text-slate-500">{formatDuration(l.minutes)}</span>
                </div>
              );
            })}
            {state.studyLog.length === 0 && <p className="text-[12px] text-slate-600">No sessions logged yet.</p>}
          </div>

          <div className="mt-4 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3">
            <div className="text-[11px] text-amber-200/80">
              {state.streak.todayDone
                ? `Today logged ✓ — you're at ${state.streak.current} days. ${7 - state.streak.current > 0 ? `${7 - state.streak.current} to 7-Day Scholar.` : 'Achievement unlocked!'}`
                : `Log a session today to reach ${state.streak.current + 1} days.`}
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* ── Achievements ─────────────────────────────────────────── */}
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <SectionLabel className="flex items-center gap-1.5"><Trophy size={12} className="text-amber-400" /> Achievements</SectionLabel>
          <span className="text-[11px] text-slate-500">
            {ach.unlocked.length}/{ACHIEVEMENTS.length} unlocked
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {ACHIEVEMENTS.map((a, i) => {
            const p = ach.progress[a.id] ?? 0;
            const unlocked = p >= 1;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={cn(
                  'relative overflow-hidden rounded-2xl border p-4 text-center transition-all',
                  unlocked
                    ? 'border-amber-400/40 bg-amber-400/[0.07] shadow-[0_0_24px_rgba(245,158,11,0.12)]'
                    : 'border-white/[0.07] bg-white/[0.03]',
                )}
              >
                <div className={cn('text-3xl', !unlocked && 'grayscale opacity-45')}>{a.emoji}</div>
                <div className={cn('mt-2 text-[12px] font-bold', unlocked ? 'text-amber-200' : 'text-white')}>{a.title}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-slate-500">{a.blurb}</div>
                <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p * 100}%`, background: unlocked ? '#f59e0b' : '#38bdf8', transition: 'width .8s' }}
                  />
                </div>
                <div className="mt-1 font-mono text-[9px] text-slate-600">{Math.round(p * 100)}%</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* course detail table */}
      <div className="mt-5">
        <SectionLabel className="mb-3">Theory course progress</SectionLabel>
        <GlassPanel className="divide-y divide-white/[0.05] overflow-hidden">
          {THEORY_COURSES.map((c) => {
            const cp = comps.find((x) => x.course.id === c.id);
            return (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                <div className="w-40 shrink-0">
                  <div className="text-[13px] font-medium text-white">{c.short}</div>
                  <div className="text-[10px] text-slate-600">{c.credits}cr · {c.hours}h · {c.modules?.length} mods</div>
                </div>
                <div className="flex-1">
                  <StatBar value={cp?.progressPct ?? 0} color={c.color} height={7} />
                </div>
                <span className="w-16 shrink-0 text-right font-display text-sm font-bold" style={{ color: c.color }}>
                  {Math.round(cp?.progressPct ?? 0)}%
                </span>
                <StatusPill status={c.verification_status} />
              </div>
            );
          })}
        </GlassPanel>
      </div>
    </div>
  );
}

function AnimateShow({ show, children }: { show: boolean; children: React.ReactNode }) {
  if (!show) return null;
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
      {children}
    </motion.div>
  );
}
