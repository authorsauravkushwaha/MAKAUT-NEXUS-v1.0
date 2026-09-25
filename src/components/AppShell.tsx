import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, BookOpen, BrainCircuit, CalendarRange, Radar, FlaskConical, Sigma,
  Settings, Target, Bell, CheckCircle2, X,
} from 'lucide-react';
import { useNexus } from '@/state/context';
import { cn } from '@/components/ui';

const NAV = [
  { to: '/dashboard', label: 'Core', full: 'Core', icon: Home },
  { to: '/syllabus', label: 'Syllabus', full: 'Syllabus', icon: BookOpen },
  { to: '/ai', label: 'AI Tutor', full: 'AI Tutor', icon: BrainCircuit },
  { to: '/planner', label: 'Planner', full: 'Planner', icon: CalendarRange },
  { to: '/analytics', label: 'Analytics', full: 'Analytics', icon: Radar },
  { to: '/labs', label: 'Labs', full: 'Labs', icon: FlaskConical },
  { to: '/sgpa', label: 'SGPA', full: 'SGPA', icon: Sigma },
  { to: '/practice', label: 'Practice', full: 'Practice Arena', icon: Target },
  { to: '/profile', label: 'Profile', full: 'Profile', icon: Settings },
];

export function FloatingNav() {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === '/labs' ? pathname === '/labs' || pathname === '/sessionals' : pathname.startsWith(to));
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-[#070b18]/85 px-2 py-1.5 backdrop-blur-xl shadow-glow-soft">
        {NAV.map(({ to, label, full, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={full}
            className={cn(
              'group relative flex items-center gap-1.5 rounded-xl px-2.5 py-2 transition-all duration-200',
              isActive(to) ? 'bg-cyan-400/10 text-cyan-300' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5',
            )}
          >
            <Icon size={15} strokeWidth={1.8} />
            <span className="hidden lg:inline text-[10px] uppercase tracking-[0.14em] font-medium">{label}</span>
            {isActive(to) && (
              <span className="absolute -bottom-0.5 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function TopBar() {
  const { state } = useNexus();
  const initials = (state.profile.name || 'C').slice(0, 1).toUpperCase();
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#04060d]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-5">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-violet-500/20 border border-cyan-400/30">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-pulse-ring" />
          </span>
          <span className="font-display text-[15px] font-bold tracking-[0.14em] text-white group-hover:text-cyan-200 transition-colors">
            MAKAUT<span className="text-cyan-400"> NEXUS</span>
          </span>
        </NavLink>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-blink" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Mission Control</span>
          </div>
          <button className="relative rounded-lg p-2 text-slate-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Notifications">
            <Bell size={16} />
            {!state.streak.todayDone && (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
            )}
          </button>
          <NavLink to="/profile" className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 hover:border-cyan-400/30 transition-colors">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-[13px] font-bold text-slate-950">
              {initials}
            </span>
            <span className="text-[12px] text-slate-200 font-medium">{state.profile.name}</span>
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useNexus();
  return (
    <div className="fixed right-4 top-16 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 rounded-xl border border-cyan-400/20 bg-[#0a1020]/95 p-3.5 backdrop-blur-xl shadow-glow-cyan animate-[slideIn_0.35s_cubic-bezier(0.16,1,0.3,1)]"
        >
          <span className="text-lg leading-none">{t.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white">{t.title}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{t.body}</div>
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-slate-500 hover:text-white">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-nexus-bg text-slate-200 font-sans selection:bg-cyan-400/30">
      <div className="pointer-events-none fixed inset-0 bg-grid-faint bg-[size:44px_44px] opacity-[0.5]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.07),transparent_55%)]" />
      <TopBar />
      <main className="relative mx-auto max-w-[1600px] px-5 pb-28 pt-6">{children}</main>
      <FloatingNav />
      <Toasts />
    </div>
  );
}

export function CompletionBanner() {
  return (
    <div className="flex items-center gap-2 text-emerald-300 text-xs">
      <CheckCircle2 size={13} /> Saved
    </div>
  );
}
