import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, BookOpen, Check, ChevronRight, ExternalLink, FileText,
  HelpCircle, Lightbulb, Printer, Puzzle, Target, GraduationCap, Youtube,
} from 'lucide-react';
import { useNexus } from '@/state/context';
import { COURSE_MAP, THEORY_COURSES } from '@/data';
import { QUESTIONS } from '@/ai/questionBank';
import { PrintSheet } from '@/components/PrintSheet';
import { NotePaper, SlidesPaper, DppPaper, McqTestPaper } from '@/components/PrintPapers';
import {
  booksForSubject, dppQuestionSolved, getChapterLibrary, getSubjectLibrary,
  libraryProgress, librarySubjects, libraryTotals, noteIsRead, subjectLibraryStats,
} from '@/lib/library';
import { Button, GlassPanel, PageHeader, ProgressRing, SectionLabel, StatusPill, cn } from '@/components/ui';
import type { ChapterNote, Dpp } from '@/types';

/* ────────────────────────────── HUB ─────────────────────────────── */

function LibraryHub() {
  const { state } = useNexus();
  const totals = libraryTotals();
  const progress = libraryProgress(state);
  const subjects = librarySubjects();
  const [paperSubject, setPaperSubject] = useState<string | null>(null);
  const paperCourse = paperSubject ? COURSE_MAP[paperSubject] : undefined;
  const paperQs = paperSubject ? QUESTIONS.filter((q) => q.courseId === paperSubject) : [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Free for every student"
        title="The Student Library"
        sub="Chapter-wise notes & DPPs, top free books, video lectures, printable test papers and timed mock tests — every resource free, forever. Built so nobody pays for education."
        right={<ProgressRing value={progress.pct} size={110} stroke={8} sublabel="explored" color="#22d3ee" />}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Subjects', v: totals.subjects },
          { label: 'Chapters', v: totals.chapters },
          { label: 'Notes', v: totals.notes },
          { label: 'DPP problems', v: totals.dppProblems },
          { label: 'Free books', v: totals.books },
          { label: 'Bank questions', v: totals.bankQuestions },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <GlassPanel className="p-4">
              <div className="font-display text-2xl font-bold text-white">{s.v}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">{s.label}</div>
            </GlassPanel>
          </motion.div>
        ))}
      </div>

      {import.meta.env.DEV && (
        <a
          href="MAKAUT-NEXUS-current-files.zip"
          download
          className="flex items-center justify-between rounded-xl border border-violet-400/30 bg-violet-400/[0.06] px-5 py-3.5 transition-colors hover:border-violet-300/60"
        >
          <span className="font-display text-[14px] font-semibold text-violet-100">
            📦 Download offline pack — the complete source (81 files, zip)
          </span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-violet-300">Download ↓</span>
        </a>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Link to="/mock" className="lg:col-span-1 group">
          <GlassPanel className="h-full p-5 transition-all group-hover:border-cyan-400/40" glow="rgba(34,211,238,0.12)">
            <div className="flex items-center justify-between">
              <Target size={20} className="text-cyan-300" />
              <ArrowRight size={16} className="text-slate-500 transition-transform group-hover:translate-x-1" />
            </div>
            <div className="mt-3 font-display text-lg font-bold text-white">Mock Tests</div>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
              Timed exam simulations from the real question bank — Quick 10, full Semester Mock or per-subject sprints.
            </p>
            <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-cyan-400">Start a mock →</div>
          </GlassPanel>
        </Link>

        <div className="lg:col-span-2">
          <GlassPanel className="p-5">
            <div className="flex items-center justify-between">
              <SectionLabel>How NEXUS keeps it free</SectionLabel>
              <StatusPill status="provisional" />
            </div>
            <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-slate-400">
              <li className="flex gap-2"><Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-400" /> Notes & DPPs are written in-app — no paywalled PDFs, no pirated scans.</li>
              <li className="flex gap-2"><BookOpen size={14} className="mt-0.5 shrink-0 text-cyan-400" /> Books are genuinely free/legal: OpenStax (CC), Project Gutenberg, MIT OCW, NPTEL, Caltech.</li>
              <li className="flex gap-2"><Printer size={14} className="mt-0.5 shrink-0 text-sky-400" /> Print notes, slide decks, DPPs and MCQ test papers on A4 — give your test on hard copy.</li>
              <li className="flex gap-2"><GraduationCap size={14} className="mt-0.5 shrink-0 text-emerald-400" /> Mock tests run on the in-app question bank — attempt, review, improve offline too.</li>
            </ul>
          </GlassPanel>
        </div>
      </div>

      <div>
        <SectionLabel className="mb-3">Printable test papers — download, print & attempt on hard copy</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s, i) => {
            const course = COURSE_MAP[s.id];
            const qCount = QUESTIONS.filter((q) => q.courseId === s.id).length;
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }}>
                <GlassPanel className="h-full p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display font-bold text-white">{s.title}</div>
                      <div className="mt-0.5 text-[11.5px] text-slate-500">
                        {qCount} MCQs · A4 paper · answer key on last page
                      </div>
                    </div>
                    <Printer size={18} className="mt-0.5 shrink-0 text-sky-300" />
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-slate-400">
                    A ready exam paper with name/roll/date blanks — print it, attempt it, then self-mark with the key.
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider" style={{ color: s.color, background: `${s.color}18` }}>
                      {course?.short ?? s.id}
                    </span>
                    <Button size="sm" variant="primary" onClick={() => setPaperSubject(s.id)}>
                      <Printer size={14} /> Print / PDF
                    </Button>
                  </div>
                </GlassPanel>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel className="mb-3">Notes & DPP by subject — every chapter covered</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s, i) => {
            const stats = subjectLibraryStats(state, s.id);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                <Link to={`/library/${s.id}`} className="group block h-full">
                  <GlassPanel className="h-full p-5 transition-all group-hover:border-white/20">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                        <div>
                          <div className="font-display font-bold text-white">{s.title}</div>
                          <div className="text-[11px] text-slate-500">{stats.chapters} chapters · {stats.notes} notes · {stats.dppProblems} DPP</div>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1" />
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{stats.read}/{stats.notes} read · {stats.solved}/{stats.dppProblems} solved</span>
                      <span className="font-mono text-slate-300">{stats.progressPct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full transition-all" style={{ width: `${stats.progressPct}%`, background: s.color }} />
                    </div>
                  </GlassPanel>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <SectionLabel className="mb-3">Top free books & open resources</SectionLabel>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {booksForSubject().map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}>
              <GlassPanel className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-[15px] font-bold leading-snug text-white">{b.title}</div>
                    <div className="mt-0.5 text-[12px] text-slate-500">{b.author}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300">Free</span>
                </div>
                <p className="mt-3 flex-1 text-[12.5px] leading-relaxed text-slate-400">{b.why}</p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {b.subjects.map((sid) => (
                    <span key={sid} className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400">
                      {COURSE_MAP[sid]?.short ?? sid}
                    </span>
                  ))}
                  <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">{b.license}</span>
                </div>
                <a
                  href={b.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Open free resource <ExternalLink size={12} />
                </a>
              </GlassPanel>
            </motion.div>
          ))}
        </div>
      </div>

      {paperSubject && paperCourse && (
        <PrintSheet open onClose={() => setPaperSubject(null)} label={`${paperCourse.title} — printable test paper`}>
          <McqTestPaper courseTitle={paperCourse.title} courseShort={paperCourse.short} questions={paperQs} />
        </PrintSheet>
      )}
    </div>
  );
}

