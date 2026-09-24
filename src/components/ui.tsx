import React, { useState } from 'react';
import { Info } from 'lucide-react';
import type { SourceRef } from '@/types';
import { SOURCE_MAP } from '@/data';
import { formatDate } from '@/lib/dates';

export const cn = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

export const GLOW: Record<string, string> = {
  cyan: '#22d3ee',
  violet: '#8b5cf6',
  blue: '#3b82f6',
  amber: '#f59e0b',
  rose: '#fb7185',
  emerald: '#34d399',
};

/* ── Glass panel ─────────────────────────────────────────────────── */
export function GlassPanel({
  children,
  className,
  glow,
  as: As = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
  as?: React.ElementType;
}) {
  return (
    <As
      className={cn(
        'relative rounded-2xl border border-white/[0.08] bg-white/[0.035] backdrop-blur-xl shadow-soft inner-glass',
        className,
      )}
      style={glow ? ({ '--panel-glow': glow } as React.CSSProperties) : undefined}
    >
      {children}
    </As>
  );
}

/* ── Buttons ─────────────────────────────────────────────────────── */
type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'violet';
  size?: 'sm' | 'md' | 'lg';
};

export function Button({ variant = 'primary', size = 'md', className, children, ...rest }: BtnProps) {
  const sizes = {
    sm: 'px-3 py-1.5 text-[12px]',
    md: 'px-5 py-2.5 text-[13px]',
    lg: 'px-7 py-3.5 text-sm',
  }[size];
  const variants = {
    primary:
      'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold hover:shadow-glow-cyan hover:brightness-110 border border-cyan-300/40',
    violet:
      'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold hover:shadow-glow-violet hover:brightness-110 border border-violet-300/30',
    outline: 'border border-cyan-400/40 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-300',
    ghost: 'border border-white/10 text-slate-300 hover:bg-white/5 hover:text-white',
  }[variant];
  return (
    <button
      {...rest}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none tracking-wide uppercase font-medium',
        sizes,
        variants,
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── Progress ring ───────────────────────────────────────────────── */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  color = '#22d3ee',
  label,
  sublabel,
  trackClass = 'rgba(148,163,184,0.15)',
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: React.ReactNode;
  sublabel?: string;
  trackClass?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackClass} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (v / 100) * c}
          style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label ?? <span className="font-display font-bold" style={{ fontSize: size / 3.6 }}>{Math.round(v)}%</span>}
        {sublabel && (
          <span
            className="mt-0.5 uppercase text-slate-400"
            style={{ fontSize: size <= 96 ? 7 : 9, letterSpacing: '0.12em' }}
          >
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── Horizontal stat bar ─────────────────────────────────────────── */
export function StatBar({
  label,
  value,
  suffix,
  color = '#22d3ee',
  height = 8,
  delay = 0,
}: {
  label?: React.ReactNode;
  value: number;
  suffix?: string;
  color?: string;
  height?: number;
  delay?: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full">
        {label && (
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[12px] text-slate-300 uppercase tracking-wider">{label}</span>
          <span className="text-[13px] font-mono text-slate-300">
            {suffix ?? `${Math.round(v)}%`}
          </span>
        </div>
      )}
      <div className="w-full rounded-full bg-white/[0.06] overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${v}%`,
            background: `linear-gradient(90deg, ${color}55, ${color})`,
            boxShadow: `0 0 12px ${color}66`,
            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ── Pills ───────────────────────────────────────────────────────── */
export function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    verified: { bg: 'bg-emerald-500/15', fg: 'text-emerald-300', label: '✓ Verified' },
    provisional: { bg: 'bg-amber-500/15', fg: 'text-amber-300', label: '🟡 Provisional' },
    pending: { bg: 'bg-amber-500/15', fg: 'text-amber-300', label: '⏳ Pending source' },
    unverified: { bg: 'bg-rose-500/15', fg: 'text-rose-300', label: '⛔ Unverified' },
  };
  const s = map[status] ?? map.unverified;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide', s.bg, s.fg)}>
      {s.label}
    </span>
  );
}

/* ── Source badge (ⓘ) — provenance popover on every academic fact ── */
export function SourceBadge({ fact, className }: { fact: SourceRef & { title?: string }; className?: string }) {
  const [open, setOpen] = useState(false);
  const src = SOURCE_MAP[fact.source_ref];
  return (
    <span className={cn('relative inline-block', className)}>
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') setOpen((o) => !o);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-slate-400 transition-colors hover:cursor-pointer hover:border-cyan-400/50 hover:text-cyan-300"
        aria-label="Source of this data"
      >
        <Info size={11} />
      </span>
      {open && (
        <span
          className="absolute right-0 bottom-full z-50 mb-2 block w-72 rounded-xl border border-white/10 bg-[#0a1020]/95 p-3.5 backdrop-blur-xl shadow-glow-soft text-left"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="block text-[10px] uppercase tracking-[0.18em] text-cyan-400 mb-1.5">Source</span>
          <span className="block text-[12px] text-slate-200 leading-snug">{src?.label ?? fact.source_ref}</span>
          <span className="mt-2 flex flex-wrap gap-1.5">
            <StatusPill status={fact.verification_status} />
            <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] text-blue-300">
              {fact.source_type === 'primary' ? 'Primary' : fact.source_type === 'secondary' ? 'Secondary' : 'Internal'}
            </span>
            <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] text-slate-300">
              Checked {formatDate(fact.checked)}
            </span>
          </span>
          {src?.note && <span className="mt-2 block text-[11px] leading-relaxed text-slate-400">{src.note}</span>}
        </span>
      )}
    </span>
  );
}

/* ── Page header ─────────────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  sub,
  right,
}: {
  eyebrow?: string;
  title: string;
  sub?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-7">
      <div>
        {eyebrow && <div className="text-[11px] uppercase tracking-[0.3em] text-cyan-400/80 mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight">{title}</h1>
        {sub && <p className="text-slate-400 text-sm mt-1.5 max-w-2xl">{sub}</p>}
      </div>
      {right && <div className="flex items-center gap-3">{right}</div>}
    </div>
  );
}

/* ── Section label ───────────────────────────────────────────────── */
export function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('text-[10px] uppercase tracking-[0.28em] text-slate-500 font-medium', className)}>{children}</div>
  );
}

/* ── Empty-state hint ────────────────────────────────────────────── */
export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-[13px] text-slate-500 leading-relaxed">{children}</p>;
}
