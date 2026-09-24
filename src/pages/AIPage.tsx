import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, GraduationCap, Building2, Cpu, Sparkles, RotateCcw } from 'lucide-react';
import { useNexus } from '@/state/context';
import { respond, QUICK_PROMPTS } from '@/ai/chatEngine';
import type { ChatMessage } from '@/types';
import { GlassPanel, PageHeader, Button, cn, StatusPill } from '@/components/ui';
import { SemesterSummaryCard } from '@/pages/SemesterSummaryCard';
import { formatMissionClock, formatDuration } from '@/lib/dates';
import { COURSE_MAP } from '@/data';

let localSeq = 0;
const mkId = () => `ui-${Date.now().toString(36)}-${(localSeq++).toString(36)}`;

function TagChip({ tag }: { tag: NonNullable<Extract<ChatMessage, { kind: 'text' }>['tag']> }) {
  const map = {
    academic: { icon: GraduationCap, label: 'Academic explanation', cls: 'border-cyan-400/30 bg-cyan-400/10 text-cyan-300' },
    makaut: { icon: Building2, label: 'MAKAUT-specific · structured data', cls: 'border-amber-400/30 bg-amber-400/10 text-amber-300' },
    system: { icon: Cpu, label: 'NEXUS core', cls: 'border-violet-400/30 bg-violet-400/10 text-violet-300' },
  } as const;
  const s = map[tag ?? 'system'];
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]', s.cls)}>
      <s.icon size={9} /> {s.label}
    </span>
  );
}

function MissionBubble({ mission }: { mission: Extract<ChatMessage, { kind: 'mission' }>['mission'] }) {
  return (
    <GlassPanel className="w-full max-w-lg overflow-hidden p-4" glow="#22d3ee">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.26em] text-cyan-300">
          <Sparkles size={11} /> Today's mission
        </div>
        <span className="font-mono text-sm font-bold text-cyan-300">{formatMissionClock(mission.totalMinutes)}</span>
      </div>
      <div className="mt-3 space-y-2">
        {mission.items.map((it, i) => (
          <motion.div
            key={it.id}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.12 + i * 0.1 }}
            className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5"
          >
            <span className="font-mono text-[11px] text-slate-600">{String(i + 1).padStart(2, '0')}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-semibold text-white">{it.label}</div>
              <div className="truncate text-[11px] text-slate-500">{it.sublabel}</div>
            </div>
            <span className="shrink-0 rounded-md bg-cyan-400/10 px-2 py-0.5 font-mono text-[11px] text-cyan-300">{it.minutes} min</span>
          </motion.div>
        ))}
      </div>
    </GlassPanel>
  );
}

function PlanBubble() {
  return null;
}

