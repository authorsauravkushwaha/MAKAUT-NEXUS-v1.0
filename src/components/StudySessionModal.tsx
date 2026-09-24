import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, CheckCircle2, X, Timer } from 'lucide-react';
import { useNexus } from '@/state/context';
import { GlassPanel, Button, cn } from '@/components/ui';

export interface SessionRequest {
  courseId: string;
  moduleId?: string;
  title: string;
  subtitle: string;
  minutes: number;
  kind?: 'study' | 'revision' | 'practice';
  missionItemId?: string;
}

/** Countdown focus timer that credits progress on completion. */
export function StudySessionModal({ request, onClose }: { request: SessionRequest | null; onClose: () => void }) {
  const { addSession, completeMissionItem } = useNexus();
  const [left, setLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    if (request) {
      setLeft(request.minutes * 60);
      setRunning(true);
      doneRef.current = false;
    }
  }, [request]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) {
          clearInterval(t);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  const finish = () => {
    if (!request || doneRef.current) return;
    doneRef.current = true;
    const studied = Math.max(5, Math.round((request.minutes * 60 - left) / 60));
    addSession({ courseId: request.courseId, moduleId: request.moduleId, minutes: Math.min(request.minutes, Math.max(studied, Math.floor(request.minutes / 2))), kind: request.kind });
    if (request.missionItemId) completeMissionItem(request.missionItemId);
    onClose();
  };

  useEffect(() => {
    if (left === 0 && request && running) {
      setRunning(false);
      finish();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const total = request ? request.minutes * 60 : 1;
  const pct = request ? ((total - left) / total) * 100 : 0;

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#04060d]/85 p-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, y: 18 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassPanel className="overflow-hidden p-7 text-center" glow="#22d3ee">
              <div className="flex items-start justify-between text-left">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-cyan-400">Session active</div>
                  <div className="mt-1 font-display text-lg font-bold text-white">{request.title}</div>
                  <div className="text-[13px] text-slate-400">{request.subtitle}</div>
                </div>
                <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="relative mx-auto mt-7 flex h-44 w-44 items-center justify-center">
                <svg className="absolute -rotate-90" width="176" height="176">
                  <circle cx="88" cy="88" r="80" stroke="rgba(148,163,184,0.15)" strokeWidth="7" fill="none" />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="#22d3ee"
                    strokeWidth="7"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - pct / 100)}
                    style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 8px #22d3ee)' }}
                  />
                </svg>
                <div>
                  <div className="font-mono text-4xl font-bold text-white">
                    {mm}:{ss}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">{running ? 'In focus' : 'Paused'}</div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-center gap-3">
                <Button variant="ghost" onClick={() => setRunning((r) => !r)} className={cn(!running && 'border-cyan-400/40 text-cyan-300')}>
                  {running ? <Pause size={15} /> : <Play size={15} />} {running ? 'Pause' : 'Resume'}
                </Button>
                <Button onClick={finish}>
                  <CheckCircle2 size={15} /> Mark complete
                </Button>
              </div>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <Timer size={12} /> Completing credits progress, practice questions and today's streak.
              </p>
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
