import type { MarksEntry, StudentState, VerificationStatus } from '@/types';
import { THEORY_COURSES } from '@/data';

/**
 * PROVISIONAL assessment rule (🟡).
 * The applicable official regulation circular is not yet in hand (SRC-003),
 * so NEXUS never hard-codes uncertain university rules as official — see the
 * safety banner on the SGPA screen.
 */
export const SGPA_RULE = {
  label: 'Internal (30) + ESE (70) → 100-point grade table',
  status: 'provisional' as VerificationStatus,
  lastVerified: '25 Sep 2026',
  sourceRef: 'SRC-003',
  /** [minMarks, gradePoint] — harsher provisional scale, close to reported secondary sources */
  table: [
    [90, 10],
    [85, 9],
    [80, 8.5],
    [75, 8],
    [70, 7.5],
    [65, 7],
    [60, 6.5],
    [55, 6],
    [50, 5.5],
    [45, 5],
    [40, 4.5],
    [0, 0],
  ] as [number, number][],
};

export function gradePoint(totalMarks: number): number {
  for (const [min, gp] of SGPA_RULE.table) {
    if (totalMarks >= min) return gp;
  }
  return 0;
}

export interface SGPACourseRow {
  courseId: string;
  title: string;
  short: string;
  credits: number;
  internal: number | '';
  ese: number | '';
  total: number | null;
  gradePoint: number | null;
  entered: boolean;
}

export interface SGPAResult {
  sgpa: number | null;
  rows: SGPACourseRow[];
  enteredCredits: number;
  allEntered: boolean;
  rule: typeof SGPA_RULE;
}

export function computeSGPA(marks: Record<string, MarksEntry>): SGPAResult {
  const rows: SGPACourseRow[] = [];
  let weighted = 0;
  let credits = 0;
  let enteredCount = 0;

  for (const c of THEORY_COURSES) {
    const m = marks[c.id];
    const internal = m?.internal ?? '';
    const ese = m?.ese ?? '';
    const entered = internal !== '' && ese !== '';
    let total: number | null = null;
    let gp: number | null = null;
    if (entered) {
      total = Number(internal) + Number(ese);
      gp = gradePoint(total);
      weighted += gp * c.credits;
      credits += c.credits;
      enteredCount++;
    }
    rows.push({
      courseId: c.id,
      title: c.title,
      short: c.short,
      credits: c.credits,
      internal,
      ese,
      total,
      gradePoint: gp,
      entered,
    });
  }

  return {
    sgpa: credits > 0 ? weighted / credits : null,
    rows,
    enteredCredits: credits,
    allEntered: enteredCount === THEORY_COURSES.length,
    rule: SGPA_RULE,
  };
}

export function formatSGPA(v: number | null): string {
  return v === null ? '—' : v.toFixed(2);
}

export function marksOf(state: StudentState): Record<string, MarksEntry> {
  return state.marks;
}
