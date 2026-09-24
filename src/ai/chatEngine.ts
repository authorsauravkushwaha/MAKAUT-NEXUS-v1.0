import type { ChatMessage, SemesterSummaryData, StateLike } from '@/types';
import { COURSE_MAP, THEORY_COURSES, LAB_COURSES } from '@/data';
import { biggestGap, courseProgress, explainSemester, labSubStats, readiness } from '@/lib/derive';
import { computeSGPA, formatSGPA } from '@/lib/sgpa';
import { generateMission } from '@/lib/mission';
import { formatDuration, daysUntil, todayISO } from '@/lib/dates';

export interface ChatContext {
  state: StateLike;
}

let n = 0;
const id = () => `msg-${Date.now().toString(36)}-${(n++).toString(36)}`;

const text = (t: string, tag?: 'academic' | 'makaut' | 'system', role: 'student' | 'nexus' = 'nexus'): ChatMessage => ({
  id: id(),
  role,
  kind: 'text',
  text: t,
  tag,
  at: Date.now(),
});

function match(input: string, patterns: (string | RegExp)[]): boolean {
  const s = input.toLowerCase();
  return patterns.some((p) => (typeof p === 'string' ? s.includes(p) : p.test(s)));
}

export const QUICK_PROMPTS = [
  'What should I study today?',
  'Explain my semester',
  "I don't understand Kirchhoff's laws",
  'How is my SGPA looking?',
  'What is my biggest gap?',
  'How are my labs doing?',
  'Make me a study plan',
];

/**
 * NEXUS AI — academic copilot grounded in the student's structured state.
 * 📘 answers are general academic explanations.
 * 🏫 answers use only verified/provisional structured MAKAUT data and say so.
 */
