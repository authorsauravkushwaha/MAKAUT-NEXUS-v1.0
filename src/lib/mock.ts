import { QUESTIONS, type BankQuestion } from '@/ai/questionBank';
import { COURSE_MAP } from '@/data';

export interface MockPreset {
  id: string;
  title: string;
  subtitle: string;
  scope: 'mixed' | 'subject';
  subjectId?: string;
  count: number;
  minutes: number;
  negative: boolean;
}

/** Deterministic shuffle so a given seed always yields the same attempt. */
function shuffled<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const MOCK_PRESETS: MockPreset[] = [
  { id: 'quick', title: 'Quick 10', subtitle: '10 questions · 15 min · mixed subjects', scope: 'mixed', count: 10, minutes: 15, negative: false },
  { id: 'full', title: 'Semester Mock', subtitle: '25 questions · 45 min · full syllabus sweep', scope: 'mixed', count: 25, minutes: 45, negative: true },
  { id: 'subj-mathematics-1', title: 'Math-I Mock', subtitle: `${QUESTIONS.filter((q) => q.courseId === 'mathematics-1').length} questions · timed`, scope: 'subject', subjectId: 'mathematics-1', count: 99, minutes: 20, negative: true },
  { id: 'subj-physics', title: 'Physics Mock', subtitle: `${QUESTIONS.filter((q) => q.courseId === 'physics').length} questions · timed`, scope: 'subject', subjectId: 'physics', count: 99, minutes: 20, negative: true },
  { id: 'subj-beee', title: 'BEEE Mock', subtitle: `${QUESTIONS.filter((q) => q.courseId === 'beee').length} questions · timed`, scope: 'subject', subjectId: 'beee', count: 99, minutes: 25, negative: true },
  { id: 'subj-english', title: 'English Mock', subtitle: `${QUESTIONS.filter((q) => q.courseId === 'english').length} questions · timed`, scope: 'subject', subjectId: 'english', count: 99, minutes: 12, negative: false },
  { id: 'subj-graphics', title: 'Graphics Mock', subtitle: `${QUESTIONS.filter((q) => q.courseId === 'graphics').length} questions · timed`, scope: 'subject', subjectId: 'graphics', count: 99, minutes: 12, negative: false },
];

export function buildMock(preset: MockPreset, seed: number): BankQuestion[] {
  const pool =
    preset.scope === 'subject'
      ? QUESTIONS.filter((q) => q.courseId === preset.subjectId)
      : QUESTIONS;
  return shuffled(pool, seed).slice(0, Math.min(preset.count, pool.length));
}

export interface MockAnswer {
  qid: string;
  choice: number | null;
}

export interface MockResult {
  correct: number;
  wrong: number;
  skipped: number;
  marks: number;
  maxMarks: number;
  accuracyPct: number;
  bySubject: { courseId: string; short: string; correct: number; total: number }[];
}

export function scoreMock(questions: BankQuestion[], answers: Record<string, number | null>, negative: boolean): MockResult {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;
  const per: Record<string, { correct: number; total: number }> = {};
  for (const q of questions) {
    per[q.courseId] ??= { correct: 0, total: 0 };
    per[q.courseId].total++;
    const a = answers[q.id];
    if (a === undefined || a === null) {
      skipped++;
    } else if (a === q.answer) {
      correct++;
      per[q.courseId].correct++;
    } else {
      wrong++;
    }
  }
  const marks = correct - (negative ? wrong * 0.25 : 0);
  const attempted = correct + wrong;
  return {
    correct,
    wrong,
    skipped,
    marks: Math.round(marks * 100) / 100,
    maxMarks: questions.length,
    accuracyPct: attempted ? Math.round((correct / attempted) * 100) : 0,
    bySubject: Object.entries(per).map(([courseId, v]) => ({
      courseId,
      short: COURSE_MAP[courseId]?.short ?? courseId,
      correct: v.correct,
      total: v.total,
    })),
  };
}
