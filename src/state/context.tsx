import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ExperimentState, Mission, Profile, StudentState } from '@/types';
import { createSeedState, createEmptyState } from '@/state/seed';
import { todayISO, addDays, computeStreak } from '@/lib/dates';
import { generateMission } from '@/lib/mission';
import { deriveContext } from '@/lib/derive';
import { evaluateAchievements, diffNewAchievements } from '@/lib/achievements';

const STORAGE_KEY = 'makaut-nexus:v1';

function loadState(): StudentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentState;
      if (parsed && parsed.version === 1 && parsed.profile) {
        // Keep the mission fresh for the current day.
        if (parsed.mission && parsed.mission.date !== todayISO()) parsed.mission = null;
        return parsed;
      }
    }
  } catch {
    /* fall through to seed */
  }
  return createSeedState();
}

interface Toast {
  id: number;
  emoji: string;
  title: string;
  body: string;
}

interface NexusContextValue {
  state: StudentState;
  toasts: Toast[];
  dismissToast: (id: number) => void;
  /** applies a state transition, then re-evaluates achievements */
  commit: (next: StudentState | ((prev: StudentState) => StudentState)) => void;
  startOnboarding: (profile: Profile) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  ensureMission: () => Mission;
  completeMissionItem: (itemId: string) => void;
  completeMissionAll: () => void;
  addSession: (input: { courseId: string; moduleId?: string; minutes: number; kind?: 'study' | 'revision' | 'practice' }) => void;
  setConcept: (courseId: string, moduleId: string, conceptId: string, done: boolean) => void;
  setLabExperiment: (labId: string, expId: string, patch: Partial<ExperimentState>) => void;
  markExperimentComplete: (labId: string, expId: string) => void;
  setMarks: (courseId: string, internal: number | '', ese: number | '') => void;
  resetMarks: () => void;
  setNonTheory: (patch: Partial<StudentState['nonTheory']>) => void;
  setMooc: (pct: number) => void;
  logStudy: (minutes: number) => void;
  resetAll: () => void;
  loadDemo: () => void;
}

const NexusContext = createContext<NexusContextValue | null>(null);

