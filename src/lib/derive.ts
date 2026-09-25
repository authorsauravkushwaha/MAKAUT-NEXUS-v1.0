import type {
  CourseDef,
  CourseProgress,
  DeriveContext,
  ReadinessBreakdown,
  SemesterSummaryData,
  StudentState,
} from '@/types';
import { ALL_COURSES, LAB_COURSES, SESSIONAL_COURSES, THEORY_COURSES } from '@/data';

export const BLOOM_WEIGHT: Record<string, number> = {
  Remember: 1.0,
  Understand: 1.1,
  Apply: 1.2,
  Analyse: 1.3,
  Evaluate: 1.35,
  Create: 1.4,
};

export function experimentScore(state: StudentState, labId: string, expId: string): number {
  const s = state.labs[labId]?.[expId];
  if (!s) return 0;
  let score = s.status === 'completed' ? 0.75 : s.status === 'in_progress' ? 0.4 : 0;
  if (s.record === 'done') score += 0.15;
  if (s.verified) score += 0.1;
  return Math.min(1, score);
}

export function labCourseProgress(state: StudentState, course: CourseDef): number {
  const exps = course.experiments ?? [];
  if (!exps.length) return 0;
  const sum = exps.reduce((acc, e) => acc + experimentScore(state, course.id, e.id), 0);
  return (sum / exps.length) * 100;
}

export function labSubStats(state: StudentState, course: CourseDef) {
  const exps = course.experiments ?? [];
  const n = exps.length || 1;
  let expScore = 0;
  let records = 0;
  let verified = 0;
  let started = 0;
  for (const e of exps) {
    const s = state.labs[course.id]?.[e.id];
    expScore += s?.status === 'completed' ? 1 : s?.status === 'in_progress' ? 0.5 : 0;
    if (s?.status !== 'not_started') started++;
    if (s?.record === 'done') records++;
    if (s?.verified) verified++;
  }
  return {
    experimentsPct: (expScore / n) * 100,
    recordsPct: (records / n) * 100,
    startedCount: started,
    recordsDone: records,
    verified,
    total: exps.length,
    completionPct: labCourseProgress(state, course),
  };
}

export function sessionalProgress(state: StudentState, course: CourseDef): number {
  if (course.id === 'non-theory') {
    const { attendance, participation } = state.nonTheory;
    const pct = (attendance ? 50 : 0) + (participation ? 50 : 0);
    // Counted against the published 80% requirement.
    return pct === 100 ? (course.requirement_pct ?? 80) : pct;
  }
  if (course.id === 'skill-course') return state.skill.moocPct;
  return 0;
}

export function courseProgress(state: StudentState, course: CourseDef): CourseProgress {
  if (course.kind === 'theory') {
    const mods = course.modules ?? [];
    const totalHours = mods.reduce((a, m) => a + m.hours, 0) || 1;
    let pct = 0;
    let qDone = 0;
    let qTotal = 0;
    let done = 0;
    for (const m of mods) {
      const p = state.moduleProgress[course.id]?.[m.id];
      pct += ((p?.progressPct ?? 0) * m.hours) / totalHours;
      qDone += p?.questionsDone ?? 0;
      qTotal += p?.questionsTotal ?? m.questions;
      if ((p?.progressPct ?? 0) >= 100) done++;
    }
    return {
      courseId: course.id,
      progressPct: pct,
      questionsDone: qDone,
      questionsTotal: qTotal,
      modulesDone: done,
      modulesTotal: mods.length,
    };
  }
  if (course.kind === 'lab') {
    const stats = labSubStats(state, course);
    return {
      courseId: course.id,
      progressPct: stats.completionPct,
      questionsDone: stats.recordsDone,
      questionsTotal: stats.total,
      modulesDone: stats.verified,
      modulesTotal: stats.total,
    };
  }
  const pct = sessionalProgress(state, course);
  return { courseId: course.id, progressPct: pct, questionsDone: 0, questionsTotal: 0, modulesDone: 0, modulesTotal: 0 };
}

export function allComponentProgress(state: StudentState): { course: CourseDef; progressPct: number }[] {
  return ALL_COURSES.map((course) => ({ course, progressPct: courseProgress(state, course).progressPct }));
}

