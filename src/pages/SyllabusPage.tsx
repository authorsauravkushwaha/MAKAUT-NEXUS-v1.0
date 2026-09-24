import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, Clock3, Boxes, ArrowUpRight } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, ProgressRing, SourceBadge, StatusPill, SectionLabel, cn, GLOW } from '@/components/ui';
import { courseProgress } from '@/lib/derive';
import { SEMESTER_1, THEORY_COURSES, LAB_COURSES, SESSIONAL_COURSES } from '@/data';

function CourseCard({ courseId, delay }: { courseId: string; delay: number }) {
  const nav = useNavigate();
  const { state } = useNexus();
  const course = [...THEORY_COURSES, ...LAB_COURSES, ...SESSIONAL_COURSES].find((c) => c.id === courseId)!;
  const p = courseProgress(state, course);
  const isLab = course.kind === 'lab';
  const isSessional = course.kind === 'sessional';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: -6 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{ perspective: 900 }}
      className="relative h-full"
    >
      <button
        onClick={() => nav(`/syllabus/${course.id}`)}
        className="group relative block h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-glow-soft"
      >
        {/* corner glow */}
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-50"
          style={{ background: course.color }}
        />
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-white/[0.03]" />

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: course.color, boxShadow: `0 0 8px ${course.color}` }} />
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                {isLab ? 'Laboratory' : isSessional ? 'Sessional' : 'Theory'}
              </span>
            </div>
            <h3 className="mt-2 font-display text-[15px] font-bold leading-snug text-white">{course.title}</h3>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Layers size={11} /> {course.credits} {course.credits === 1 ? 'credit' : 'credits'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={11} /> {course.hours}h
              </span>
              <span className="inline-flex items-center gap-1">
                <Boxes size={11} /> {course.modules?.length ?? course.experiments?.length ?? 2}{' '}
                {course.modules ? 'modules' : course.experiments ? 'exps' : 'parts'}
              </span>
            </div>
          </div>
          <ProgressRing value={p.progressPct} size={62} stroke={6} color={course.color} />
        </div>

        {/* progress bar */}
        <div className="relative mt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
            <div
              className="h-full rounded-full"
              style={{ width: `${p.progressPct}%`, background: `linear-gradient(90deg, ${course.color}66, ${course.color})`, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <SourceBadge fact={course} /> Source
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 transition-colors group-hover:text-cyan-300">
              Open <ArrowUpRight size={12} />
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

export function SyllabusPage() {
  const { state } = useNexus();
  const credited = SEMESTER_1.courses.filter((c) => c.credits > 0).reduce((a, c) => a + c.credits, 0);

  return (
    <div>
      <PageHeader
        eyebrow="Knowledge layer"
        title="SEMESTER 1"
        sub="Ten academic components. Every figure below is tagged with its source, type, verification status and check date."
        right={
          <div className="flex items-center gap-3">
            <GlassPanel className="px-4 py-2.5 text-center">
              <div className="font-display text-xl font-bold text-cyan-300">{credited}*</div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Credits</div>
            </GlassPanel>
            <GlassPanel className="px-4 py-2.5 text-center">
              <div className="font-display text-xl font-bold text-violet-300">{SEMESTER_1.components_count}</div>
              <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500">Components</div>
            </GlassPanel>
            <StatusPill status="provisional" />
          </div>
        }
      />

      {/* credits caveat */}
      <GlassPanel className="mb-6 flex items-start gap-3 border-amber-400/20 bg-amber-400/[0.05] p-4">
        <span className="text-base leading-none">⚠️</span>
        <div className="text-[12px] leading-relaxed text-amber-200/80">
          <b>20 credits*</b> — reported by the 2026 syllabus research dossier. Conflicts with CEMK's published timetable
          are unresolved (CONF-01), so treat the structure as <b>verification pending</b> until the official
          Semester-1 registration list is in hand.
          <span className="mt-1 flex items-center gap-1.5">
            <SourceBadge fact={SEMESTER_1} /> <span className="text-amber-300/70">provenance for this header</span>
          </span>
        </div>
      </GlassPanel>

      <SectionLabel className="mb-3">Theory courses</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {THEORY_COURSES.map((c, i) => (
          <CourseCard key={c.id} courseId={c.id} delay={i * 0.07} />
        ))}
      </div>

      <SectionLabel className="mb-3 mt-8">Laboratories</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LAB_COURSES.map((c, i) => (
          <CourseCard key={c.id} courseId={c.id} delay={0.1 + i * 0.07} />
        ))}
      </div>

      <SectionLabel className="mb-3 mt-8">Sessionials &amp; non-theory</SectionLabel>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SESSIONAL_COURSES.map((c, i) => (
          <CourseCard key={c.id} courseId={c.id} delay={0.1 + i * 0.07} />
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link to="/sessionals" className="text-[12px] text-cyan-300 hover:text-cyan-200">
          Open non-theory requirements →
        </Link>
        <span className="text-slate-700">|</span>
        <Link to="/labs" className="text-[12px] text-cyan-300 hover:text-cyan-200">
          Lab command center →
        </Link>
      </div>
    </div>
  );
}
