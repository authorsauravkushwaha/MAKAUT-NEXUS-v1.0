import { createSeedState } from '@/state/seed';
import { readiness, biggestGap, explainSemester, courseProgress, labSubStats, allComponentProgress } from '@/lib/derive';
import { generateMission } from '@/lib/mission';
import { generatePlan } from '@/lib/planner';
import { computeSGPA } from '@/lib/sgpa';
import { respond } from '@/ai/chatEngine';
import { THEORY_COURSES, LAB_COURSES } from '@/data';

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
