import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Timer, ChevronRight, CheckCircle2, XCircle, RotateCcw, Sparkles, Tag } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, PageHeader, SectionLabel, Button, StatusPill, cn } from '@/components/ui';
import { subjectsWithQuestions, QUESTIONS, type BankQuestion, type Difficulty } from '@/ai/questionBank';
import { COURSE_MAP } from '@/data';

type Phase = 'setup' | 'exam' | 'result';

const DIFFICULTIES: { id: Difficulty | 'all'; label: string }[] = [
  { id: 'all', label: 'Mixed' },
  { id: 'Remember', label: 'Remember' },
  { id: 'Understand', label: 'Understand' },
  { id: 'Apply', label: 'Apply' },
  { id: 'Analyze', label: 'Analyze' },
];

interface Answer {
  q: BankQuestion;
  chosen: number | null;
  correct: boolean;
}

export function PracticePage() {
  const { state, addSession } = useNexus();
  const subjectList = useMemo(() => subjectsWithQuestions(), []);

  const [subjectId, setSubjectId] = useState(subjectList[0]?.courseId ?? 'beee');
  const [moduleId, setModuleId] = useState('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [count, setCount] = useState(10);

  const [phase, setPhase] = useState<Phase>('setup');
  const [queue, setQueue] = useState<BankQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showExplain, setShowExplain] = useState(false);
  const startedRef = useRef(0);

  const modules = subjectList.find((s) => s.courseId === subjectId)?.modules ?? [];

  const pool = useMemo(() => {
    return QUESTIONS.filter(
      (q) =>
        q.courseId === subjectId &&
        (moduleId === 'all' || q.moduleId === moduleId) &&
        (difficulty === 'all' || q.difficulty === difficulty),
    );
  }, [subjectId, moduleId, difficulty]);

  useEffect(() => {
    if (phase !== 'exam' || showExplain) return;
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          submitAnswer(null, true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, idx, showExplain]);

  const generate = () => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, Math.min(count, pool.length));
    if (!shuffled.length) return;
    setQueue(shuffled);
    setIdx(0);
    setAnswers([]);
    setChosen(null);
    setShowExplain(false);
    setTimeLeft(240);
    startedRef.current = Date.now();
    setPhase('exam');
  };

  const submitAnswer = (choice: number | null, timedOut = false) => {
    const q = queue[idx];
    if (!q || showExplain) return;
    const correct = choice === q.answer;
    const nextAnswers = [...answers, { q, chosen: timedOut && choice === null ? null : choice, correct }];
    setAnswers(nextAnswers);
    setChosen(timedOut && choice === null ? null : choice);
    setShowExplain(true);
  };

  const nextQuestion = () => {
    setShowExplain(false);
    setChosen(null);
    if (idx + 1 >= queue.length) {
      // finish
      const minutes = Math.max(2, Math.round((Date.now() - startedRef.current) / 60000));
      addSession({ courseId: subjectId, minutes, kind: 'practice' });
      setPhase('result');
      return;
    }
    setIdx((i) => i + 1);
    setTimeLeft(240);
  };

  const restart = () => {
    setPhase('setup');
    setAnswers([]);
    setShowExplain(false);
  };

  const score = answers.filter((a) => a.correct).length;
  const q = queue[idx];

  return (
    <div>
      <PageHeader
        eyebrow="Practice arena"
        title="QUESTION BANK"
        sub="Questions tagged internally with course, module, course outcome, Bloom level and paper group — then run them in exam mode."
        right={<StatusPill status="provisional" />}
      />

      {/* ── SETUP ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
              <GlassPanel className="p-6">
                <SectionLabel className="mb-4 flex items-center gap-1.5"><Target size={12} /> Configure set</SectionLabel>

                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Subject</div>
                    <div className="flex flex-wrap gap-2">
                      {subjectList.map((s) => (
                        <button
                          key={s.courseId}
                          onClick={() => {
                            setSubjectId(s.courseId);
                            setModuleId('all');
                          }}
                          className={cn(
                            'rounded-xl border px-3.5 py-2 text-[12.5px] transition-all',
                            subjectId === s.courseId
                              ? 'border-cyan-400/60 bg-cyan-400/12 text-cyan-200'
                              : 'border-white/[0.08] text-slate-400 hover:border-white/25',
                          )}
                        >
                          {COURSE_MAP[s.courseId]?.short ?? s.courseId}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Module</div>
                    <select
                      value={moduleId}
                      onChange={(e) => setModuleId(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#0b1224] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-cyan-400/60"
                    >
                      <option value="all">All modules</option>
                      {modules.map((m) => (
                        <option key={m.moduleId} value={m.moduleId}>
                          {m.title} ({m.count})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">Difficulty / Bloom</div>
                    <div className="flex flex-wrap gap-2">
                      {DIFFICULTIES.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDifficulty(d.id)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-[11.5px] transition-all',
                            difficulty === d.id
                              ? 'border-violet-400/60 bg-violet-400/12 text-violet-200'
                              : 'border-white/[0.08] text-slate-500 hover:border-white/25',
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-slate-500">
                      <span>Questions</span>
                      <span className="font-mono text-cyan-300">{count}</span>
                    </div>
                    <input type="range" min={3} max={15} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-cyan-400" />
                    <div className="mt-1 text-[10px] text-slate-600">{pool.length} available in this filter</div>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <Button size="lg" onClick={generate} disabled={pool.length === 0}>
                    <Sparkles size={16} /> Generate
                  </Button>
                  <span className="text-[12px] text-slate-500">→ launches EXAM MODE with a 240s per-question timer.</span>
                </div>
              </GlassPanel>

              <GlassPanel className="p-5">
                <SectionLabel className="mb-3">Tag metadata</SectionLabel>
                <div className="space-y-2.5 text-[12px]">
                  {[
                    ['Course', COURSE_MAP[subjectId]?.title ?? subjectId],
                    ['Modules', String(modules.length)],
                    ['Pool size', String(QUESTIONS.length)],
                    ['Bloom tags', 'Remember → Create'],
                    ['Paper groups', 'A / B marked per item'],
                    ['CO mapping', 'CO1–CO4 per module'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
                      <span className="text-slate-500">{k}</span>
                      <span className="text-slate-200">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 text-[11px] leading-relaxed text-slate-500">
                  <Tag size={12} className="mt-0.5 shrink-0 text-cyan-400" />
                  Generation is deterministic over the tagged bank — the AI question pipeline in the roadmap replaces this
                  once an LLM key is provisioned.
                </div>
              </GlassPanel>
            </div>
          </motion.div>
        )}

        {/* ── EXAM MODE ───────────────────────────────────────────── */}
        {phase === 'exam' && q && (
          <motion.div key="exam" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <GlassPanel className="mx-auto max-w-3xl overflow-hidden p-7" glow="#8b5cf6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-violet-300">
                    Exam mode
                  </span>
                  <span className="text-[13px] text-slate-400">
                    Question <b className="text-white">{idx + 1}</b> / {queue.length}
                  </span>
                </div>
                <div className={cn('flex items-center gap-2 rounded-xl border px-3.5 py-1.5', timeLeft <= 20 ? 'border-rose-400/50 bg-rose-500/10' : 'border-white/10 bg-white/[0.04]')}>
                  <Timer size={14} className={timeLeft <= 20 ? 'text-rose-400 animate-blink' : 'text-cyan-400'} />
                  <span className={cn('font-mono text-sm font-bold', timeLeft <= 20 ? 'text-rose-300' : 'text-white')}>
                    {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* progress segments */}
              <div className="mt-4 flex gap-1">
                {queue.map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full',
                      i < answers.length ? (answers[i].correct ? 'bg-emerald-400' : 'bg-rose-400') : i === idx ? 'bg-cyan-400' : 'bg-white/10',
                    )}
                  />
                ))}
              </div>

              {/* tags */}
              <div className="mt-5 flex flex-wrap gap-1.5">
                {Array.from(
                  new Set(
                    [COURSE_MAP[q.courseId]?.short, q.moduleTitle, q.co, q.bloom, `Paper ${q.paper}`, q.difficulty].filter(
                      Boolean,
                    ),
                  ),
                ).map((t) => (
                  <span key={t} className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[10px] text-slate-400">
                    {t}
                  </span>
                ))}
              </div>

              <h2 className="mt-4 font-display text-lg font-semibold leading-relaxed text-white">{q.text}</h2>

              <div className="mt-5 space-y-2.5">
                {q.options.map((opt, i) => {
                  const revealed = showExplain;
                  const isAnswer = i === q.answer;
                  const isChosen = chosen === i;
                  return (
                    <button
                      key={i}
                      data-testid="quiz-option"
                      disabled={revealed}
                      onClick={() => {
                        setChosen(i);
                        submitAnswer(i);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                        revealed && isAnswer && 'border-emerald-400/60 bg-emerald-400/10',
                        revealed && isChosen && !isAnswer && 'border-rose-400/60 bg-rose-500/10',
                        !revealed && 'border-white/[0.08] bg-white/[0.03] hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]',
                        revealed && !isAnswer && !isChosen && 'border-white/[0.05] opacity-50',
                      )}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/10 font-mono text-[12px] text-slate-400">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1 text-[14px] text-slate-200">{opt}</span>
                      {revealed && isAnswer && <CheckCircle2 size={17} className="text-emerald-400" />}
                      {revealed && isChosen && !isAnswer && <XCircle size={17} className="text-rose-400" />}
                    </button>
                  );
                })}
              </div>

              {showExplain && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                  <div className="rounded-xl border border-cyan-400/25 bg-cyan-400/[0.06] p-4">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em]">
                      <span className="text-cyan-300">Explain solution</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">Concept tested: {q.moduleTitle}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-violet-300">Skill: {q.bloom}</span>
                    </div>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-slate-200">{q.explanation}</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button onClick={nextQuestion}>
                      {idx + 1 >= queue.length ? 'Finish & log session' : 'Next question'} <ChevronRight size={15} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </GlassPanel>
          </motion.div>
        )}

        {/* ── RESULT ──────────────────────────────────────────────── */}
        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <GlassPanel className="mx-auto max-w-3xl p-8 text-center">
              <SectionLabel>Session report</SectionLabel>
              <div className="relative mx-auto my-5 h-32 w-32">
                <svg className="-rotate-90" width="128" height="128">
                  <circle cx="64" cy="64" r="56" stroke="rgba(148,163,184,0.15)" strokeWidth="9" fill="none" />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#34d399"
                    strokeWidth="9"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 56}
                    strokeDashoffset={2 * Math.PI * 56 * (1 - score / Math.max(1, answers.length))}
                    style={{ filter: 'drop-shadow(0 0 8px #34d399)' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-display text-3xl font-bold text-white">
                  {score}/{answers.length}
                </div>
              </div>
              <div className="font-display text-lg font-bold text-white">
                {score / Math.max(1, answers.length) >= 0.8 ? 'Strong set — keep the tempo.' : score / Math.max(1, answers.length) >= 0.5 ? 'Solid base — review the misses.' : 'Gap detected — revisit the module.'}
              </div>
              <p className="mx-auto mt-2 max-w-md text-[13px] text-slate-400">
                Practice minutes credited to {COURSE_MAP[subjectId]?.title} progress and today's streak.
              </p>

              <div className="mx-auto mt-5 max-w-md space-y-2 text-left">
                {answers.map((a, i) => (
                  <div key={i} className={cn('flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-[12px]', a.correct ? 'border-emerald-400/25 bg-emerald-400/[0.06]' : 'border-rose-400/25 bg-rose-500/[0.06]')}>
                    {a.correct ? <CheckCircle2 size={14} className="shrink-0 text-emerald-400" /> : <XCircle size={14} className="shrink-0 text-rose-400" />}
                    <span className="truncate text-slate-300">{a.q.text}</span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-500">{a.q.bloom}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={generate}>
                  <RotateCcw size={15} /> New set
                </Button>
                <Button variant="ghost" onClick={restart}>
                  Change filters
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
