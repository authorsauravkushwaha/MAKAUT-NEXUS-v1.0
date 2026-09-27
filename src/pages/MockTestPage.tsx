import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, ArrowRight, Check, ChevronLeft, ChevronRight, Clock, RotateCcw,
  Target, Trophy, X,
} from 'lucide-react';
import { useNexus } from '@/state/context';
import { COURSE_MAP } from '@/data';
import { buildMock, MOCK_PRESETS, scoreMock, type MockPreset, type MockResult } from '@/lib/mock';
import { Button, GlassPanel, PageHeader, ProgressRing, SectionLabel, cn } from '@/components/ui';
import type { BankQuestion } from '@/ai/questionBank';

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

type Phase = 'setup' | 'run' | 'result';

export function MockTestPage() {
  const { logStudy } = useNexus();
  const [phase, setPhase] = useState<Phase>('setup');
  const [preset, setPreset] = useState<MockPreset | null>(null);
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [seed, setSeed] = useState(0);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [result, setResult] = useState<MockResult | null>(null);
  const [left, setLeft] = useState(0);
  const deadline = useRef(0);
  const submittedRef = useRef(false);

  /* Countdown */
  useEffect(() => {
    if (phase !== 'run') return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0 && !submittedRef.current) submit();
    };
    tick();
    const t = window.setInterval(tick, 500);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function start(p: MockPreset) {
    const s = Date.now() % 100000;
    const qs = buildMock(p, s);
    setPreset(p);
    setSeed(s);
    setQuestions(qs);
    setAnswers({});
    setIdx(0);
    setLeft(p.minutes * 60);
    deadline.current = Date.now() + p.minutes * 60 * 1000;
    submittedRef.current = false;
    setResult(null);
    setPhase('run');
  }

  function submit() {
    if (!preset) return;
    submittedRef.current = true;
    const r = scoreMock(questions, answers, preset.negative);
    setResult(r);
    setPhase('result');
    logStudy(Math.max(5, Math.round((preset.minutes * 60 - left) / 60)));
  }

  const answered = useMemo(() => questions.filter((q) => answers[q.id] !== undefined).length, [questions, answers]);
  const current = questions[idx];

  /* ───────────────────── SETUP ───────────────────── */
  if (phase === 'setup') {
    return (
      <div className="space-y-7">
        <PageHeader
          eyebrow="Practice Arena · simulation"
          title="Mock Tests"
          sub="Timed simulations on the real in-app question bank. +1 per correct, −0.25 negative on graded presets — exactly like the sessional pattern."
          right={<div className="hidden text-right sm:block"><div className="font-display text-3xl font-bold text-cyan-300">{MOCK_PRESETS.length}</div><div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">presets</div></div>}
        />

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-3 sm:grid-cols-2">
            {MOCK_PRESETS.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassPanel className={cn('h-full p-5', p.id === 'full' && 'border-violet-400/30')}>
                  <div className="flex items-start justify-between">
                    <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl border border-white/10', p.id === 'full' ? 'bg-violet-500/10 text-violet-300' : 'bg-cyan-500/10 text-cyan-300')}>
                      <Target size={16} />
                    </div>
                    {p.negative && <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-300">−0.25 negative</span>}
                  </div>
                  <div className="mt-3 font-display font-bold text-white">{p.title}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{p.subtitle}</div>
                  <Button size="sm" className="mt-4 w-full" onClick={() => start(p)}>
                    Start attempt <ArrowRight size={14} />
                  </Button>
                </GlassPanel>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3">
            <GlassPanel className="p-5">
              <SectionLabel>Exam-day rules</SectionLabel>
              <ul className="mt-3 space-y-2 text-[12.5px] leading-relaxed text-slate-400">
                <li className="flex gap-2"><Clock size={13} className="mt-0.5 shrink-0 text-cyan-400" /> Auto-submit the moment the timer hits 0:00.</li>
                <li className="flex gap-2"><Check size={13} className="mt-0.5 shrink-0 text-emerald-400" /> +1 for every correct option.</li>
                <li className="flex gap-2"><X size={13} className="mt-0.5 shrink-0 text-rose-400" /> −0.25 on graded presets when you're wrong.</li>
                <li className="flex gap-2"><AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-400" /> Unattempted questions carry zero — no penalty to skip.</li>
              </ul>
            </GlassPanel>
            <GlassPanel className="p-5 text-[12.5px] leading-relaxed text-slate-400">
              Want untimed drilling first? <Link to="/practice" className="text-cyan-300 underline">Practice Arena</Link> gives instant feedback with concepts.
            </GlassPanel>
          </div>
        </div>
      </div>
    );
  }

  /* ───────────────────── RESULT ───────────────────── */
  if (phase === 'result' && result && preset) {
    const verdict = result.accuracyPct >= 70 ? 'Strong attempt — keep the momentum.' : result.accuracyPct >= 45 ? 'Solid base — review the misses below.' : 'Revision first, then re-attempt.';
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Mock test · review"
          title={result.accuracyPct >= 70 ? 'Mission passed 🎯' : 'Attempt reviewed'}
          sub={verdict}
          right={<ProgressRing value={result.accuracyPct} size={110} stroke={8} sublabel="accuracy" color={result.accuracyPct >= 70 ? '#34d399' : '#f59e0b'} />}
          backTo="/mock"
          backLabel="Mock tests"
        />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Marks', v: `${result.marks}/${result.maxMarks}`, cls: 'text-cyan-300' },
            { label: 'Correct', v: result.correct, cls: 'text-emerald-300' },
            { label: 'Wrong', v: result.wrong, cls: 'text-rose-300' },
            { label: 'Skipped', v: result.skipped, cls: 'text-slate-300' },
          ].map((s) => (
            <GlassPanel key={s.label} className="p-4">
              <div className={cn('font-display text-2xl font-bold', s.cls)}>{s.v}</div>
              <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">{s.label}</div>
            </GlassPanel>
          ))}
        </div>

        <GlassPanel className="p-5">
          <div className="flex items-center justify-between">
            <SectionLabel>Subject breakdown</SectionLabel>
            <span className="text-[10px] uppercase tracking-[0.16em] text-slate-500">correct / total</span>
          </div>
          <div className="mt-3 space-y-2.5">
            {result.bySubject.map((s) => (
              <div key={s.courseId} className="flex items-center gap-3">
                <span className="w-14 shrink-0 font-mono text-[11px] text-slate-400">{s.short}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                    style={{ width: `${s.total ? (s.correct / s.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-slate-300">{s.correct}/{s.total}</span>
              </div>
            ))}
          </div>
        </GlassPanel>

        <div>
          <SectionLabel className="mb-3">Full review — every question</SectionLabel>
          <div className="space-y-3">
            {questions.map((q, i) => {
              const a = answers[q.id];
              const ok = a === q.answer;
              return (
                <GlassPanel key={q.id} className={cn('p-4', ok ? 'border-emerald-400/25' : a == null ? 'border-white/[0.07]' : 'border-rose-400/25')}>
                  <div className="flex items-start gap-3">
                    <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold', ok ? 'bg-emerald-400/20 text-emerald-300' : a == null ? 'bg-white/[0.06] text-slate-500' : 'bg-rose-400/20 text-rose-300')}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] leading-relaxed text-slate-200">{q.text}</div>
                      <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                        {q.options.map((o, oi) => (
                          <div
                            key={oi}
                            className={cn(
                              'rounded-lg border px-2.5 py-1.5 text-[12.5px]',
                              oi === q.answer
                                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200'
                                : a === oi
                                  ? 'border-rose-400/40 bg-rose-400/10 text-rose-200'
                                  : 'border-white/[0.06] text-slate-400',
                            )}
                          >
                            <span className="mr-1.5 font-mono text-[10.5px] text-slate-500">{'ABCD'[oi]}</span>{o}
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[12.5px] leading-relaxed text-slate-400">
                        <span className="font-semibold text-cyan-300">Why: </span>{q.explanation}
                      </div>
                    </div>
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => preset && start(preset)}><RotateCcw size={14} /> Retake {preset.title}</Button>
          <Button variant="outline" onClick={() => { setPhase('setup'); setPreset(null); }}>All presets</Button>
          <Link to="/practice" className="inline-flex items-center"><Button variant="ghost">Practice Arena</Button></Link>
        </div>
      </div>
    );
  }

  /* ───────────────────── RUN ───────────────────── */
  if (!current || !preset) return null;
  const low = left <= 60;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-cyan-400/80">{preset.title} · live attempt</div>
          <div className="mt-0.5 text-[12px] text-slate-500">Q {idx + 1} / {questions.length} · answered {answered}</div>
        </div>
        <div className={cn('flex items-center gap-2 rounded-xl border px-4 py-2', low ? 'border-rose-400/50 bg-rose-500/10' : 'border-white/10 bg-white/[0.03]')}>
          <Clock size={16} className={low ? 'text-rose-400' : 'text-cyan-300'} />
          <span className={cn('font-mono text-lg font-bold', low ? 'text-rose-300' : 'text-white')}>{fmt(left)}</span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn('h-full rounded-full transition-all duration-500', low ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-violet-500')}
          style={{ width: `${(left / (preset.minutes * 60)) * 100}%` }}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <GlassPanel className="p-6">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-md bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-300">{current.co}</span>
              <span className="rounded-md bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">{current.bloom}</span>
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400">{COURSE_MAP[current.courseId]?.short ?? current.courseId}</span>
              <span className="rounded-md bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-slate-400">Paper {current.paper}</span>
            </div>
            <div className="mt-3 text-[15px] leading-relaxed text-slate-100">{current.text}</div>
            <div className="mt-4 space-y-2">
              {current.options.map((o, oi) => {
                const sel = answers[current.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => setAnswers((a) => ({ ...a, [current.id]: oi }))}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[13.5px] transition-all',
                      sel ? 'border-cyan-400/60 bg-cyan-400/[0.08] text-cyan-100' : 'border-white/[0.08] bg-white/[0.02] text-slate-300 hover:border-cyan-400/35 hover:text-slate-100',
                    )}
                  >
                    <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold', sel ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200' : 'border-white/15 text-slate-500')}>
                      {'ABCD'[oi]}
                    </span>
                    {o}
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              <ChevronLeft size={14} /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnswers((a) => ({ ...a, [current.id]: null }))}
              className="hidden sm:inline-flex"
            >
              Mark for review
            </Button>
            {idx === questions.length - 1 ? (
              <Button size="sm" onClick={submit}><Trophy size={14} /> Submit attempt</Button>
            ) : (
              <Button size="sm" onClick={() => setIdx((i) => Math.min(questions.length - 1, i + 1))}>
                Next <ChevronRight size={14} />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <GlassPanel className="p-4">
            <SectionLabel>Question palette</SectionLabel>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {questions.map((q, i) => {
                const state = answers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setIdx(i)}
                    className={cn(
                      'flex h-8 items-center justify-center rounded-lg border text-[11px] font-medium transition-all',
                      i === idx && 'ring-1 ring-cyan-400',
                      state === undefined && 'border-white/10 bg-white/[0.03] text-slate-500',
                      state === null && 'border-amber-400/40 bg-amber-400/10 text-amber-300',
                      typeof state === 'number' && 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 text-[10.5px] text-slate-500">
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-400/40" /> answered</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400/40" /> marked</div>
              <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-white/10" /> unvisited</div>
            </div>
          </GlassPanel>
          <Button variant="outline" size="sm" className="w-full" onClick={submit}>
            <Trophy size={14} /> Submit ({answered}/{questions.length})
          </Button>
          <p className="text-[11px] leading-relaxed text-slate-600">Auto-submit at 0:00. Unattempted = 0 marks{preset.negative ? ', wrong = −0.25' : ''}.</p>
        </div>
      </div>
    </div>
  );
}