/* ─────────────────────── SUBJECT (chapters) ─────────────────────── */

function SubjectChapters({ subjectId }: { subjectId: string }) {
  const { state } = useNexus();
  const course = COURSE_MAP[subjectId];
  const lib = getSubjectLibrary(subjectId);
  const stats = subjectLibraryStats(state, subjectId);
  if (!course || !lib) return <UnknownLibrary id={subjectId} />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Library · subject"
        title={course.title}
        sub={`${stats.chapters} chapters of notes, DPP problems and questions — all free.`}
        right={<ProgressRing value={stats.progressPct} size={100} stroke={8} sublabel="done" color={course.color ?? '#22d3ee'} />}
        backTo="/library"
        backLabel="Library"
      />

      <div className="space-y-3">
        {lib.chapters.map((c, i) => {
          const mod = (course.modules ?? []).find((m) => m.id === c.moduleId);
          const chapterStats = (() => {
            let read = 0;
            let solved = 0;
            let total = 0;
            for (const n of c.notes) { total++; if (noteIsRead(state, n)) read++; }
            for (const d of c.dpps) for (const q of d.questions) { total++; if (dppQuestionSolved(state, q.id)) solved++; }
            return { read, solved, total, pct: total ? Math.round(((read + solved) / total) * 100) : 0 };
          })();
          const qCount = QUESTIONS.filter((q) => q.courseId === subjectId && q.moduleId === c.moduleId).length;
          return (
            <Link key={c.moduleId} to={`/library/${subjectId}/${c.moduleId}`} className="group block">
              <GlassPanel className="flex items-center gap-4 p-4 transition-all group-hover:border-white/20">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] font-display text-sm font-bold text-slate-300">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display font-semibold text-white">{mod?.title ?? c.moduleId}</div>
                  <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11.5px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><FileText size={11} /> {c.notes.length} note{c.notes.length > 1 ? 's' : ''}</span>
                    <span className="inline-flex items-center gap-1"><Puzzle size={11} /> {c.dpps.length} DPP · {c.dpps.reduce((a, d) => a + d.questions.length, 0)} problems</span>
                    <span className="inline-flex items-center gap-1"><HelpCircle size={11} /> {qCount} bank Q</span>
                  </div>
                </div>
                <div className="hidden w-28 shrink-0 sm:block">
                  <div className="text-right font-mono text-[11px] text-slate-400">{chapterStats.pct}%</div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${chapterStats.pct}%` }} />
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-600 transition-transform group-hover:translate-x-1" />
              </GlassPanel>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── CHAPTER DETAIL ───────────────────────── */

function ChapterDetail({ subjectId, moduleId }: { subjectId: string; moduleId: string }) {
  const { state, markNoteRead, markDppSolved } = useNexus();
  const course = COURSE_MAP[subjectId];
  const chapter = getChapterLibrary(subjectId, moduleId);
  const [tab, setTab] = useState<'notes' | 'dpp' | 'questions'>('notes');
  const [activeNote, setActiveNote] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [choices, setChoices] = useState<Record<string, number>>({});
  const [sheet, setSheet] = useState<null | { type: 'note' | 'slides' } | { type: 'dpp'; dpp: Dpp }>(null);
  const mod = (course?.modules ?? []).find((m) => m.id === moduleId);

  const bankQs = useMemo(
    () => QUESTIONS.filter((q) => q.courseId === subjectId && q.moduleId === moduleId),
    [subjectId, moduleId],
  );

  if (!course || !chapter) return <UnknownLibrary id={`${subjectId}/${moduleId}`} />;
  const note: ChapterNote | undefined = chapter.notes[activeNote];
  const printCtx = { courseTitle: course.title, courseShort: course.short, chapterTitle: mod?.title ?? moduleId };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${course.short} · chapter`}
        title={mod?.title ?? moduleId}
        sub={note ? `${chapter.notes.length} note(s) · ${chapter.dpps.length} DPP · ${bankQs.length} bank questions — all free.` : ''}
        backTo={`/library/${subjectId}`}
        backLabel={course.short}
      />

      <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
        {([
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'dpp', label: 'DPP', icon: Puzzle },
          { id: 'questions', label: 'Questions', icon: HelpCircle },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[12.5px] font-medium transition-all',
              tab === t.id ? 'bg-cyan-400/10 text-cyan-200 shadow-glow-cyan' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── NOTES ── */}
      {tab === 'notes' && note && (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {chapter.notes.map((n, i) => {
              const read = noteIsRead(state, n);
              return (
                <button
                  key={n.id}
                  onClick={() => setActiveNote(i)}
                  className={cn(
                    'w-full rounded-xl border px-3.5 py-3 text-left transition-all',
                    i === activeNote ? 'border-cyan-400/50 bg-cyan-400/[0.07]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12.5px] font-medium text-slate-200">{n.title}</span>
                    {read && <Check size={13} className="shrink-0 text-emerald-400" />}
                  </div>
                  <div className="mt-1 text-[10.5px] uppercase tracking-wider text-slate-500">{n.readMinutes} min · {n.kind}</div>
                </button>
              );
            })}
          </div>

          <GlassPanel className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-bold text-white">{note.title}</h2>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-500">{note.readMinutes} min read · free forever</div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setSheet({ type: 'note' })}>
                  <Printer size={14} /> Print note
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSheet({ type: 'slides' })}>
                  Slides ▸ PDF
                </Button>
                <Button
                  variant={noteIsRead(state, note) ? 'ghost' : 'primary'}
                  size="sm"
                  onClick={() => markNoteRead(note.id)}
                  disabled={noteIsRead(state, note)}
                >
                  {noteIsRead(state, note) ? <><Check size={14} /> Read</> : 'Mark as read'}
                </Button>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {note.sections.map((sec) => (
                <div key={sec.heading}>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    <h3 className="font-display text-[15px] font-semibold text-cyan-100">{sec.heading}</h3>
                  </div>
                  <ul className="mt-2 space-y-1.5 pl-4">
                    {sec.bullets.map((b, i) => (
                      <li key={i} className="text-[13.5px] leading-relaxed text-slate-300">
                        <span className="mr-2 text-slate-600">▸</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {!!note.resources?.length && (
              <div className="mt-6 border-t border-white/[0.06] pt-4">
                <SectionLabel>Free resources for this chapter</SectionLabel>
                <div className="mt-2 flex flex-wrap gap-2">
                  {note.resources.map((r) => (
                    <a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border bg-white/[0.03] px-3 py-1.5 text-[12px] transition-colors',
                        r.kind === 'video'
                          ? 'border-rose-400/30 text-rose-100 hover:border-rose-400/60 hover:text-rose-50'
                          : 'border-white/10 text-slate-300 hover:border-cyan-400/40 hover:text-cyan-200',
                      )}
                    >
                      {r.kind === 'video' && <Youtube size={13} className="shrink-0 text-rose-400" />}
                      {r.kind !== 'video' && r.kind === 'book' && <BookOpen size={13} className="shrink-0 text-cyan-400" />}
                      {r.title} <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </GlassPanel>
        </div>
      )}

      {/* ── DPP ── */}
      {tab === 'dpp' && (
        <div className="space-y-4">
          {chapter.dpps.map((dpp) => (
            <GlassPanel key={dpp.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-bold text-white">{dpp.title}</div>
                  <div className="text-[12px] text-slate-500">
                    Daily Practice Problems · {dpp.questions.filter((q) => dppQuestionSolved(state, q.id)).length}/{dpp.questions.length} solved
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setSheet({ type: 'dpp', dpp })}>
                    <Printer size={14} /> Print paper
                  </Button>
                  <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-violet-300">Free · in-app</span>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {dpp.questions.map((q, qi) => {
                  const open = !!revealed[q.id];
                  const done = dppQuestionSolved(state, q.id);
                  return (
                    <div key={q.id} className={cn('rounded-xl border p-4 transition-colors', done ? 'border-emerald-400/25 bg-emerald-400/[0.04]' : 'border-white/[0.07] bg-white/[0.02]')}>
                      <div className="flex items-start gap-3">
                        <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold', done ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/[0.06] text-slate-400')}>
                          {qi + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13.5px] leading-relaxed text-slate-200">{q.prompt}</div>

                          {!open ? (
                            <button
                              onClick={() => setRevealed((r) => ({ ...r, [q.id]: true }))}
                              className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[11.5px] text-slate-400 transition-colors hover:border-cyan-400/40 hover:text-cyan-200"
                            >
                              <Lightbulb size={12} /> Show answer & solution
                            </button>
                          ) : (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-3 space-y-2.5">
                              <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/[0.06] px-3 py-2">
                                <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-400">Answer</div>
                                <div className="mt-0.5 font-display text-[14px] font-semibold text-cyan-100">{q.answer}</div>
                              </div>
                              <ol className="space-y-1.5">
                                {q.solution.map((s, si) => (
                                  <li key={si} className="flex gap-2 text-[13px] leading-relaxed text-slate-300">
                                    <span className="font-mono text-[11px] text-slate-500">{si + 1}.</span> {s}
                                  </li>
                                ))}
                              </ol>
                              <Button
                                size="sm"
                                variant={done ? 'ghost' : 'primary'}
                                onClick={() => markDppSolved(q.id)}
                                disabled={done}
                              >
                                {done ? <><Check size={14} /> Solved</> : 'Mark solved ✓'}
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* ── QUESTIONS ── */}
      {tab === 'questions' && (
        <div className="space-y-4">
          {bankQs.length === 0 && (
            <GlassPanel className="p-6 text-center text-[13px] text-slate-500">
              No bank questions tagged to this chapter yet — try the <Link className="text-cyan-300 underline" to="/practice">Practice Arena</Link> for full-subject sets.
            </GlassPanel>
          )}
          {bankQs.map((q) => {
            const chosen = choices[q.id];
            const answered = chosen !== undefined;
            return (
              <GlassPanel key={q.id} className="p-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300">{q.co}</span>
                  <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">{q.bloom}</span>
                  <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400">Paper {q.paper}</span>
                </div>
                <div className="mt-2.5 text-[14px] leading-relaxed text-slate-100">{q.text}</div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {q.options.map((o, oi) => {
                    const isCorrect = oi === q.answer;
                    const isChosen = chosen === oi;
                    return (
                      <button
                        key={oi}
                        disabled={answered}
                        onClick={() => setChoices((c) => ({ ...c, [q.id]: oi }))}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-left text-[13px] transition-all',
                          answered && isCorrect && 'border-emerald-400/50 bg-emerald-400/10 text-emerald-200',
                          answered && isChosen && !isCorrect && 'border-rose-400/50 bg-rose-400/10 text-rose-200',
                          !answered && 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-cyan-400/40 hover:text-cyan-100',
                        )}
                      >
                        <span className="mr-2 font-mono text-[11px] text-slate-500">{'ABCD'[oi]}</span>{o}
                      </button>
                    );
                  })}
                </div>
                {answered && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 text-[13px] leading-relaxed text-slate-300">
                    <span className="font-semibold text-cyan-300">Explanation: </span>{q.explanation}
                  </motion.div>
                )}
              </GlassPanel>
            );
          })}
        </div>
      )}

      {/* ── Print sheets (A4 / PDF) ── */}
      {sheet?.type === 'note' && note && (
        <PrintSheet open onClose={() => setSheet(null)} label={`${note.title} — chapter notes`}>
          <NotePaper ctx={printCtx} note={note} />
        </PrintSheet>
      )}
      {sheet?.type === 'slides' && note && (
        <PrintSheet open onClose={() => setSheet(null)} label={`${printCtx.chapterTitle} — slide deck`}>
          <SlidesPaper ctx={printCtx} note={note} />
        </PrintSheet>
      )}
      {sheet?.type === 'dpp' && (
        <PrintSheet open onClose={() => setSheet(null)} label={`${sheet.dpp.title} — DPP paper`}>
          <DppPaper ctx={printCtx} dpp={sheet.dpp} />
        </PrintSheet>
      )}
    </div>
  );
}

function UnknownLibrary({ id }: { id: string }) {
  return (
    <div className="space-y-4">
      <PageHeader eyebrow="Library" title="Not found" sub={`No library content for "${id}".`} backTo="/library" backLabel="Library" />
      <GlassPanel className="p-6 text-center text-[13px] text-slate-500">
        Pick a subject from the <Link className="text-cyan-300 underline" to="/library">library hub</Link>.
      </GlassPanel>
    </div>
  );
}

/* ───────────────────────────── PAGE ─────────────────────────────── */

export function LibraryPage() {
  const { subjectId, moduleId } = useParams();
  if (moduleId) return <ChapterDetail subjectId={subjectId!} moduleId={moduleId} />;
  if (subjectId) return <SubjectChapters subjectId={subjectId} />;
  return <LibraryHub />;
}
