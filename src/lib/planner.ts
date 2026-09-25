import type { StudyPlan, StudyPlanDay, StudentState } from '@/types';
import { LAB_COURSES, THEORY_COURSES } from '@/data';
import { courseProgress } from '@/lib/derive';
import { addDays, todayISO } from '@/lib/dates';

export interface PlannerInput {
  days: number;
  dailyMinutes: number;
  startCompletion?: number;
  targetSgpa: number;
}

interface SubjectNeed {
  courseId: string;
  remainingHours: number;
  deficit: number;
  score: number;
}

function needs(state: StudentState): SubjectNeed[] {
  return THEORY_COURSES.map((c) => {
    const p = courseProgress(state, c);
    const remainingHours = (c.hours * (100 - p.progressPct)) / 100;
    const deficit = p.questionsTotal ? 1 - p.questionsDone / p.questionsTotal : 1;
    return { courseId: c.id, remainingHours, deficit, score: c.credits * remainingHours * (1 + deficit) };
  }).sort((a, b) => b.score - a.score);
}

function phaseFor(dayIdx: number, days: number): StudyPlanDay['phase'] {
  const f = dayIdx / Math.max(1, days);
  if (f < 0.4) return 'Foundation';
  if (f < 0.75) return 'Coverage';
  return 'Revision + Practice';
}

const PHASE_FOCUS: Record<StudyPlanDay['phase'], string> = {
  Foundation: 'Concepts & remaining syllabus hours',
  Coverage: 'Full syllabus sweep + question practice',
  'Revision + Practice': 'Revision cycles + timed practice',
};

/**
 * AI STUDY PLANNER — allocates study hours across the runway by module hours
 * and the student's daily budget (per the original project plan).
 */
export function generatePlan(state: StudentState, input: PlannerInput): StudyPlan {
  const days = Math.max(3, Math.min(90, Math.round(input.days)));
  const daily = Math.max(30, Math.min(600, Math.round(input.dailyMinutes)));
  const ns = needs(state);
  const startCompletion = Math.round(
    THEORY_COURSES.reduce((a, c) => a + courseProgress(state, c).progressPct, 0) / (THEORY_COURSES.length || 1),
  );

  const totalBudgetMin = days * daily;
  const remainingTheoryMin = ns.reduce((a, n) => a + n.remainingHours * 60, 0);
  const pendingLabMin = LAB_COURSES.reduce((a, lab) => {
    const pending = (lab.experiments ?? []).filter((e) => (state.labs[lab.id]?.[e.id]?.record ?? 'pending') !== 'done').length;
    return a + pending * 45;
  }, 0);
  const practiceMin = Math.round(totalBudgetMin * 0.18);
  const revisionMin = Math.round(totalBudgetMin * 0.2);
  const requiredMin = remainingTheoryMin + pendingLabMin + practiceMin + revisionMin;
  const intensity = requiredMin > totalBudgetMin ? (requiredMin / totalBudgetMin).toFixed(1) + '×' : 'balanced';

  const weekDefs = [
    { label: 'WEEK 1', theme: 'Foundation' },
    { label: 'WEEK 2', theme: 'Coverage' },
    { label: 'WEEK 3', theme: 'Revision + Practice' },
  ];

  const planDays: StudyPlanDay[] = [];
  const start = todayISO();

  for (let d = 0; d < days; d++) {
    const phase = phaseFor(d, days);
    const date = addDays(start, d + 1);
    const tasks: StudyPlanDay['tasks'] = [];

    if (phase === 'Foundation') {
      // Reserve a lab slot on alternating days, split the rest across top needs.
      const wantsLab =
        d % 2 === 0 &&
        LAB_COURSES.some((l) => (l.experiments ?? []).some((e) => (state.labs[l.id]?.[e.id]?.record ?? 'pending') !== 'done'));
      const labReserve = wantsLab ? 40 : 0;
      const slot = Math.floor((daily - labReserve) / Math.min(3, ns.length));
      for (const n of ns.slice(0, 3)) {
        const course = THEORY_COURSES.find((c) => c.id === n.courseId)!;
        tasks.push({
          courseId: n.courseId,
          label: `Study ${course.short} — next unopened module`,
          minutes: slot,
        });
      }
      if (wantsLab) {
        const lab = LAB_COURSES.find((l) =>
          (l.experiments ?? []).some((e) => (state.labs[l.id]?.[e.id]?.record ?? 'pending') !== 'done'),
        );
        if (lab) tasks.push({ courseId: lab.id, label: `Complete one ${lab.short} record`, minutes: labReserve });
      }
    } else if (phase === 'Coverage') {
      const slot = Math.floor(daily * 0.65 / 2);
      const top = ns.slice(0, 2);
      for (const n of top) {
        const course = THEORY_COURSES.find((c) => c.id === n.courseId)!;
        tasks.push({ courseId: n.courseId, label: `Finish ${course.short} coverage + 10 practice questions`, minutes: slot });
      }
      tasks.push({ courseId: ns[0].courseId, label: 'Targeted practice on weak module', minutes: daily - slot * 2 });
    } else {
      const slot = Math.floor(daily * 0.5);
      tasks.push({ courseId: ns[0].courseId, label: 'Revision pass + formula sweep', minutes: slot });
      tasks.push({ courseId: ns[1].courseId, label: 'Timed practice set (15 questions)', minutes: daily - slot });
    }

    const clamped = tasks.map((t) => ({ ...t, minutes: Math.max(15, t.minutes) }));
    planDays.push({
      day: d + 1,
      date,
      phase,
      focus: PHASE_FOCUS[phase],
      tasks: clamped,
      totalMinutes: clamped.reduce((a, t) => a + t.minutes, 0),
    });
  }

  // Group into the three spec phases (Week 1 / 2 / 3 buckets) by time fraction.
  const boundaries = [Math.ceil(days * 0.4), Math.ceil(days * 0.75), days];
  const weeks = weekDefs.map((w, i) => {
    const from = i === 0 ? 0 : boundaries[i - 1];
    const to = boundaries[i];
    return { label: w.label, theme: w.theme, days: planDays.slice(from, to) };
  });

  return {
    generatedAt: new Date().toISOString(),
    days,
    dailyMinutes: daily,
    startCompletion,
    targetSgpa: input.targetSgpa,
    weeks,
  };
}

export function planSummary(plan: StudyPlan) {
  const total = plan.weeks.reduce((a, w) => a + w.days.reduce((b, d) => b + d.totalMinutes, 0), 0);
  return { totalMinutes: total, totalHours: Math.round(total / 60), intensity: plan.weeks.length };
}
