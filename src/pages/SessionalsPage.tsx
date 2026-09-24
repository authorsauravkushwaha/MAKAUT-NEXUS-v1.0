import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, GraduationCap, CheckCircle2, Circle, ArrowLeft, Flame } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, ProgressRing, SourceBadge, SectionLabel, Button, StatusPill, cn } from '@/components/ui';
import { SESSIONAL_COURSES } from '@/data';

export function SessionalsPage() {
  const { state, setNonTheory, setMooc } = useNexus();
  const nonTheory = SESSIONAL_COURSES.find((c) => c.id === 'non-theory')!;
  const skill = SESSIONAL_COURSES.find((c) => c.id === 'skill-course')!;

  const nonTheoryDone = (state.nonTheory.attendance ? 50 : 0) + (state.nonTheory.participation ? 50 : 0);
  const requirement = nonTheory.requirement_pct ?? 80;

  return (
    <div>
      <button
        onClick={() => window.history.back()}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.14em] text-slate-500 transition-colors hover:text-cyan-300"
      >
        <ArrowLeft size={13} /> Back
      </button>

      <PageHeader
        eyebrow="Non-theory requirements"
        title="SESSIONIAL TRACKER"
        sub="NCC / NSS / Yoga / Sports and your skill course — the parts of your grade that never appear on a written exam."
        right={
          <div className="flex items-center gap-3">
            <StatusPill status={nonTheory.verification_status} />
            <SourceBadge fact={nonTheory} />
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* NCC/NSS/Yoga/Sports */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <GlassPanel className="h-full p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-amber-300">
                  <Award size={13} /> NCC / NSS / Yoga / Sports
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-white">Attendance &amp; participation</h3>
              </div>
              <ProgressRing value={nonTheoryDone} size={80} stroke={7} color="#f59e0b" sublabel="target" />
            </div>

            <div className="mt-5 space-y-3">
              {[
                { key: 'attendance' as const, label: 'Attendance', desc: 'Marked at sessions / ground duty' },
                { key: 'participation' as const, label: 'Participation', desc: 'Active involvement recorded by mentor' },
              ].map((row) => {
                const on = state.nonTheory[row.key];
                return (
                  <button
                    key={row.key}
                    onClick={() => setNonTheory({ [row.key]: !on })}
                    className={cn(
                      'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                      on ? 'border-emerald-400/40 bg-emerald-400/[0.07]' : 'border-white/[0.07] bg-white/[0.03] hover:border-white/20',
                    )}
                  >
                    <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full border', on ? 'border-emerald-400/60 bg-emerald-400/15' : 'border-slate-600')}>
                      {on ? <CheckCircle2 size={15} className="text-emerald-300" /> : <Circle size={15} className="text-slate-600" />}
                    </span>
                    <div className="flex-1">
                      <div className={cn('text-[14px] font-semibold', on ? 'text-emerald-200' : 'text-white')}>{row.label}</div>
                      <div className="text-[11px] text-slate-500">{row.desc}</div>
                    </div>
                    <span className={cn('text-[12px] font-medium', on ? 'text-emerald-300' : 'text-slate-600')}>{on ? '✓ Done' : 'Pending'}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-amber-200/80">Overall requirement</span>
                <span className="font-mono font-bold text-amber-200">
                  {nonTheoryDone}% / {requirement}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-700"
                  style={{ width: `${Math.min(100, (nonTheoryDone / requirement) * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-amber-200/60">
                {nonTheoryDone >= requirement
                  ? 'Requirement met — keep attendance above water through the semester.'
                  : `${requirement - nonTheoryDone}% more to clear the ${requirement}% requirement.`}
              </p>
            </div>
          </GlassPanel>
        </motion.div>

        {/* Skill course / MOOC */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassPanel className="h-full p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-teal-300">
                  <GraduationCap size={13} /> Skill course
                </div>
                <h3 className="mt-2 font-display text-lg font-bold text-white">MOOC progress</h3>
              </div>
              <ProgressRing value={state.skill.moocPct} size={80} stroke={7} color="#2dd4bf" sublabel="course" />
            </div>

            <div className="mt-5 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-[12px] text-slate-400">
                <span>Course completion</span>
                <span className="font-mono text-teal-300">{state.skill.moocPct}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={state.skill.moocPct}
                onChange={(e) => setMooc(Number(e.target.value))}
                className="mt-3 w-full accent-teal-400"
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                <span>0%</span>
                <span>target 100%</span>
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                ['Enrolled', state.skill.moocPct > 0],
                ['Halfway milestone', state.skill.moocPct >= 50],
                ['Assignments cleared', state.skill.moocPct >= 75],
                ['Certificate eligible', state.skill.moocPct >= 100],
              ].map(([label, on]) => (
                <div key={label as string} className="flex items-center gap-2.5 text-[13px]">
                  <CheckCircle2 size={14} className={on ? 'text-teal-300' : 'text-slate-700'} />
                  <span className={on ? 'text-slate-200' : 'text-slate-600'}>{label as string}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
              <Flame size={16} className="text-orange-400" />
              <div className="text-[11px] leading-relaxed text-slate-500">
                Sessionals feed readiness too — they're 2 of the 10 academic components in your Semester-1 core.
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      </div>

      {/* reminder strip */}
      <GlassPanel className="mt-5 flex flex-wrap items-center justify-between gap-4 p-5">
        <div>
          <SectionLabel>Message</SectionLabel>
          <div className="mt-1.5 font-display text-base font-bold text-white">
            Your grade isn't just your written exam.
          </div>
          <p className="mt-1 text-[13px] text-slate-400">
            Labs, records, attendance, participation and MOOC completion all move your readiness score and your final
            standing — NEXUS tracks them beside theory, not in a forgotten corner.
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/labs">
            <Button variant="outline" size="sm">Lab center</Button>
          </Link>
          <Link to="/analytics">
            <Button variant="ghost" size="sm">See readiness</Button>
          </Link>
        </div>
      </GlassPanel>
    </div>
  );
}