let toastSeq = 0;

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudentState>(() => loadState());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore */
    }
  }, [state]);

  const pushToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);

  const dismissToast = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), []);

  const commit = useCallback(
    (next: StudentState | ((prev: StudentState) => StudentState)) => {
      setState((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: StudentState) => StudentState)(prev) : next;
        const before = prev.achievements;
        const after = evaluateAchievements(deriveContext(resolved));
        const fresh = diffNewAchievements(before, after.unlocked);
        if (fresh.length) {
          setTimeout(() => {
            for (const id of fresh) {
              const a = ACH_MAP[id];
              if (a) pushToast({ emoji: a[0], title: `Achievement unlocked — ${a[1]}`, body: a[2] });
            }
          }, 300);
          return { ...resolved, achievements: [...new Set([...before, ...fresh])] };
        }
        return resolved;
      });
    },
    [pushToast],
  );

  const startOnboarding = useCallback(
    (profile: Profile) => {
      const fresh = createEmptyState(profile);
      setState(fresh);
      setTimeout(() => pushToast({ emoji: '🚀', title: 'Academic core generated', body: 'Your Semester-1 universe is online.' }), 600);
    },
    [pushToast],
  );

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    commit((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, [commit]);

  const ensureMission = useCallback((): Mission => {
    const cur = stateRef.current;
    if (cur.mission && cur.mission.date === todayISO()) return cur.mission;
    const mission = generateMission(cur);
    commit((prev) => ({ ...prev, mission }));
    return mission;
  }, [commit]);

  const logStudy = useCallback(
    (minutes: number) => {
      commit((prev) => {
        const today = todayISO();
        const days = prev.streak.days.includes(today) ? prev.streak.days : [...prev.streak.days, today];
        // recompute consecutive streak ending today — Sunday is an optional rest day
        const current = computeStreak(days, today);
        const log = [...prev.studyLog];
        const idx = log.findIndex((l) => l.date === today);
        if (idx >= 0) log[idx] = { date: today, minutes: log[idx].minutes + minutes };
        else log.push({ date: today, minutes });
        return {
          ...prev,
          streak: { ...prev.streak, days, current, longest: Math.max(prev.streak.longest, current), todayDone: true },
          studyMinutesToday: prev.studyMinutesToday + minutes,
          studyLog: log.slice(-30),
        };
      });
    },
    [commit],
  );

  const addSession = useCallback(
    (input: { courseId: string; moduleId?: string; minutes: number; kind?: 'study' | 'revision' | 'practice' }) => {
      commit((prev) => {
        const next: StudentState = JSON.parse(JSON.stringify(prev));
        const mod = input.moduleId ? next.moduleProgress[input.courseId]?.[input.moduleId] : undefined;
        if (mod) {
          const hours = 8;
          const gain = Math.min(14, ((input.minutes / 60) / hours) * 100 * 0.9);
          mod.progressPct = Math.min(100, Math.round((mod.progressPct + gain) * 10) / 10);
          mod.sessions += 1;
          mod.lastStudied = new Date().toISOString();
          // auto-check the next concept so the checklist reflects reality
          const entries = Object.entries(mod.concepts);
          const nextUnchecked = entries.find(([, v]) => !v);
          if (nextUnchecked && input.minutes >= 30) mod.concepts[nextUnchecked[0]] = true;
          // practice credit
          const addQ = input.kind === 'practice' ? Math.max(2, Math.round(input.minutes / 12)) : input.minutes >= 25 ? 2 : 1;
          mod.questionsDone = Math.min(mod.questionsTotal, mod.questionsDone + addQ);
        }
        if (input.kind === 'revision') {
          next.revision[input.courseId] = Math.min(100, (next.revision[input.courseId] ?? 0) + Math.round(input.minutes / 2));
        } else if (input.courseId in next.revision) {
          next.revision[input.courseId] = Math.min(100, (next.revision[input.courseId] ?? 0) + Math.round(input.minutes / 8));
        }
        return next;
      });
      logStudy(input.minutes);
    },
    [commit, logStudy],
  );

  const completeMissionItem = useCallback(
    (itemId: string) => {
      const cur = stateRef.current;
      const mission = cur.mission;
      if (!mission || mission.date !== todayISO()) return;
      const item = mission.items.find((i) => i.id === itemId);
      if (!item || mission.completedItemIds.includes(itemId)) return;

      if (item.kind === 'lab' && item.labId && item.experimentId) {
        commit((prev) => {
          const next = JSON.parse(JSON.stringify(prev)) as StudentState;
          const st = next.labs[item.labId!]?.[item.experimentId!];
          if (st) {
            if (st.record !== 'done') st.record = 'done';
            else st.status = 'completed';
            if (st.status === 'completed' && st.record === 'done') st.verified = true;
          }
          next.mission = {
            ...prev.mission!,
            completedItemIds: [...prev.mission!.completedItemIds, itemId],
          };
          return next;
        });
        logStudy(item.minutes);
      } else {
        addSession({
          courseId: item.courseId,
          moduleId: item.moduleId,
          minutes: item.minutes,
          kind: item.kind === 'revision' ? 'revision' : 'study',
        });
        commit((prev) => ({
          ...prev,
          mission: { ...prev.mission!, completedItemIds: [...prev.mission!.completedItemIds, itemId] },
        }));
      }
    },
    [addSession, commit, logStudy],
  );

  const completeMissionAll = useCallback(() => {
    const m = stateRef.current.mission;
    if (!m) return;
    for (const item of m.items) completeMissionItem(item.id);
  }, [completeMissionItem]);

  const setConcept = useCallback(
    (courseId: string, moduleId: string, conceptId: string, done: boolean) => {
      commit((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as StudentState;
        const mod = next.moduleProgress[courseId]?.[moduleId];
        if (!mod) return prev;
        mod.concepts[conceptId] = done;
        const total = Object.keys(mod.concepts).length || 1;
        const delta = (100 / total) * 0.5;
        mod.progressPct = Math.max(0, Math.min(100, Math.round((mod.progressPct + (done ? delta : -delta)) * 10) / 10));
        return next;
      });
    },
    [commit],
  );

  const setLabExperiment = useCallback(
    (labId: string, expId: string, patch: Partial<ExperimentState>) => {
      commit((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as StudentState;
        const st = next.labs[labId]?.[expId];
        if (!st) return prev;
        Object.assign(st, patch);
        if (patch.record === 'done' && st.status === 'completed') st.verified = true;
        return next;
      });
    },
    [commit],
  );

  const markExperimentComplete = useCallback(
    (labId: string, expId: string) => {
      commit((prev) => {
        const next = JSON.parse(JSON.stringify(prev)) as StudentState;
        const st = next.labs[labId]?.[expId];
        if (!st) return prev;
        if (st.status !== 'completed') {
          st.status = 'completed';
          st.record = 'done';
          st.verified = true;
        } else if (st.record !== 'done') {
          st.record = 'done';
        } else {
          st.verified = true;
        }
        return next;
      });
      logStudy(30);
    },
    [commit, logStudy],
  );

  const setMarks = useCallback(
    (courseId: string, internal: number | '', ese: number | '') => {
      commit((prev) => ({ ...prev, marks: { ...prev.marks, [courseId]: { internal, ese } } }));
    },
    [commit],
  );

  const resetMarks = useCallback(() => {
    setState((prev) => ({ ...prev, marks: {} }));
  }, []);

  const setNonTheory = useCallback(
    (patch: Partial<StudentState['nonTheory']>) => {
      commit((prev) => ({ ...prev, nonTheory: { ...prev.nonTheory, ...patch } }));
    },
    [commit],
  );

  const setMooc = useCallback((pct: number) => {
    setState((prev) => ({ ...prev, skill: { moocPct: Math.max(0, Math.min(100, Math.round(pct))) } }));
  }, []);

  const resetAll = useCallback(() => {
    const empty = createEmptyState({
      name: 'Cadet',
      college: 'CEMK',
      branch: 'CSE',
      year: '1st Year',
      semester: 'Semester 1',
      group: 'Group A',
      targetSgpa: 8.5,
      dailyMinutes: 180,
      examDate: addDays(todayISO(), 18),
    });
    setState({ ...empty, onboarded: false });
  }, []);

  const loadDemo = useCallback(() => {
    setState(createSeedState());
    pushToast({ emoji: '🛰️', title: 'Demo pilot loaded', body: "Saurav's CEMK state restored." });
  }, [pushToast]);

  const value = useMemo<NexusContextValue>(
    () => ({
      state,
      toasts,
      dismissToast,
      commit,
      startOnboarding,
      updateProfile,
      ensureMission,
      completeMissionItem,
      completeMissionAll,
      addSession,
      setConcept,
      setLabExperiment,
      markExperimentComplete,
      setMarks,
      resetMarks,
      setNonTheory,
      setMooc,
      logStudy,
      resetAll,
      loadDemo,
    }),
    [
      state, toasts, dismissToast, commit, startOnboarding, updateProfile, ensureMission,
      completeMissionItem, completeMissionAll, addSession, setConcept, setLabExperiment,
      markExperimentComplete, setMarks, resetMarks, setNonTheory, setMooc, logStudy, resetAll, loadDemo,
    ],
  );

  return <NexusContext.Provider value={value}>{children}</NexusContext.Provider>;
}

const ACH_MAP: Record<string, [string, string, string]> = {
  'core-builder': ['🚀', 'Core Builder', 'Your academic core is online.'],
  'concept-master': ['🧠', 'Concept Master', 'Five modules completed.'],
  'lab-ready': ['🧪', 'Lab Ready', 'All current lab records complete.'],
  'syllabus-zero': ['📚', 'Syllabus Zero', 'You finished the syllabus.'],
  'seven-day-scholar': ['🔥', '7-Day Scholar', 'Seven consecutive study days.'],
  'target-locked': ['🎯', 'Target Locked', 'Readiness crossed 85%.'],
};

export function useNexus(): NexusContextValue {
  const ctx = useContext(NexusContext);
  if (!ctx) throw new Error('useNexus must be used inside NexusProvider');
  return ctx;
}