export function readiness(state: StudentState): ReadinessBreakdown {
  const comps = allComponentProgress(state);
  const syllabus = comps.reduce((a, c) => a + c.progressPct, 0) / (comps.length || 1);

  let qDone = 0;
  let qTotal = 0;
  for (const c of THEORY_COURSES) {
    const p = courseProgress(state, c);
    qDone += p.questionsDone;
    qTotal += p.questionsTotal;
  }
  const practice = qTotal ? (qDone / qTotal) * 100 : 0;

  const labs = LAB_COURSES.reduce((a, c) => a + courseProgress(state, c).progressPct, 0) / (LAB_COURSES.length || 1);

  const revs = THEORY_COURSES.map((c) => state.revision[c.id] ?? 0);
  const revision = revs.reduce((a, b) => a + b, 0) / (revs.length || 1);

  const score = 0.45 * syllabus + 0.2 * practice + 0.2 * labs + 0.15 * revision;
  return {
    syllabus: Math.round(syllabus),
    practice: Math.round(practice),
    labs: Math.round(labs),
    revision: Math.round(revision),
    readiness: Math.round(score),
  };
}

export interface ModuleGap {
  courseId: string;
  courseTitle: string;
  moduleId: string;
  moduleTitle: string;
  index: string;
  progressPct: number;
  lag: number;
  gapScore: number;
  bloom: string;
  questionsRemaining: number;
}

export function moduleGaps(state: StudentState): ModuleGap[] {
  const out: ModuleGap[] = [];
  for (const c of THEORY_COURSES) {
    const cp = courseProgress(state, c).progressPct;
    for (const m of c.modules ?? []) {
      const p = state.moduleProgress[c.id]?.[m.id];
      const pct = p?.progressPct ?? 0;
      const lag = Math.max(0, cp - pct);
      const qDone = p?.questionsDone ?? 0;
      const qTotal = p?.questionsTotal ?? m.questions;
      const practiceDeficit = qTotal ? 1 - qDone / qTotal : 1;
      const bloom = BLOOM_WEIGHT[m.bloom] ?? 1;
      const gapScore = lag * m.hours * c.credits * bloom * (1 + practiceDeficit);
      out.push({
        courseId: c.id,
        courseTitle: c.title,
        moduleId: m.id,
        moduleTitle: m.title,
        index: m.index,
        progressPct: Math.round(pct),
        lag: Math.round(lag),
        gapScore,
        bloom: m.bloom,
        questionsRemaining: Math.max(0, qTotal - qDone),
      });
    }
  }
  out.sort((a, b) => b.gapScore - a.gapScore);
  return out;
}

export function biggestGap(state: StudentState): ModuleGap {
  const gaps = moduleGaps(state);
  return (
    gaps[0] ?? {
      courseId: THEORY_COURSES[0].id,
      courseTitle: THEORY_COURSES[0].title,
      moduleId: 'm1',
      moduleTitle: THEORY_COURSES[0].modules?.[0]?.title ?? '—',
      index: '01',
      progressPct: 0,
      lag: 0,
      gapScore: 0,
      bloom: 'Understand',
      questionsRemaining: 0,
    }
  );
}

export function deriveContext(state: StudentState): DeriveContext {
  return { state, courses: THEORY_COURSES, labs: LAB_COURSES, sessionals: SESSIONAL_COURSES };
}

export function explainSemester(state: StudentState, todayMissionMinutes?: number): SemesterSummaryData {
  const r = readiness(state);
  const gap = biggestGap(state);
  const firstItem = state.mission?.items.find((i) => !state.mission?.completedItemIds.includes(i.id));
  return {
    credits: 20,
    components: ALL_COURSES.length,
    syllabus: r.syllabus,
    practice: r.practice,
    labs: r.labs,
    revision: r.revision,
    biggestGap: {
      courseId: gap.courseId,
      courseTitle: gap.courseTitle,
      moduleId: gap.moduleId,
      moduleTitle: gap.moduleTitle,
      progressPct: gap.progressPct,
    },
    todayAction: {
      label: firstItem ? firstItem.sublabel : gap.moduleTitle,
      minutes: firstItem?.minutes ?? todayMissionMinutes ?? 45,
    },
    nextCheckpoint: {
      label: `Complete ${Math.max(5, Math.min(15, gap.questionsRemaining || 10))} questions — ${gap.moduleTitle}`,
      done: 0,
      total: Math.max(5, Math.min(15, gap.questionsRemaining || 10)),
    },
  };
}