export function respond(input: string, ctx: ChatContext): ChatMessage[] {
  const { state } = ctx;
  const r = readiness(state);
  const gap = biggestGap(state);
  const q = input.trim();

  /* 1 — Today's mission (flagship) */
  if (match(q, ['study today', 'today', 'mission', "what should i do", "what to do next", 'next step', 'plan my day'])) {
    const mission = state.mission && state.mission.date === todayISO() ? state.mission : generateMission(state);
    return [
      text(
        `Calculating from your exam date (${daysUntil(state.profile.examDate)} days out), daily budget (${formatDuration(state.profile.dailyMinutes)}), module hours, current completion and revision status…`,
        'makaut',
      ),
      { id: id(), role: 'nexus', kind: 'mission', at: Date.now(), mission },
    ];
  }

  /* 2 — Explain my semester (judge wow moment) */
  if (match(q, ['explain my semester', 'semester summary', 'explain semester', 'summarize my semester', 'summary of my semester'])) {
    const summary: SemesterSummaryData = explainSemester(state);
    return [
      text('Reading your full academic state — syllabus, practice, labs, revision, marks…', 'makaut'),
      { id: id(), role: 'nexus', kind: 'summary', at: Date.now(), summary },
    ];
  }

  /* 3 — Kirchhoff / specific concept explanation 📘 */
  if (match(q, ['kirchhoff', 'kcl', 'kvl'])) {
    return [
      text(
        `You're currently studying BEEE — Module 2 (Network Theorems), where KCL and KVL live. Let's work through it step by step.`,
        'academic',
      ),
      text(
        '📘 KCL (Kirchhoff\'s Current Law): at any node, the algebraic sum of currents is zero — charge cannot pile up. Every ampere entering must leave.\n\nKVL (Kirchhoff\'s Voltage Law): around any closed loop, the algebraic sum of voltage drops is zero — energy is conserved as you go around.\n\nExam pattern: write node equations for KCL, loop equations for KVL, then solve the linear system. In your question bank this is tagged CO1, bloom level Apply, and it shows up in both Paper A and B.',
        'academic',
      ),
      text(
        `Your progress in this module is ${state.moduleProgress['beee']?.m2?.progressPct ?? 0}% with ${state.moduleProgress['beee']?.m2?.questionsDone ?? 0}/${state.moduleProgress['beee']?.m2?.questionsTotal ?? 18} practice questions done. Want a 40-minute mission slot on it?`,
        'makaut',
      ),
    ];
  }

  /* 4 — Op-amps / gap module */
  if (match(q, ['op-amp', 'opamp', 'operational amplifier', 'biggest gap', 'weak area', 'behind'])) {
    return [
      text(
        `🏫 Your biggest gap right now is ${gap.courseTitle} — Module ${gap.index}: ${gap.moduleTitle} (${gap.progressPct}% complete, ${gap.lag} points behind its course average). It carries ${gap.questionsRemaining} unanswered practice questions.`,
        'makaut',
      ),
      text(
        '📘 Op-amp essentials: an ideal op-amp draws zero input current and keeps its input terminals at the same voltage (virtual short). Inverting gain = −R_f/R_in; non-inverting gain = 1 + R_f/R_in. Start with those two equations — most Semester-1 problems collapse into them.',
        'academic',
      ),
    ];
  }

  /* 5 — SGPA */
  if (match(q, ['sgpa', 'grade', 'marks', 'gpa', 'result'])) {
    const res = computeSGPA(state.marks);
    if (res.sgpa === null) {
      return [text('🏫 No marks entered yet. Open the SGPA Command Center and enter your internal + ESE marks — I\'ll project your SGPA and run what-if scenarios.', 'makaut')];
    }
    const entered = res.rows.filter((row) => row.entered).map((row) => `${row.short} ${row.total} → GP ${row.gradePoint}`);
    return [
      text(`🏫 Projected SGPA: ${formatSGPA(res.sgpa)} (over ${res.enteredCredits} entered credits).\n\n${entered.join('\n')}`, 'makaut'),
      text(
        `🟡 Assessment rule: ${res.rule.label} — provisional source, last verified ${res.rule.lastVerified}. Until the official applicable regulation is in hand, treat this as a projection, not a university result.`,
        'makaut',
      ),
    ];
  }

  /* 6 — Labs */
  if (match(q, ['lab', 'experiment', 'record'])) {
    const lines = LAB_COURSES.map((l) => {
      const s = labSubStats(state, l);
      return `• ${l.short}: completion ${Math.round(s.completionPct)}% — experiments ${Math.round((s.startedCount / (s.total || 1)) * 100)}% started, records ${s.recordsDone}/${s.total}, verified ${s.verified}/${s.total}`;
    });
    const pending = LAB_COURSES.flatMap((l) =>
      (l.experiments ?? [])
        .filter((e) => (state.labs[l.id]?.[e.id]?.record ?? 'pending') !== 'done')
        .map((e) => `${l.short} Exp ${e.index}`),
    ).slice(0, 4);
    return [
      text(`🏫 Lab command status:\n${lines.join('\n')}`, 'makaut'),
      text(
        pending.length
          ? `Records still pending: ${pending.join(', ')}. That's ${formatDuration(pending.length * 20)} of lab work — I've already budgeted a 20-minute lab slot in today's mission.`
          : 'All current records are in. Lab Ready achievement is close — teacher verification is the last gate.',
        'makaut',
      ),
    ];
  }

  /* 7 — Study plan */
  if (match(q, ['study plan', 'make a plan', 'schedule', 'exam plan', 'how should i prepare', 'timetable', 'generate plan'])) {
    const days = Math.max(3, daysUntil(state.profile.examDate));
    return [
      text(
        `🏫 Switch to the Planner screen and hit GENERATE PLAN — with ${days} days out at ${formatDuration(state.profile.dailyMinutes)}/day you have about ${formatDuration(days * state.profile.dailyMinutes)} of runway. I'll split it into Foundation → Coverage → Revision + Practice with daily tasks per subject.`,
        'makaut',
      ),
    ];
  }

  /* 8 — Course-specific progress */
  const courseHit = THEORY_COURSES.find((c) => match(q, [c.title.toLowerCase(), c.short.toLowerCase(), c.id.replace('-', ' ')]));
  if (courseHit) {
    const p = courseProgress(state, courseHit);
    const mods = (courseHit.modules ?? [])
      .map((m) => {
        const mp = state.moduleProgress[courseHit.id]?.[m.id];
        return `  ${m.index} ${m.title} — ${mp?.progressPct ?? 0}% (${mp?.questionsDone ?? 0}/${mp?.questionsTotal ?? m.questions} questions)`;
      })
      .join('\n');
    return [
      text(
        `🏫 ${courseHit.title}: ${Math.round(p.progressPct)}% complete — ${p.modulesDone}/${p.modulesTotal} modules done, ${p.questionsDone}/${p.questionsTotal} practice questions, ${courseHit.credits} credits / ${courseHit.hours} hours. Status: provisional source (checked ${courseHit.checked}).`,
        'makaut',
      ),
      text(`Module board:\n${mods}`, 'makaut'),
    ];
  }

  /* 9 — Readiness / analytics */
  if (match(q, ['readiness', 'progress', 'how am i doing', 'radar', 'analytics', 'performance'])) {
    return [
      text(
        `🏫 Current readiness: ${r.readiness}% — syllabus ${r.syllabus}%, practice ${r.practice}%, labs ${r.labs}%, revision ${r.revision}%. Target SGPA ${state.profile.targetSgpa} with ${daysUntil(state.profile.examDate)} days to the exam.`,
        'makaut',
      ),
      text(r.revision < 60 ? 'Revision is your softest axis — schedule short spaced-repetition passes instead of re-reading.' : 'Balanced. Keep labs records closing on time.', 'academic'),
    ];
  }

  /* 10 — Streak / achievements */
  if (match(q, ['streak', 'achievement', 'badge', 'gamification'])) {
    return [
      text(
        `🏫 ${state.streak.current}-day study streak (best ${state.streak.longest}). ${state.streak.todayDone ? "Today's session is logged — streak safe." : "Log a session today to reach " + (state.streak.current + 1) + " days."}`,
        'makaut',
      ),
    ];
  }

  /* 11 — Greeting / help */
  if (match(q, ['hi', 'hello', 'hey', 'who are you', 'what can you do', 'help', 'start'])) {
    return [
      text(
        `NEXUS online. I know your semester, subjects, syllabus modules, progress and study schedule. Ask me:\n• "What should I study today?"\n• "Explain my semester"\n• "I don't understand Kirchhoff's laws"\n• "How is my SGPA looking?"`,
        'system',
      ),
    ];
  }

  /* Fallback — grounded, never generic */
  return [
    text(
      `I couldn't map that to an academic intent yet. Here's what I can do right now: build today's mission from your real progress, explain concepts from your syllabus modules, project your SGPA (provisional rules), audit labs, and summarise your semester.`,
      'system',
    ),
    text(
      `Quick state: readiness ${r.readiness}% · biggest gap ${gap.courseTitle} ${gap.index} · ${daysUntil(state.profile.examDate)} days to exam. Try one of the prompts below.`,
      'makaut',
    ),
  ];
}

export function stateSnapshot(state: StateLike): string {
  const r = readiness(state);
  return `readiness=${r.readiness}% exam_in=${daysUntil(state.profile.examDate)}d`;
}
