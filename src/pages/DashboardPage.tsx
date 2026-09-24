import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Flame, CalendarClock, Sparkles, CircleCheck } from 'lucide-react';
import { useNexus } from '@/state/context';
import { AcademicCore3D } from '@/components/three/AcademicCore3D';
import { GlassPanel, Button, ProgressRing, StatBar, SectionLabel, StatusPill, cn } from '@/components/ui';
import { StudySessionModal, type SessionRequest } from '@/components/StudySessionModal';
import { allComponentProgress, courseProgress, readiness, biggestGap } from '@/lib/derive';
import { daysUntil, greeting, formatDuration, formatMissionClock, todayISO, weekdayShort } from '@/lib/dates';
import { THEORY_COURSES, LAB_COURSES, SESSIONAL_COURSES } from '@/data';

export function DashboardPage() {
  const nav = useNavigate();
  const { state, ensureMission, completeMissionItem } = useNexus();
  const [session, setSession] = useState<SessionRequest | null>(null);

  useEffect(() => {
    ensureMission();
  }, [ensureMission]);

  const r = readiness(state);
  const mission = state.mission;
  const days = daysUntil(state.profile.examDate);
  const gap = biggestGap(state);

  const comps = allComponentProgress(state);
  const orbitCourses = useMemo(() => {
    const avgOf = (ids: string[]) => {
      const vals = ids.map((id) => comps.find((x) => x.course.id === id)?.progressPct ?? 0);
      return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    };
    const labsPct = avgOf(['physics-lab', 'beee-lab', 'graphics-lab']);
    const sessPct = avgOf(['non-theory', 'skill-course']);
    return [
      ...THEORY_COURSES.map((c) => ({ course: c, progressPct: comps.find((x) => x.course.id === c.id)?.progressPct ?? 0 })),
      { course: { id: '__labs', short: 'Labs', color: '#34d399' } as any, progressPct: labsPct },
      { course: { id: '__sessionals', short: 'Sessionals', color: '#facc15' } as any, progressPct: sessPct },
    ];
  }, [comps]);

  const openCourse = (id: string) => {
    if (id === '__labs') nav('/labs');
    else if (id === '__sessionals') nav('/sessionals');
    else nav(`/syllabus/${id}`);
  };

  const week = useMemo(() => {
    const today = todayISO();
    const start = new Date(today + 'T00:00:00');
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        iso,
        label: weekdayShort(iso),
        done: state.streak.days.includes(iso),
        isToday: iso === today,
        future: iso > today,
      };
    });
  }, [state.streak.days]);

  const startItem = (item: NonNullable<typeof mission>['items'][number]) => {
    setSession({
      courseId: item.courseId,
      moduleId: item.moduleId,
      title: item.label,
      subtitle: item.sublabel,
      minutes: item.minutes,
      kind: item.kind === 'revision' ? 'revision' : 'study',
      missionItemId: item.id,
    });
  };

  return (
    <div className="relative">
      {/* ── Greeting row ─────────────────────────────────────────── */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
            {greeting()}, {state.profile.name}.
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock size={14} className="text-cyan-400" />
              You have <b className="text-cyan-300">{days} days</b> until your target exam date.
            </span>
            <span className="text-slate-600">·</span>
            <span>
              {state.profile.college} · {state.profile.branch} · {state.profile.semester} · {state.profile.group}
            </span>
          </p>
        </div>

        {/* streak */}
        <GlassPanel className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <Flame size={18} className={state.streak.todayDone ? 'text-orange-400' : 'text-orange-400/60'} />
            <div>
              <div className="font-display text-lg font-bold leading-none text-white">{state.streak.current} DAY STREAK</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">
                {state.streak.todayDone ? 'Today logged ✓' : 'Log a session to keep it alive'}
              </div>
            </div>
          </div>
          <div className="flex gap-1.5">
            {week.map((d) => (
              <div key={d.iso} className="flex flex-col items-center gap-1">
                <span className={cn('text-[9px]', d.isToday ? 'text-cyan-300' : 'text-slate-600')}>{d.label[0]}</span>
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-md border text-[9px]',
                    d.done
                      ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                      : d.isToday
                        ? 'border-cyan-400/60 bg-cyan-400/10 text-cyan-300 animate-pulse-ring'
                        : d.future
                          ? 'border-white/5 text-slate-700'
                          : 'border-white/10 text-slate-600',
                  )}
                >
                  {d.done ? '✓' : d.isToday ? '•' : '○'}
                </span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {/* ── 3D core + side rail ──────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <GlassPanel className="relative h-[540px] overflow-hidden md:h-[600px]">
          <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-blink" />
            <span className="text-[10px] uppercase tracking-[0.26em] text-slate-400">Academic galaxy — Semester 1</span>
          </div>
          <div className="absolute right-4 top-4 z-10">
            <StatusPill status="provisional" />
          </div>
          <AcademicCore3D
            courses={orbitCourses}
            readiness={r.readiness}
            onSelectCourse={openCourse}
            onCoreClick={() => nav('/analytics')}
          />
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-[10px] uppercase tracking-[0.2em] text-slate-600">
            Drag to rotate · click a planet to open
          </div>
        </GlassPanel>

        {/* side rail */}
        <div className="flex flex-col gap-4">
          {/* Today's plan */}
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>Today's plan</SectionLabel>
              <span className="font-mono text-[13px] font-bold text-cyan-300">
                {mission ? formatMissionClock(mission.totalMinutes) : '—'}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {mission?.items.map((item) => {
                const done = mission.completedItemIds.includes(item.id);
                const color =
                  item.kind === 'lab' ? '#34d399' : THEORY_COURSES.find((c) => c.id === item.courseId)?.color ?? '#22d3ee';
                return (
                  <button
                    key={item.id}
                    onClick={() => !done && startItem(item)}
                    className={cn(
                      'group block w-full rounded-xl border p-3 text-left transition-all',
                      done
                        ? 'border-emerald-400/25 bg-emerald-400/[0.06]'
                        : 'border-white/[0.07] bg-white/[0.025] hover:border-cyan-400/35 hover:bg-white/[0.05]',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn('text-[13px] font-semibold', done ? 'text-emerald-300 line-through opacity-70' : 'text-white')}>
                        {item.label}
                      </span>
                      <span className="font-mono text-[11px]" style={{ color: done ? '#6ee7b7' : color }}>
                        {item.minutes} min
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-slate-500">{item.sublabel}</span>
                      {done ? <CircleCheck size={13} className="shrink-0 text-emerald-400" /> : <ChevronRight size={13} className="shrink-0 text-slate-600 group-hover:text-cyan-400" />}
                    </div>
                    <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full" style={{ width: done ? '100%' : '0%', background: color, transition: 'width .6s' }} />
                    </div>
                  </button>
                );
              })}
              {!mission && <div className="text-[12px] text-slate-500">Generating today's mission…</div>}
            </div>

            <Button
              className="mt-4 w-full"
              onClick={() => {
                const next = mission?.items.find((i) => !mission.completedItemIds.includes(i.id));
                if (next) startItem(next);
              }}
              disabled={!mission || mission.completedItemIds.length === mission.items.length}
            >
              {mission && mission.completedItemIds.length === mission.items.length ? (
                <>
                  <CircleCheck size={15} /> Mission complete
                </>
              ) : (
                <>
                  Start today's mission <ChevronRight size={15} />
                </>
              )}
            </Button>
          </GlassPanel>

          {/* Readiness + gap */}
          <GlassPanel className="p-5">
            <div className="flex items-center gap-4">
              <ProgressRing value={r.readiness} size={86} stroke={7} color="#22d3ee" sublabel="ready" />
              <div className="flex-1 space-y-2.5">
                <StatBar label="Syllabus" value={r.syllabus} color="#22d3ee" height={6} />
                <StatBar label="Labs" value={r.labs} color="#34d399" height={6} delay={90} />
                <StatBar label="Practice" value={r.practice} color="#8b5cf6" height={6} delay={180} />
                <StatBar label="Revision" value={r.revision} color="#f59e0b" height={6} delay={270} />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-rose-400/25 bg-rose-500/[0.06] p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-rose-300">
                <Sparkles size={11} /> Biggest gap
              </div>
              <div className="mt-1 text-[13px] font-semibold text-white">
                {gap.courseTitle} — Module {gap.index}
              </div>
              <div className="text-[11px] text-slate-400">
                {gap.moduleTitle} · {gap.progressPct}% · {gap.questionsRemaining} questions remaining
              </div>
              <button onClick={() => nav('/analytics')} className="mt-2 text-[11px] font-medium text-cyan-300 hover:text-cyan-200">
                Explain my semester →
              </button>
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* ── Quick systems strip ──────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Target SGPA', value: state.profile.targetSgpa.toFixed(1), to: '/sgpa', color: '#8b5cf6' },
          { label: 'Daily budget', value: formatDuration(state.profile.dailyMinutes), to: '/planner', color: '#22d3ee' },
          { label: 'Studied today', value: formatDuration(state.studyMinutesToday), to: '/analytics', color: '#f59e0b' },
          { label: 'Components', value: '10 active', to: '/syllabus', color: '#3b82f6' },
        ].map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            onClick={() => nav(s.to)}
            className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-left transition-all hover:border-cyan-400/30 hover:bg-white/[0.05]"
          >
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{s.label}</div>
            <div className="mt-1 font-display text-xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
          </motion.button>
        ))}
      </div>

      <StudySessionModal request={session} onClose={() => setSession(null)} />
    </div>
  );
}
