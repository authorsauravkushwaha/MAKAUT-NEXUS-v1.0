import type { AchievementDef, DeriveContext } from '@/types';
import { courseProgress, labSubStats, readiness } from '@/lib/derive';

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'core-builder',
    emoji: '🚀',
    title: 'Core Builder',
    blurb: 'Build your academic core.',
    progress: (d) => (d.state.onboarded ? 1 : 0),
  },
  {
    id: 'concept-master',
    emoji: '🧠',
    title: 'Concept Master',
    blurb: 'Complete 5 modules (100%).',
    progress: (d) => {
      let done = 0;
      for (const c of d.courses) {
        for (const m of c.modules ?? []) {
          if ((d.state.moduleProgress[c.id]?.[m.id]?.progressPct ?? 0) >= 100) done++;
        }
      }
      return Math.min(1, done / 5);
    },
  },
  {
    id: 'lab-ready',
    emoji: '🧪',
    title: 'Lab Ready',
    blurb: 'Complete all current lab records.',
    progress: (d) => {
      let done = 0;
      let total = 0;
      for (const l of d.labs) {
        const s = labSubStats(d.state, l);
        done += s.recordsDone;
        total += s.total;
      }
      return total ? done / total : 0;
    },
  },
  {
    id: 'syllabus-zero',
    emoji: '📚',
    title: 'Syllabus Zero',
    blurb: 'Complete the syllabus (100%).',
    progress: (d) => readiness(d.state).syllabus / 100,
  },
  {
    id: 'seven-day-scholar',
    emoji: '🔥',
    title: '7-Day Scholar',
    blurb: 'Study seven consecutive days.',
    progress: (d) => Math.min(1, d.state.streak.current / 7),
  },
  {
    id: 'target-locked',
    emoji: '🎯',
    title: 'Target Locked',
    blurb: 'Reach 85% readiness.',
    progress: (d) => Math.min(1, readiness(d.state).readiness / 85),
  },
];

export function evaluateAchievements(d: DeriveContext): { unlocked: string[]; progress: Record<string, number> } {
  const progress: Record<string, number> = {};
  const unlocked: string[] = [];
  for (const a of ACHIEVEMENTS) {
    const p = a.progress(d);
    progress[a.id] = p;
    if (p >= 1) unlocked.push(a.id);
  }
  return { unlocked, progress };
}

export function diffNewAchievements(before: string[], after: string[]): string[] {
  return after.filter((id) => !before.includes(id));
}
