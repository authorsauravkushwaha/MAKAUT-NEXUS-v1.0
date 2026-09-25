import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock3, Target, TrendingUp, ChevronRight, BookOpenCheck, CircleHelp, History } from 'lucide-react';
import { useNexus } from '@/state/context';
import { CourseScene } from '@/components/three/CourseScene';
import { GlassPanel, PageHeader, ProgressRing, SourceBadge, StatBar, SectionLabel, Button, StatusPill, cn } from '@/components/ui';
import { StudySessionModal, type SessionRequest } from '@/components/StudySessionModal';
import { courseProgress, biggestGap } from '@/lib/derive';
import { COURSE_MAP } from '@/data';
import { relativeDay } from '@/lib/dates';

export function CoursePage() {
  const { courseId = '' } = useParams();
  const nav = useNavigate();
  const { state, setConcept } = useNexus();
  const course = COURSE_MAP[courseId];
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [session, setSession] = useState<SessionRequest | null>(null);

  const progress = useMemo(() => (course ? courseProgress(state, course) : null), [state, course]);
  const kind = course?.kind ?? 'theory';

  /* Labs & sessionals get their dedicated dashboards — redirect with context. */
  useEffect(() => {
    if (kind === 'lab') nav('/labs', { replace: true });
    if (kind === 'sessional') nav('/sessionals', { replace: true });
  }, [kind, nav]);

  if (!course) {
    return (
      <GlassPanel className="p-10 text-center">
        <div className="font-display text-lg text-white">Course not found</div>
        <Button className="mt-4" onClick={() => nav('/syllabus')}>Back to syllabus</Button>
      </GlassPanel>
    );
  }

  if (kind !== 'theory') return null;

  const gap = biggestGap(state);
  const activeModule = course.modules?.find((m) => m.id === openModule);

  const sceneModules = (course.modules ?? []).map((m) => ({
    id: m.id,
    index: m.index,
    title: m.title,
    hours: m.hours,
    progressPct: state.moduleProgress[course.id]?.[m.id]?.progressPct ?? 0,
  }));

  return (
    <div>
      <button
        onClick={() => nav('/syllabus')}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft size={13} /> Syllabus explorer
      </button>

      <PageHeader
        eyebrow={`${course.code} · ${course.credits} credits · ${course.hours} hours`}
        title={course.title}
        sub={course.description}
        right={
          <div className="flex items-center gap-3">
            <ProgressRing value={progress?.progressPct ?? 0} size={72} stroke={6} color={course.color} />
            <StatusPill status={course.verification_status} />
            <SourceBadge fact={course} />
          </div>
        }
      />

      {/* ── 3D module environment ────────────────────────────────── */}
      <GlassPanel className="relative h-[380px] overflow-hidden md:h-[430px]">
        <div className="absolute left-4 top-3 z-10 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full animate-blink" style={{ background: course.color }} />
          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
            {course.short} objective field — {course.hours}h → {course.modules?.length} modules
          </span>
        </div>
        <CourseScene course={course} modules={sceneModules} onSelectModule={(id) => setOpenModule(id)} />
      </GlassPanel>

      {/* ── Module cards ─────────────────────────────────────────── */}
      <SectionLabel className="mb-3 mt-7">Module board</SectionLabel>
      <div className="grid gap-3 md:grid-cols-2">
        {(course.modules ?? []).map((m, i) => {
          const p = state.moduleProgress[course.id]?.[m.id];
          const pct = p?.progressPct ?? 0;
          const isGap = gap.courseId === course.id && gap.moduleId === m.id;
          const conceptCount = Object.values(p?.concepts ?? {}).filter(Boolean).length;
          return (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => setOpenModule(m.id === openModule ? null : m.id)}
              className={cn(
                'group rounded-2xl border p-4 text-left transition-all',
                openModule === m.id
                  ? 'border-cyan-400/50 bg-cyan-400/[0.06] shadow-glow-cyan'
                  : 'border-white/[0.07] bg-white/[0.03] hover:border-white/20',
                isGap && 'border-rose-400/40',
              )}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-bold"
                  style={{ borderColor: `${course.color}55`, background: `${course.color}12`, color: course.color }}
                >
                  {m.index}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-[14px] font-semibold text-white">{m.title}</h3>
                    {isGap && <span className="rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] uppercase text-rose-300">gap</span>}
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock3 size={10} /> {m.hours} hours</span>
                    <span className="inline-flex items-center gap-1"><Target size={10} /> {m.co}</span>
                    <span className="hidden sm:inline">{m.bloom}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm font-bold" style={{ color: course.color }}>{Math.round(pct)}%</div>
                  <div className="text-[10px] text-slate-600">{conceptCount}/{m.concepts.length} concepts</div>
                </div>
              </div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: course.color, transition: 'width .8s' }} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* ── Module detail drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {activeModule && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            <GlassPanel className="p-6" glow={course.color}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.26em]" style={{ color: course.color }}>
                    Module {activeModule.index} · {activeModule.hours} hours · {activeModule.co} · {activeModule.bloom}
                  </div>
                  <h2 className="mt-1 font-display text-xl font-bold text-white">{activeModule.title}</h2>
                </div>
                <div className="flex items-center gap-5">
                  <ProgressRing
                    value={state.moduleProgress[course.id]?.[activeModule.id]?.progressPct ?? 0}
                    size={78}
                    stroke={7}
                    color={course.color}
                    sublabel="progress"
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {/* concepts */}
                <div>
                  <SectionLabel className="mb-3 flex items-center gap-1.5"><BookOpenCheck size={11} /> Concepts</SectionLabel>
                  <div className="space-y-2">
                    {(activeModule.concepts ?? []).map((c) => {
                      const done = state.moduleProgress[course.id]?.[activeModule.id]?.concepts?.[c.id] ?? false;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setConcept(course.id, activeModule.id, c.id, !done)}
                          className="flex w-full items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-left transition-colors hover:border-white/15"
                        >
                          <span
                            className={cn(
                              'flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]',
                              done ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-slate-600 text-slate-600',
                            )}
                          >
                            {done ? '✓' : ''}
                          </span>
                          <span className={cn('text-[13px]', done ? 'text-slate-400 line-through' : 'text-slate-200')}>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* stats */}
                <div>
                  <SectionLabel className="mb-3 flex items-center gap-1.5"><CircleHelp size={11} /> Practice &amp; activity</SectionLabel>
                  <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[12px] text-slate-400">Questions</span>
                      <span className="font-mono text-sm text-white">
                        {state.moduleProgress[course.id]?.[activeModule.id]?.questionsDone ?? 0} /{' '}
                        {state.moduleProgress[course.id]?.[activeModule.id]?.questionsTotal ?? activeModule.questions}
                      </span>
                    </div>
                    <StatBar
                      value={
                        ((state.moduleProgress[course.id]?.[activeModule.id]?.questionsDone ?? 0) /
                          (state.moduleProgress[course.id]?.[activeModule.id]?.questionsTotal ?? activeModule.questions)) *
                        100
                      }
                      color={course.color}
                      height={6}
                    />
                    <div className="flex items-center justify-between pt-1 text-[12px]">
                      <span className="inline-flex items-center gap-1.5 text-slate-400"><History size={12} /> Last studied</span>
                      <span className="text-slate-300">{relativeDay(state.moduleProgress[course.id]?.[activeModule.id]?.lastStudied ?? null)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="inline-flex items-center gap-1.5 text-slate-400"><TrendingUp size={12} /> Sessions</span>
                      <span className="text-slate-300">{state.moduleProgress[course.id]?.[activeModule.id]?.sessions ?? 0}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <SourceBadge fact={{ ...course }} /> Module facts inherit the course provenance.
                  </div>
                </div>

                {/* outcomes */}
                <div>
                  <SectionLabel className="mb-3">Course outcomes</SectionLabel>
                  <ul className="space-y-2">
                    {(course.outcomes ?? []).map((o) => (
                      <li key={o} className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2 text-[12px] leading-relaxed text-slate-400">
                        {o}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-4 w-full"
                    onClick={() =>
                      setSession({
                        courseId: course.id,
                        moduleId: activeModule.id,
                        title: course.title,
                        subtitle: activeModule.title,
                        minutes: 45,
                        kind: 'study',
                      })
                    }
                  >
                    Continue learning <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      <StudySessionModal request={session} onClose={() => setSession(null)} />
    </div>
  );
}
