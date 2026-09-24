import type { CourseDef, Mission, StudentState, ModuleProgress } from '@/types';
import { LAB_COURSES, THEORY_COURSES } from '@/data';
import { addDays, todayISO } from '@/lib/dates';

function mod(progressPct: number, concepts: string[], done: string[], questionsDone: number, questionsTotal: number, daysAgo: number | null): ModuleProgress {
  const map: Record<string, boolean> = {};
  concepts.forEach((c) => (map[c] = done.includes(c)));
  return {
    progressPct,
    concepts: map,
    questionsDone,
    questionsTotal,
    lastStudied: daysAgo === null ? null : new Date(Date.now() - daysAgo * 86400000).toISOString(),
    sessions: Math.max(1, Math.round(progressPct / 18)),
  };
}

/** The demo pilot: "Saurav" at CEMK — seeded to the hackathon demo numbers. */
export function createSeedState(): StudentState {
  const examDate = addDays(todayISO(), 18);

  const moduleProgress: StudentState['moduleProgress'] = {
    'mathematics-1': {
      // Spec demo: m1 progress 70%, concepts ✓✓✓○○, questions 12/20, "last studied yesterday"
      m1: mod(70, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1', 'c2', 'c3'], 12, 20, 1),
      m2: mod(85, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1', 'c2', 'c3'], 10, 16, 3),
      m3: mod(82, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1', 'c2'], 8, 14, 5),
      m4: mod(76, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1'], 10, 18, 2),
    },
    physics: {
      m1: mod(47, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1', 'c2', 'c3'], 13, 16, 4),
      m2: mod(46, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 13, 14, 4),
      m3: mod(44, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 13, 15, 6),
      m4: mod(44, ['c1', 'c2', 'c3', 'c4'], ['c1'], 11, 13, 6),
    },
    beee: {
      m1: mod(72, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1', 'c2', 'c3'], 12, 16, 2),
      m2: mod(68, ['c1', 'c2', 'c3', 'c4', 'c5'], ['c1', 'c2'], 10, 18, 2),
      m3: mod(64, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 7, 15, 5),
      m4: mod(58, ['c1', 'c2', 'c3', 'c4'], ['c1'], 6, 15, 6),
      m5: mod(53, ['c1', 'c2', 'c3', 'c4'], ['c1'], 4, 12, 8),
      m6: mod(47, ['c1', 'c2', 'c3', 'c4'], [], 6, 16, 9),
    },
    english: {
      m1: mod(78, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 8, 12, 3),
      m2: mod(74, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 7, 10, 4),
      m3: mod(70, ['c1', 'c2', 'c3', 'c4'], ['c1'], 7, 12, 7),
      m4: mod(64, ['c1', 'c2', 'c3', 'c4'], ['c1'], 6, 10, 7),
    },
    graphics: {
      m1: mod(86, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2', 'c3'], 9, 12, 3),
      m2: mod(84, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2', 'c3'], 10, 14, 4),
      m3: mod(80, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 8, 12, 6),
      m4: mod(78, ['c1', 'c2', 'c3', 'c4'], ['c1', 'c2'], 7, 12, 6),
    },
  };

  const exp = (status: 'not_started' | 'in_progress' | 'completed', record: 'pending' | 'done', verified: boolean) => ({ status, record, verified });

  const labs: StudentState['labs'] = {
    'physics-lab': {
      'ph-01': exp('completed', 'done', true),
      'ph-02': exp('completed', 'done', true),
      'ph-03': exp('completed', 'done', true),
      'ph-04': exp('not_started', 'pending', false), // spec: Experiment 04 — Not Started / Pending / Pending
      'ph-05': exp('completed', 'done', false),
      'ph-06': exp('completed', 'done', false),
      'ph-07': exp('completed', 'pending', false),
      'ph-08': exp('not_started', 'pending', false),
    },
    'beee-lab': {
      'ee-01': exp('completed', 'done', true),
      'ee-02': exp('completed', 'done', true),
      'ee-03': exp('completed', 'done', true),
      'ee-04': exp('completed', 'done', true),
      'ee-05': exp('completed', 'done', false),
      'ee-06': exp('in_progress', 'pending', false),
    },
    'graphics-lab': {
      'gr-01': exp('completed', 'done', true),
      'gr-02': exp('completed', 'done', true),
      'gr-03': exp('completed', 'done', true),
      'gr-04': exp('completed', 'done', true),
      'gr-05': exp('completed', 'done', false),
      'gr-06': exp('completed', 'pending', false),
    },
  };

  const streakDays: string[] = [];
  for (let i = 6; i >= 1; i--) streakDays.push(addDays(todayISO(), -i));

  const studyLog = streakDays.map((date, i) => ({ date, minutes: 95 + ((i * 37) % 90) }));

  const mission: Mission | null = null; // generated on first dashboard mount for the current day

  return {
    version: 1,
    onboarded: true,
    profile: {
      name: 'Saurav',
      college: 'CEMK',
      branch: 'CSE',
      year: '1st Year',
      semester: 'Semester 1',
      group: 'Group A',
      targetSgpa: 8.5,
      dailyMinutes: 180,
      examDate,
    },
    moduleProgress,
    revision: {
      'mathematics-1': 75,
      physics: 55,
      beee: 60,
      english: 80,
      graphics: 72,
    },
    labs,
    nonTheory: { attendance: true, participation: true },
    skill: { moocPct: 63 },
    marks: {
      'mathematics-1': { internal: 26, ese: 58 },
      physics: { internal: 25, ese: 52 },
      beee: { internal: 27, ese: 61 },
      english: { internal: 25, ese: 52 },
      graphics: { internal: 26, ese: 55 },
    },
    streak: { current: 6, longest: 6, days: streakDays, todayDone: false },
    achievements: ['core-builder'],
    mission,
    studyMinutesToday: 0,
    studyLog,
  };
}

/** Fresh profile — used by the onboarding flow. */
export function createEmptyState(profile: StudentState['profile']): StudentState {
  const base = createSeedState();
  const emptyModules: StudentState['moduleProgress'] = {};
  for (const c of THEORY_COURSES) {
    emptyModules[c.id] = {};
    for (const m of c.modules ?? []) {
      emptyModules[c.id][m.id] = {
        progressPct: 0,
        concepts: Object.fromEntries((m.concepts ?? []).map((k) => [k.id, false])),
        questionsDone: 0,
        questionsTotal: m.questions,
        lastStudied: null,
        sessions: 0,
      };
    }
  }
  const emptyLabs: StudentState['labs'] = {};
  for (const l of LAB_COURSES) {
    emptyLabs[l.id] = {};
    for (const e of l.experiments ?? []) emptyLabs[l.id][e.id] = { status: 'not_started', record: 'pending', verified: false };
  }
  return {
    ...base,
    onboarded: true,
    profile,
    moduleProgress: emptyModules,
    revision: Object.fromEntries(THEORY_COURSES.map((c) => [c.id, 0])),
    labs: emptyLabs,
    nonTheory: { attendance: false, participation: false },
    skill: { moocPct: 0 },
    marks: {},
    streak: { current: 0, longest: 0, days: [], todayDone: false },
    achievements: ['core-builder'],
    mission: null,
    studyMinutesToday: 0,
    studyLog: [],
  };
}

export function seededCourseIds(): string[] {
  return THEORY_COURSES.map((c: CourseDef) => c.id);
}
