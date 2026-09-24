import type { Mission, MissionItem, StudentState } from '@/types';
import { LAB_COURSES, THEORY_COURSES } from '@/data';
import { courseProgress, experimentScore } from '@/lib/derive';
import { todayISO } from '@/lib/dates';

let seq = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

interface CourseNeed {
  courseId: string;
  score: number;
}

/** How much a course demands attention right now. */
function courseNeed(state: StudentState, courseId: string): { score: number; deficit: number } {
  const course = THEORY_COURSES.find((c) => c.id === courseId)!;
  const p = courseProgress(state, course);
  const remainingHours = (course.hours * (100 - p.progressPct)) / 100;
  const deficit = p.questionsTotal ? 1 - p.questionsDone / p.questionsTotal : 1;
  // lag term: how far individual modules trail their own course average
  let lagSum = 0;
  for (const m of course.modules ?? []) {
    const pct = state.moduleProgress[courseId]?.[m.id]?.progressPct ?? 0;
    lagSum += Math.max(0, p.progressPct - pct) * m.hours * course.credits;
  }
  const score = course.credits * remainingHours * (1 + deficit) + 0.35 * lagSum;
  return { score, deficit };
}

/** Pick the module inside a course that deserves today's minutes most. */
function pickModule(state: StudentState, courseId: string, preferRevision: boolean) {
  const course = THEORY_COURSES.find((c) => c.id === courseId)!;
  const cp = courseProgress(state, course).progressPct;
  const mods = (course.modules ?? []).map((m) => {
    const p = state.moduleProgress[courseId]?.[m.id];
    const pct = p?.progressPct ?? 0;
    const lag = Math.max(0, cp - pct);
    const qTotal = p?.questionsTotal ?? m.questions;
    const def = qTotal ? 1 - (p?.questionsDone ?? 0) / qTotal : 1;
    const revisionNeeded = (p?.concepts?.['c' + m.concepts.length] ?? false) === false && (state.revision[courseId] ?? 0) < 100;
    return { m, pct, score: lag * (1 + def) * (100 - pct) * 0.01 + (100 - pct) * 0.1, revisionNeeded };
  });
  mods.sort((a, b) => b.score - a.score);
  if (preferRevision) {
    const rev = mods.find((x) => x.revisionNeeded);
    if (rev) return rev.m;
  }
  return mods[0]?.m;
}

/** Distribute `total` minutes across weights, clamped to [min, max], rounded to 5. */
function distribute(total: number, weights: number[], min: number, max: number): number[] {
  const n = weights.length;
  if (n === 0) return [];
  const sum = weights.reduce((a, b) => a + b, 0) || 1;
  const alloc = new Array(n).fill(0);
  const capped = new Array(n).fill(false);

  for (let pass = 0; pass < 4; pass++) {
    let pool = total;
    let free: number[] = [];
    for (let i = 0; i < n; i++) {
      if (capped[i]) pool -= alloc[i];
      else free.push(i);
    }
    if (!free.length) break;
    const w = free.reduce((a, i) => a + weights[i], 0) || 1;
    let changed = false;
    for (const i of free) {
      const raw = (pool * weights[i]) / w;
      if (raw > max) {
        alloc[i] = max;
        capped[i] = true;
        changed = true;
      } else {
        alloc[i] = raw;
      }
    }
    if (!changed) break;
  }
  // Enforce floor by stealing from the largest allocations.
  for (let i = 0; i < n; i++) {
    if (alloc[i] < min && n > 1) {
      let need = min - alloc[i];
      alloc[i] = min;
      const order = alloc.map((v, idx) => ({ v, idx })).filter((x) => x.idx !== i && x.v > min).sort((a, b) => b.v - a.v);
      for (const o of order) {
        const take = Math.min(need, o.v - min);
        alloc[o.idx] -= take;
        need -= take;
        if (need <= 0) break;
      }
    }
  }
  return alloc.map((a) => Math.max(0, Math.round(a / 5) * 5));
}

/**
 * TODAY'S MISSION — the flagship AI feature.
 * Calculates from: exam date, available hours, module hours, current completion,
 * past activity and revision requirement.
 */
export function generateMission(state: StudentState): Mission {
  const budget = state.profile.dailyMinutes;
  const needs: CourseNeed[] = THEORY_COURSES.map((c) => {
    const { score } = courseNeed(state, c.id);
    return { courseId: c.id, score };
  }).sort((a, b) => b.score - a.score);

  const top = needs.slice(0, 3);

  // A lab slot if any record/experiment is outstanding.
  let labMinutes = 0;
  let labItem: MissionItem | null = null;
  for (const lab of LAB_COURSES) {
    const target = (lab.experiments ?? []).find((e) => {
      const s = state.labs[lab.id]?.[e.id];
      return s && (s.status !== 'completed' || s.record !== 'done');
    });
    if (target) {
      labMinutes = 20;
      labItem = {
        id: uid('mi'),
        kind: 'lab',
        courseId: lab.id,
        labId: lab.id,
        experimentId: target.id,
        label: lab.short,
        sublabel: `Experiment ${target.index} — ${target.title}`,
        minutes: 20,
      };
      break;
    }
  }

  const studyBudget = Math.max(0, budget - labMinutes);
  const alloc = distribute(studyBudget, top.map((t) => t.score), 15, 60);

  const items: MissionItem[] = top.map((t, i) => {
    const course = THEORY_COURSES.find((c) => c.id === t.courseId)!;
    const preferRevision = (state.revision[course.id] ?? 0) < 60;
    const mod = pickModule(state, course.id, preferRevision)!;
    const p = state.moduleProgress[course.id]?.[mod.id];
    const revisionConceptDone = p?.concepts?.[mod.concepts[mod.concepts.length - 1]?.id] ?? true;
    const kind: MissionItem['kind'] = !revisionConceptDone && preferRevision ? 'revision' : 'study';
    return {
      id: uid('mi'),
      kind,
      courseId: course.id,
      moduleId: mod.id,
      label: course.short,
      sublabel: kind === 'revision' ? `Module revision — ${mod.title}` : mod.title,
      minutes: alloc[i] ?? 30,
    };
  });

  if (labItem) items.push(labItem);

  return {
    date: todayISO(),
    generatedAt: new Date().toISOString(),
    totalMinutes: items.reduce((a, i) => a + i.minutes, 0),
    items,
    completedItemIds: [],
  };
}

export function missionForToday(state: StudentState): Mission | null {
  if (state.mission && state.mission.date === todayISO()) return state.mission;
  return null;
}