export function AIPage() {
  const { state } = useNexus();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([
      {
        id: mkId(),
        role: 'nexus',
        kind: 'text',
        tag: 'system',
        at: Date.now(),
        text: `NEXUS online, ${state.profile.name}. I'm grounded in your ${state.profile.semester} state — syllabus modules, progress, lab records, marks and schedule. Ask me what to study, or type "Explain my semester".`,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = (raw: string) => {
    const q = raw.trim();
    if (!q || typing) return;
    setInput('');
    const studentMsg: ChatMessage = { id: mkId(), role: 'student', kind: 'text', at: Date.now(), text: q };
    setMessages((m) => [...m, studentMsg]);
    setTyping(true);
    setTimeout(() => {
      const replies = respond(q, { state });
      setTyping(false);
      setMessages((m) => [...m, ...replies]);
    }, 650 + Math.random() * 500);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Conversational layer"
        title="NEXUS AI"
        sub="Not a generic chatbot — it knows your semester, subjects, modules, progress and schedule. 📘 academic explanations vs 🏫 structured MAKAUT data."
        right={<StatusPill status="provisional" />}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <GlassPanel className="flex h-[640px] flex-col overflow-hidden">
          {/* header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/30 to-violet-500/30 border border-cyan-400/30">
                <Cpu size={15} className="text-cyan-300" />
              </span>
              <div>
                <div className="text-[13px] font-semibold text-white">NEXUS AI</div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-blink" /> grounded in your academic state
                </div>
              </div>
            </div>
            <button
              onClick={() => setMessages([])}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-white hover:border-white/25"
            >
              <RotateCcw size={11} /> Clear
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Sparkles size={26} className="text-cyan-400/60" />
                <p className="mt-3 max-w-xs text-[13px] text-slate-500">
                  Ask about today's mission, a concept you're stuck on, your SGPA, or say “Explain my semester”.
                </p>
              </div>
            )}
            {messages.map((m) => {
              if (m.kind === 'mission') return <MissionBubble key={m.id} mission={m.mission} />;
              if (m.kind === 'summary')
                return (
                  <div key={m.id} className="max-w-md">
                    <SemesterSummaryCard data={m.summary} />
                  </div>
                );
              if (m.kind === 'plan') return <PlanBubble key={m.id} />;
              if (m.role === 'student') {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md border border-cyan-400/25 bg-cyan-400/10 px-4 py-2.5 text-[13px] leading-relaxed text-cyan-50">
                      {m.text}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[85%]">
                    {m.tag && (
                      <div className="mb-1.5">
                        <TagChip tag={m.tag} />
                      </div>
                    )}
                    <div className="whitespace-pre-wrap rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-[13px] leading-relaxed text-slate-200">
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {typing && (
              <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-4 py-3 w-fit">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.18 }}
                    className="h-1.5 w-1.5 rounded-full bg-cyan-400"
                  />
                ))}
              </div>
            )}
          </div>

          {/* quick prompts */}
          <div className="flex flex-wrap gap-1.5 border-t border-white/[0.06] px-5 py-3">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 transition-all hover:border-cyan-400/40 hover:text-cyan-200"
              >
                {p}
              </button>
            ))}
          </div>

          {/* composer */}
          <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              placeholder="Ask NEXUS… e.g. What should I study today?"
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] text-white outline-none transition-colors placeholder:text-slate-600 focus:border-cyan-400/50"
            />
            <Button size="sm" onClick={() => send(input)} disabled={!input.trim()}>
              <Send size={14} /> Send
            </Button>
          </div>
        </GlassPanel>

        {/* context rail */}
        <div className="flex flex-col gap-4">
          <GlassPanel className="p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Context window</div>
            <div className="mt-3 space-y-2 text-[12px]">
              {[
                ['Semester', state.profile.semester],
                ['Exam in', `${Math.max(0, Math.ceil((new Date(state.profile.examDate).getTime() - Date.now()) / 86400000))} days`],
                ['Budget', formatDuration(state.profile.dailyMinutes)],
                ['Target SGPA', state.profile.targetSgpa.toFixed(1)],
                ['Subjects', `${Object.keys(COURSE_MAP).length} mapped`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-2">
                  <span className="text-slate-500">{k}</span>
                  <span className="font-medium text-slate-200">{v}</span>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Knowledge rules</div>
            <ul className="mt-3 space-y-2.5 text-[12px] leading-relaxed text-slate-400">
              <li className="flex gap-2"><span className="text-cyan-400">📘</span> Academic explanations are general teaching content.</li>
              <li className="flex gap-2"><span className="text-amber-400">🏫</span> MAKAUT-specific answers only use structured, source-tagged data — and say when it's provisional.</li>
              <li className="flex gap-2"><span className="text-violet-400">⚡</span> Missions and summaries are computed from your live state, never canned.</li>
            </ul>
          </GlassPanel>

          <GlassPanel className="p-4">
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Mission preview</div>
            <div className="mt-2 font-mono text-2xl font-bold text-cyan-300">
              {state.mission ? formatMissionClock(state.mission.totalMinutes) : '—'}
            </div>
            <div className="text-[11px] text-slate-500">
              {state.mission ? `${state.mission.items.length} items · ${state.mission.completedItemIds.length} done today` : 'Open the Core to generate'}
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}
