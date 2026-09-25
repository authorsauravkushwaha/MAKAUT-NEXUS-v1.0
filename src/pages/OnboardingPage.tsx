import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Building2, GitBranch, CalendarDays, GraduationCap, Clock, Target, Users, ChevronRight } from 'lucide-react';
import { useNexus } from '@/state/context';
import { addDays, todayISO, formatDate } from '@/lib/dates';
import { Button, GlassPanel, cn } from '@/components/ui';
import { SEMESTER_1, UNIVERSITY } from '@/data';

const COLLEGES = ['CEMK', 'MAKAUT (main campus)', 'Other affiliated college'];
const BRANCHES = ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE'];
const GROUPS = ['Group A', 'Group B'];
const DAILY_OPTIONS = [
  { label: '2 hours', minutes: 120 },
  { label: '3 hours', minutes: 180 },
  { label: '4 hours', minutes: 240 },
  { label: '5 hours', minutes: 300 },
];

function Field({ label, icon: Icon, children }: { label: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400">
        <Icon size={13} className="text-cyan-400" /> {label}
      </div>
      {children}
    </div>
  );
}

function ChipRow({ options, value, onChange }: { options: { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-xl border px-3.5 py-2 text-[13px] transition-all',
            value === o.id
              ? 'border-cyan-400/60 bg-cyan-400/12 text-cyan-200 shadow-glow-cyan'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-slate-200',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const GEN_STEPS = [
  'Loading MAKAUT knowledge layer…',
  'Verifying semester structure & sources…',
  'Mapping modules, hours and credits…',
  'Spawning subject planets…',
  'Calibrating Academic Core…',
  'Your core is online.',
];

export function OnboardingPage() {
  const nav = useNavigate();
  const { startOnboarding } = useNexus();

  const [name, setName] = useState('Saurav');
  const [college, setCollege] = useState('CEMK');
  const [branch, setBranch] = useState('CSE');
  const [year] = useState('1st Year');
  const [semester] = useState('Semester 1');
  const [group, setGroup] = useState('Group A');
  const [targetSgpa, setTargetSgpa] = useState(8.5);
  const [dailyIdx, setDailyIdx] = useState(1);
  const [examDate, setExamDate] = useState(addDays(todayISO(), 18));
  const [generating, setGenerating] = useState(false);
  const [step, setStep] = useState(0);

  const minDate = useMemo(() => addDays(todayISO(), 1), []);

  const launch = () => {
    setGenerating(true);
    setStep(0);
    GEN_STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStep(i);
        if (i === GEN_STEPS.length - 1) {
          setTimeout(() => {
            startOnboarding({
              name: name.trim() || 'Cadet',
              college,
              branch,
              year,
              semester,
              group,
              targetSgpa,
              dailyMinutes: DAILY_OPTIONS[dailyIdx].minutes,
              examDate,
            });
            nav('/dashboard');
          }, 900);
        }
      }, i * 620);
    });
  };

  if (generating) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-nexus-bg px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.12),transparent_55%)]" />
        <div className="relative h-40 w-40">
          <div className="absolute inset-0 rounded-full border border-cyan-400/25 animate-spin-slow" />
          <div className="absolute inset-4 rounded-full border border-violet-400/25 animate-[spin_6s_linear_infinite_reverse]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="h-14 w-14 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 shadow-glow-cyan"
            />
          </div>
        </div>
        <div className="relative mt-10 w-full max-w-md text-center">
          <div className="font-display text-sm uppercase tracking-[0.3em] text-cyan-300">Building your academic core</div>
          <div className="mt-5 space-y-2 text-left">
            {GEN_STEPS.slice(0, step + 1).map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-[13px]',
                  i === step ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100' : 'border-white/[0.06] bg-white/[0.02] text-slate-500',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', i === step ? 'bg-cyan-300 animate-blink' : 'bg-emerald-400')} />
                {s}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nexus-bg px-6 py-10 text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-grid-faint bg-[size:44px_44px] opacity-40" />
      <div className="relative mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="text-[11px] uppercase tracking-[0.32em] text-cyan-400/80">First contact</div>
          <h1 className="mt-2 font-display text-3xl font-bold text-white">Build your academic profile</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
            This defines your mission: {UNIVERSITY.short_name} · {semester} · {SEMESTER_1.total_credits} credits ·{' '}
            {SEMESTER_1.components_count} academic components. Every figure is marked provisional until verified against
            your college's official registration list.
          </p>
        </div>

        <GlassPanel className="p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Your call sign (name)" icon={GraduationCap}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none transition-colors focus:border-cyan-400/60"
                placeholder="Cadet"
              />
            </Field>

            <Field label="College" icon={Building2}>
              <ChipRow options={COLLEGES.map((c) => ({ id: c, label: c }))} value={college} onChange={setCollege} />
            </Field>

            <Field label="Branch" icon={GitBranch}>
              <ChipRow options={BRANCHES.map((b) => ({ id: b, label: b }))} value={branch} onChange={setBranch} />
            </Field>

            <Field label="Year / Semester" icon={CalendarDays}>
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-center text-[13px] text-cyan-100">{year}</div>
                <div className="flex-1 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2.5 text-center text-[13px] text-cyan-100">{semester}</div>
              </div>
            </Field>

            <Field label="Group" icon={Users}>
              <ChipRow options={GROUPS.map((g) => ({ id: g, label: g }))} value={group} onChange={setGroup} />
            </Field>

            <Field label="Target SGPA" icon={Target}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={6}
                  max={10}
                  step={0.1}
                  value={targetSgpa}
                  onChange={(e) => setTargetSgpa(Number(e.target.value))}
                  className="flex-1 accent-cyan-400"
                />
                <span className="w-12 text-right font-mono text-lg font-bold text-cyan-300">{targetSgpa.toFixed(1)}</span>
              </div>
            </Field>

            <Field label="Daily study time" icon={Clock}>
              <ChipRow options={DAILY_OPTIONS.map((o, i) => ({ id: String(i), label: o.label }))} value={String(dailyIdx)} onChange={(v) => setDailyIdx(Number(v))} />
            </Field>

            <Field label="Target exam date" icon={CalendarDays}>
              <input
                type="date"
                value={examDate}
                min={minDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-cyan-400/60"
              />
              <div className="mt-1.5 text-[11px] text-slate-500">{formatDate(examDate)} — countdown drives your planner.</div>
            </Field>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
            <Button size="lg" onClick={launch} className="w-full max-w-sm">
              <Rocket size={16} /> Build my academic core <ChevronRight size={16} />
            </Button>
            <button onClick={() => nav('/dashboard')} className="text-[12px] text-slate-500 hover:text-slate-300 transition-colors">
              Skip — enter the demo cockpit instead
            </button>
          </div>
        </GlassPanel>

        <div className="mt-6 flex justify-center">
          <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-amber-300">
            🟡 Provisional source · last verified 25 Sep 2026
          </span>
        </div>
      </div>
    </div>
  );
}
