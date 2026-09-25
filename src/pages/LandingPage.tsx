import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Cpu, BarChart3, ArrowRight, Sparkles, ShieldCheck, Orbit } from 'lucide-react';
import { HeroScene } from '@/components/three/HeroScene';
import { GlassPanel, StatusPill } from '@/components/ui';

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: 0.12 * i, duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }),
};

const COLUMNS = [
  {
    icon: GraduationCap,
    title: 'Academics',
    color: '#22d3ee',
    items: ['Syllabus', 'Modules', 'Labs', 'Sessionals'],
  },
  {
    icon: Cpu,
    title: 'AI Engine',
    color: '#8b5cf6',
    items: ['Study Planner', 'AI Tutor', 'Questions', 'Revision'],
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    color: '#3b82f6',
    items: ['Progress', 'SGPA', 'Readiness', 'Weak Areas'],
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-nexus-bg text-slate-200 font-sans overflow-x-hidden">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col">
        <div className="absolute inset-0">
          <HeroScene />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(4,6,13,0.55)_0%,rgba(4,6,13,0.72)_45%,rgba(4,6,13,0.92)_100%)]" />

        <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/40 bg-cyan-400/10">
              <Orbit size={16} className="text-cyan-300" />
            </span>
            <span className="font-display text-sm font-bold tracking-[0.2em] text-white">
              MAKAUT<span className="text-cyan-400"> NEXUS</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="hidden text-[12px] uppercase tracking-[0.16em] text-slate-400 hover:text-white transition-colors">
              Demo cockpit
            </Link>
            <Link
              to="/onboarding"
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-cyan-200 hover:bg-cyan-400/20 transition-colors"
            >
              Build core
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={0} className="mb-5 flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5">
            <Sparkles size={13} className="text-violet-300" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-violet-200">Hackathon build — v1.0</span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="show"
            custom={1}
            className="font-display text-5xl font-bold leading-[1.04] tracking-tight text-white md:text-7xl [text-shadow:0_4px_40px_rgba(4,6,13,0.95)]"
          >
            MAKAUT <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">NEXUS</span>
          </motion.h1>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={2} className="mt-4 font-display text-lg text-cyan-200/90 [text-shadow:0_2px_20px_rgba(4,6,13,0.95)] md:text-xl">
            Your First-Year Academic Command Center
          </motion.p>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={3} className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 [text-shadow:0_2px_16px_rgba(4,6,13,0.95)] md:text-base">
            Know what to study. Know where you stand. Know what comes next.
          </motion.p>

          <motion.div variants={fadeUp} initial="hidden" animate="show" custom={4} className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/onboarding"
              className="group inline-flex items-center gap-2.5 rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 shadow-glow-cyan transition-all hover:scale-[1.03] hover:brightness-110"
            >
              Build my academic core
              <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-medium uppercase tracking-[0.14em] text-slate-200 backdrop-blur-md transition-all hover:border-cyan-400/40 hover:bg-white/[0.07]"
            >
              Enter demo cockpit
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} initial="hidden" animate="show" custom={5} className="mt-8 max-w-3xl text-[13px] leading-relaxed text-slate-400 [text-shadow:0_2px_14px_rgba(4,6,13,0.95)]">
            “MAKAUT NEXUS is a 3D AI-powered academic command center that turns a first-year MAKAUT student's scattered
            syllabus, study requirements, labs, progress and marks into one personalized plan for what to do next.”
          </motion.p>
        </div>
      </section>

      {/* ── Problem → system ─────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }} className="text-center">
          <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-400/80">The problem</div>
          <h2 className="mx-auto mt-3 max-w-3xl font-display text-2xl font-bold text-white md:text-3xl">
            A first-year student's academics live in twelve different places.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-slate-400">
            Syllabus PDFs. Subject lists. Module hours. Labs. Sessionals. Marks. Study planning. Group structures. Exam
            preparation. Scattered resources. NEXUS folds all of it into one interactive environment — and answers
            “what should I do next?”
          </p>
        </motion.div>

        <div className="mt-16 flex flex-col items-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="font-display text-xl font-bold tracking-[0.3em] text-white md:text-2xl"
          >
            MAKAUT NEXUS
          </motion.div>
          <div className="my-3 h-8 w-px bg-gradient-to-b from-cyan-400/70 to-transparent" />

          <div className="grid w-full gap-4 md:grid-cols-3">
            {COLUMNS.map((col, i) => (
              <motion.div key={col.title} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={i}>
                <GlassPanel className="h-full p-6" glow={col.color}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border" style={{ borderColor: `${col.color}55`, background: `${col.color}15`, color: col.color }}>
                      <col.icon size={18} />
                    </span>
                    <h3 className="font-display text-base font-bold uppercase tracking-[0.18em] text-white">{col.title}</h3>
                  </div>
                  <ul className="mt-5 space-y-2.5">
                    {col.items.map((it) => (
                      <li key={it} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <span className="h-1 w-1 rounded-full" style={{ background: col.color, boxShadow: `0 0 6px ${col.color}` }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What next ────────────────────────────────────────────── */}
      <section className="relative border-t border-white/[0.06] bg-[#070b18]/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}>
            <div className="text-[11px] uppercase tracking-[0.3em] text-violet-400/80">The difference</div>
            <h2 className="mt-3 font-display text-2xl font-bold text-white md:text-3xl">
              We don't just tell students what the syllabus is.
              <span className="mt-2 block bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
                We tell them what to do next.
              </span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-slate-400">
              The AI is one component of an operating system: 3D Academic Core, syllabus explorer, mission generator,
              planner, lab &amp; sessional trackers, SGPA simulator and practice arena — all driven by one structured,
              source-verified knowledge layer.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <StatusPill status="provisional" />
              <span className="text-[11px] text-slate-500">
                Every academic fact carries source · type · verification · checked-date.
              </span>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} custom={1}>
            <GlassPanel className="p-7">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-400" />
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-[0.18em] text-white">Technically responsible AI</div>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
                    Unresolved 2026 structure conflicts are surfaced, not hidden. Assessment rules stay marked
                    <span className="text-amber-300"> provisional</span> until the official regulation arrives. The
                    prototype is fully ready for the verified dataset — it just refuses to pretend unverified data is
                    official.
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 text-center">
                {[
                  ['7', 'Core screens'],
                  ['1', '3D environment'],
                  ['1', 'AI engine'],
                  ['20', 'Credits mapped*'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-3">
                    <div className="font-display text-xl font-bold text-cyan-300">{v}</div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500">{l}</div>
                  </div>
                ))}
              </div>
            </GlassPanel>
          </motion.div>
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-24 text-center">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.14),transparent_60%)]" />
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="relative">
          <div className="font-display text-2xl font-bold tracking-[0.24em] text-white md:text-3xl">
            ONE STUDENT. ONE CORE. ONE PLAN.
          </div>
          <div className="mt-4 font-display text-lg font-bold tracking-[0.3em] text-cyan-300">MAKAUT NEXUS</div>
          <Link
            to="/onboarding"
            className="mt-9 inline-flex items-center gap-2.5 rounded-2xl border border-cyan-300/40 bg-gradient-to-r from-cyan-400 to-blue-500 px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-950 shadow-glow-cyan transition-all hover:scale-[1.03]"
          >
            Launch the experience <ArrowRight size={17} />
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-white/[0.06] px-6 py-7 text-center text-[11px] text-slate-600">
        MAKAUT NEXUS v1.0 · First-Year Academic OS · Prototype data marked “verification pending” where sources conflict ·
        Not affiliated with MAKAUT / CEMK.
      </footer>
    </div>
  );
}
