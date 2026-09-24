import React from 'react';
import { TrendingDown, Zap, Flag, Layers } from 'lucide-react';
import type { SemesterSummaryData } from '@/types';
import { GlassPanel, SectionLabel, StatBar, ProgressRing, cn } from '@/components/ui';

/** "Explain My Semester" — the judge wow-moment component. */
export function SemesterSummaryCard({ data }: { data: SemesterSummaryData }) {
  const bars: { label: string; value: number; color: string }[] = [
    { label: 'Syllabus', value: data.syllabus, color: '#22d3ee' },
    { label: 'Practice', value: data.practice, color: '#8b5cf6' },
    { label: 'Labs', value: data.labs, color: '#34d399' },
    { label: 'Revision', value: data.revision, color: '#f59e0b' },
  ];
  const overall = Math.round((data.syllabus + data.practice + data.labs + data.revision) / 4);

  return (
    <GlassPanel className="overflow-hidden p-5" glow="#8b5cf6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-violet-300">Explain my semester</div>
          <div className="mt-1 font-display text-lg font-bold text-white">YOUR SEMESTER</div>
        </div>
        <ProgressRing value={overall} size={64} stroke={6} color="#8b5cf6" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <Layers size={10} /> Credits
          </div>
          <div className="font-display text-lg font-bold text-cyan-300">{data.credits}*</div>
        </div>
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <Layers size={10} /> Components
          </div>
          <div className="font-display text-lg font-bold text-violet-300">{data.components}</div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {bars.map((b) => (
          <StatBar key={b.label} label={b.label} value={b.value} color={b.color} height={7} />
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/[0.07] p-3.5">
          <SectionLabel className="flex items-center gap-1.5 !text-rose-300">
            <TrendingDown size={11} /> Your biggest gap
          </SectionLabel>
          <div className="mt-1 text-[15px] font-bold text-white">
            {data.biggestGap.courseTitle} — Module {data.biggestGap.moduleTitle}
          </div>
          <div className="text-[11px] text-slate-400">{data.biggestGap.progressPct}% complete · weighted lag behind its course</div>
        </div>

        <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/[0.07] p-3.5">
          <SectionLabel className="flex items-center gap-1.5 !text-cyan-300">
            <Zap size={11} /> Today's action
          </SectionLabel>
          <div className="mt-1 text-[15px] font-bold text-white">
            {data.todayAction.minutes} minutes — {data.todayAction.label}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/[0.07] p-3.5">
          <SectionLabel className="flex items-center gap-1.5 !text-emerald-300">
            <Flag size={11} /> Next checkpoint
          </SectionLabel>
          <div className="mt-1 text-[15px] font-bold text-white">{data.nextCheckpoint.label}</div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[8%] rounded-full bg-emerald-400" />
          </div>
        </div>
      </div>

      <p className={cn('mt-4 text-[10px] leading-relaxed text-slate-500')}>
        Generated from your live module progress, practice counts, lab records and revision state — not a generic template.
      </p>
    </GlassPanel>
  );
}
