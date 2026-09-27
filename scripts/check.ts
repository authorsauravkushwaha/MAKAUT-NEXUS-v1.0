import { createSeedState, createEmptyState } from '@/state/seed';
import { readiness, biggestGap, explainSemester, courseProgress, labSubStats, allComponentProgress } from '@/lib/derive';
import { generateMission } from '@/lib/mission';
import { generatePlan } from '@/lib/planner';
import { computeSGPA } from '@/lib/sgpa';
import { respond } from '@/ai/chatEngine';
import { THEORY_COURSES, LAB_COURSES, LIBRARY, FREE_BOOKS } from '@/data';
import { addDays, computeStreak } from '@/lib/dates';
import { libraryTotals, libraryProgress, subjectLibraryStats } from '@/lib/library';
import { MOCK_PRESETS, buildMock, scoreMock } from '@/lib/mock';

function assertEq(name: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  console.log(ok ? `  ✓ ${name}` : `  ✗ ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  if (!ok) process.exitCode = 1;
}

const s = createSeedState();
const r = readiness(s);
console.log('— Readiness —');
console.log(r);

console.log('\n— Course progress —');
for (const c of [...THEORY_COURSES]) {
  console.log(`  ${c.short}: ${courseProgress(s, c).progressPct.toFixed(1)}%  q=${courseProgress(s, c).questionsDone}/${courseProgress(s, c).questionsTotal}`);
}
for (const l of LAB_COURSES) {
  const st = labSubStats(s, l);
  console.log(`  ${l.short}: completion=${st.completionPct.toFixed(1)}% exp=${st.experimentsPct.toFixed(1)}% rec=${st.recordsPct.toFixed(1)}%`);
}

console.log('\n— Biggest gap —');
console.log(biggestGap(s));

console.log('\n— Mission —');
const m = generateMission(s);
console.log('total', m.totalMinutes, 'min:', m.items.map((i) => `${i.label}(${i.kind}:${i.minutes}m:${i.sublabel})`).join(' | '));

console.log('\n— SGPA —');
const sg = computeSGPA(s.marks);
console.log('sgpa', sg.sgpa?.toFixed(2), 'entered credits', sg.enteredCredits, sg.rows.filter((x) => x.entered).map((x) => `${x.short}=${x.total}->${x.gradePoint}`));

console.log('\n— Explain semester —');
console.log(explainSemester(s));

console.log('\n— Plan (21d/3h) —');
const p = generatePlan(s, { days: 21, dailyMinutes: 180, targetSgpa: 8.5 });
console.log('weeks:', p.weeks.map((w) => `${w.label} ${w.theme}: ${w.days.length} days`).join(' | '));
console.log('day1:', JSON.stringify(p.weeks[0].days[0]?.tasks));

console.log('\n— Chat intents —');
for (const q of ['What should I study today?', 'Explain my semester', "I don't understand Kirchhoff's laws", 'How is my SGPA looking?']) {
  const out = respond(q, { state: s });
  console.log(`  [${q}] → kinds: ${out.map((o) => o.kind + (o.kind === 'text' ? `(${o.tag})` : '')).join(', ')}`);
}

console.log('\n— Streak (Mon–Sat, Sunday optional) —');
{
  const base = '2026-09-21'; // Monday
  const week: string[] = [];
  for (let i = 0; i <= 5; i++) week.push(addDays(base, i)); // Mon..Sat
  // Sunday skipped, continues into next week
  assertEq('unlogged Sunday never breaks the streak', computeStreak([...week, addDays(base, 7), addDays(base, 8)], addDays(base, 8)), 8);
  // missing Saturday breaks it
  const noSat = week.filter((d) => d !== addDays(base, 5));
  assertEq('missing Saturday breaks the streak', computeStreak([...noSat, addDays(base, 7), addDays(base, 8)], addDays(base, 8)), 2);
  // seed recompute matches the demo headline
  assertEq('seed streak recomputes to 6', computeStreak(s.streak.days, addDays(s.streak.days[s.streak.days.length - 1], 0)), 6);
}

console.log('\n— Free student library —');
{
  const totals = libraryTotals();
  assertEq('library covers all 5 theory subjects', totals.subjects, 5);
  assertEq('library covers all 22 modules', totals.chapters, 22);
  assertEq('every module has notes', totals.notes, 22);
  assertEq('every module has a DPP', LIBRARY.flatMap((l) => l.chapters).filter((c) => c.dpps.length > 0).length, 22);
  if (totals.dppProblems < 60) {
    console.log(`  ✗ DPP problem bank too thin: ${totals.dppProblems}`);
    process.exitCode = 1;
  } else console.log(`  ✓ ${totals.dppProblems} DPP problems`);
  if (totals.books < 18) {
    console.log(`  ✗ free-book list too thin: ${totals.books}`);
    process.exitCode = 1;
  } else console.log(`  ✓ ${totals.books} free books`);

  // Chapter coverage matches the syllabus modules exactly
  const courseIds = THEORY_COURSES.map((c) => c.id);
  const libIds = LIBRARY.map((l) => l.subjectId);
  assertEq('library subject ids match syllabus', [...libIds].sort(), [...courseIds].sort());
  for (const c of THEORY_COURSES) {
    const lib = LIBRARY.find((l) => l.subjectId === c.id);
    const modIds = (c.modules ?? []).map((m) => m.id).sort();
    const libMods = (lib?.chapters.map((ch) => ch.moduleId) ?? []).sort();
    assertEq(`${c.short} chapter set matches modules`, libMods, modIds);
  }

  // Every DPP question well-formed: answer + ≥2 solution steps + unique id
  const seen = new Set<string>();
  let malformed = 0;
  for (const lib of LIBRARY)
    for (const ch of lib.chapters)
      for (const d of ch.dpps)
        for (const q of d.questions) {
          if (seen.has(q.id) || !q.answer || q.solution.length < 2) malformed++;
          seen.add(q.id);
        }
  assertEq('all DPP questions well-formed & unique', malformed, 0);

  // Books: free sources only — every entry carries a license + working url scheme
  assertEq('every book has license + https url', FREE_BOOKS.filter((b) => !b.license || !b.url.startsWith('https://')).length, 0);

  // Progress helpers
  assertEq('library progress on fresh seed', libraryProgress(createEmptyState()).pct, 0);
  const sp = subjectLibraryStats(s, 'physics');
  assertEq('physics library stats enumerate problems', sp.dppProblems, 16);

  // Mock engine
  const preset = MOCK_PRESETS[1]; // Semester Mock, negative marking
  const qs = buildMock(preset, 42);
  assertEq('semester mock pulls 25 unique questions', qs.length, 25);
  assertEq('same seed builds same mock', buildMock(preset, 42).map((q) => q.id), qs.map((q) => q.id));
  const perfect: Record<string, number> = {};
  qs.forEach((q) => (perfect[q.id] = q.answer));
  const pr = scoreMock(qs, perfect, true);
  assertEq('perfect answers → full marks', pr.marks, 25);
  assertEq('perfect accuracy', pr.accuracyPct, 100);
  const allWrong: Record<string, number> = {};
  qs.forEach((q) => (allWrong[q.id] = (q.answer + 1) % 4));
  assertEq('all wrong with negative marking', scoreMock(qs, allWrong, true).marks, -6.25);
  const subjPreset = MOCK_PRESETS[2]; // Math-I
  const mq = buildMock(subjPreset, 7);
  assertEq('subject mock stays in subject', mq.every((q) => q.courseId === 'mathematics-1'), true);
}

console.log('\n— Chat: library & mock intents —');
{
  const lib = respond('Where can I get free notes and DPPs?', { state: s });
  assertEq('library intent → two tagged texts', lib.length === 2 && lib.every((m) => m.kind === 'text' && m.tag === 'makaut'), true);
  assertEq('library intent cites chapter count', (lib[0].text ?? '').includes('22 chapters'), true);
  const mock = respond('Do you have mock tests?', { state: s });
  assertEq('mock query lands in library branch', (mock[0].text ?? '').includes('/mock'), true);
  const book = respond('Which free textbooks do you recommend?', { state: s });
  assertEq('book query answers with free sources', (book[1]?.text ?? '').includes('OpenStax'), true);
  // concept tutoring still wins over library patterns for Kirchhoff
  const k = respond('explain kirchhoff current law', { state: s });
  assertEq('concept intent unaffected by library keywords', (k[0]?.text ?? '').includes('KCL'), true);
}
