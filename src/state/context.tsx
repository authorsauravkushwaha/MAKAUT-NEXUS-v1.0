import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ExperimentState, Mission, Profile, StudentState } from '@/types';
import { createSeedState, createEmptyState } from '@/state/seed';
import { todayISO, addDays, computeStreak } from '@/lib/dates';
import { generateMission } from '@/lib/mission';
import { deriveContext } from '@/lib/derive';
import { evaluateAchievements, diffNewAchievements } from '@/lib/achievements';
import { levelFromXp, levelTitle, sessionXp, XP_REWARDS } from '@/lib/gamify';
import { loadCloudConfig, type CloudConfig } from '@/lib/cloud/config';
import {
  clearDirty, decideSync, fetchVault, lastSyncAt, loadSession, login, markDirty, pushVault,
  pullVault, refreshSession, register, restoreVault, signOut, backupLocalState,
  type AuthMethod, type Session, type UnlockedVault,
} from '@/lib/cloud/vault';

const STORAGE_KEY = 'makaut-nexus:v1';

export interface CloudView {
  status: 'loading' | 'disabled' | 'signedout' | 'signedin';
  email?: string;
  lastSync?: number;
  busy?: boolean;
  error?: string;
}

function loadState(): StudentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StudentState;
      if (parsed && parsed.version === 1 && parsed.profile) {
        // Keep the mission fresh for the current day.
        if (parsed.mission && parsed.mission.date !== todayISO()) parsed.mission = null;
        // Migrate states saved before the library feature existed.
        if (!parsed.library) parsed.library = { notesRead: [], dppSolved: [] };
        // Migrate states saved before the study-world XP system existed —
        // backfill from what the student already earned.
        if (typeof parsed.xp !== 'number') {
          parsed.xp =
            parsed.library.notesRead.length * 10 + parsed.library.dppSolved.length * 15;
        }
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
  markNoteRead: (noteId: string) => void;
  markDppSolved: (questionId: string) => void;
  /** Award study-world XP (streak touch + level-up toast handled internally). */
  awardXp: (amount: number, reason: string) => void;
  resetAll: () => void;
  loadDemo: () => void;
  /** Private Cloud (NEXUS ID) — zero-knowledge encrypted backup. */
  cloud: CloudView;
  cloudSignIn: (
    identifier: string,
    password: string,
    method: AuthMethod,
    opts?: { dial?: string; syncPat?: string },
  ) => Promise<{ ok: boolean; error?: string; pulled: boolean; note?: string }>;
  cloudSignUp: (
    identifier: string,
    password: string,
    method: AuthMethod,
    opts?: { dial?: string; syncPat?: string },
  ) => Promise<{ ok: boolean; error?: string; needsConfirm: boolean; note?: string }>;
  cloudSignOut: () => Promise<void>;
  cloudSyncNow: () => Promise<void>;
  exportBackup: () => void;
  importBackup: (file: File) => Promise<void>;
}

const NexusContext = createContext<NexusContextValue | null>(null);

let toastSeq = 0;

export function NexusProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudentState>(() => loadState());
  const [toasts, setToasts] = useState<Toast[]>([]);
  const stateRef = useRef(state);
  stateRef.current = state;

  /* ── Private Cloud refs (mutable, never re-render) ───────────── */
  const [cloud, setCloud] = useState<CloudView>({ status: 'loading' });
  const cfgRef = useRef<CloudConfig | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const vaultRef = useRef<UnlockedVault | null>(null);
  const pushTimerRef = useRef<number | undefined>(undefined);
  const initRanRef = useRef(false);
  const firstSaveRef = useRef(true);
  const suppressSyncRef = useRef(false);

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

  const doPush = useCallback(async () => {
    const cfg = cfgRef.current;
    const session = sessionRef.current;
    const vault = vaultRef.current;
    if (!cfg || !session || !vault) return;
    setCloud((c) => ({ ...c, busy: true, error: undefined }));
    try {
      await pushVault(cfg, session, vault, JSON.stringify(stateRef.current));
      setCloud((c) => ({ ...c, busy: false, status: 'signedin', lastSync: Date.now() }));
    } catch (e) {
      setCloud((c) => ({ ...c, busy: false, error: errMsg(e) }));
    }
  }, []);

  const doPull = useCallback(async () => {
    const cfg = cfgRef.current;
    const session = sessionRef.current;
    const vault = vaultRef.current;
    if (!cfg || !session || !vault) return false;
    setCloud((c) => ({ ...c, busy: true, error: undefined }));
    try {
      const json = await pullVault(cfg, session, vault);
      if (!json) {
        setCloud((c) => ({ ...c, busy: false }));
        return false;
      }
      const parsed = JSON.parse(json) as StudentState;
      if (!(parsed && parsed.version === 1 && parsed.profile)) throw new Error('Cloud backup is not a valid NEXUS state.');
      suppressSyncRef.current = true; // pull must not mark dirty / push back
      setState(parsed);
      setCloud((c) => ({ ...c, busy: false, status: 'signedin', lastSync: lastSyncAt() || Date.now() }));
      return true;
    } catch (e) {
      setCloud((c) => ({ ...c, busy: false, error: errMsg(e) }));
      return false;
    }
  }, []);

  const schedulePush = useCallback(() => {
    if (!sessionRef.current || !vaultRef.current || !cfgRef.current) return;
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    pushTimerRef.current = window.setTimeout(() => void doPush(), 2500);
  }, [doPush]);

  const reconcile = useCallback(async (): Promise<'pushed' | 'pulled' | 'skipped'> => {
    const cfg = cfgRef.current;
    const session = sessionRef.current;
    const vault = vaultRef.current;
    if (!cfg || !session || !vault) return 'skipped';
    try {
      const row = await fetchVault(cfg, session);
      if (decideSync(row) === 'push') {
        await doPush();
        return 'pushed';
      }
      await doPull();
      return 'pulled';
    } catch (e) {
      setCloud((c) => ({ ...c, error: errMsg(e) }));
      return 'skipped';
    }
  }, [doPush, doPull]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota — ignore */
    }
    // First run is the initial hydration (not a user change); a pull is flagged
    // so it never bounces straight back up as a "newer" local write.
    if (firstSaveRef.current) {
      firstSaveRef.current = false;
      return;
    }
    if (suppressSyncRef.current) {
      suppressSyncRef.current = false;
      return;
    }
    markDirty();
    schedulePush();
  }, [state, schedulePush]);

  /* Restore an existing session on boot and reconcile cloud vs device. */
  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;
    void (async () => {
      try {
        const cfg = await loadCloudConfig();
        if (!cfg) {
          setCloud({ status: 'disabled' });
          return;
        }
        cfgRef.current = cfg;
        let session = loadSession();
        if (!session) {
          setCloud({ status: 'signedout' });
          return;
        }
        if (Date.now() > session.expiresAt - 60_000) {
          session = await refreshSession(cfg);
          if (!session) {
            setCloud({ status: 'signedout' });
            return;
          }
        }
        const vault = await restoreVault(session.userId);
        if (!vault) {
          localStorage.removeItem('nexus:session');
          setCloud({ status: 'signedout', error: 'Session expired — sign in again to unlock your vault.' });
          return;
        }
        sessionRef.current = session;
        vaultRef.current = vault;
        setCloud({ status: 'signedin', email: session.email, lastSync: lastSyncAt() || undefined });
        await reconcile();
      } catch (e) {
        setCloud({ status: 'signedout', error: errMsg(e) });
      }
    })();
  }, [reconcile]);

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

  /** Study-world XP: bumps xp, touches today's streak, celebrates level-ups. */
  const awardXp = useCallback(
    (amount: number, reason: string) => {
      if (amount <= 0) return;
      const preXp = stateRef.current.xp ?? 0;
      const preLevel = levelFromXp(preXp);
      const postLevel = levelFromXp(preXp + amount);
      commit((prev) => {
        const today = todayISO();
        const days = prev.streak.days.includes(today) ? prev.streak.days : [...prev.streak.days, today];
        const current = computeStreak(days, today);
        return {
          ...prev,
          xp: (prev.xp ?? 0) + amount,
          streak: {
            ...prev.streak,
            days,
            current,
            longest: Math.max(prev.streak.longest, current),
            todayDone: true,
          },
        };
      });
      if (postLevel > preLevel) {
        setTimeout(
          () =>
            pushToast({
              emoji: '🚀',
              title: `Level ${postLevel} — ${levelTitle(postLevel)}!`,
              body: `+${amount} XP · ${reason}. The library world grows with you — keep going.`,
            }),
          350,
        );
      }
    },
    [commit, pushToast],
  );

  const markNoteRead = useCallback(
    (noteId: string) => {
      if (stateRef.current.library.notesRead.includes(noteId)) return;
      commit((prev) =>
        prev.library.notesRead.includes(noteId)
          ? prev
          : { ...prev, library: { ...prev.library, notesRead: [...prev.library.notesRead, noteId] } },
      );
      awardXp(XP_REWARDS.noteRead, 'Note read');
    },
    [commit, awardXp],
  );

  const markDppSolved = useCallback(
    (questionId: string) => {
      if (stateRef.current.library.dppSolved.includes(questionId)) return;
      commit((prev) =>
        prev.library.dppSolved.includes(questionId)
          ? prev
          : { ...prev, library: { ...prev.library, dppSolved: [...prev.library.dppSolved, questionId] } },
      );
      awardXp(XP_REWARDS.dppSolved, 'DPP problem solved');
    },
    [commit, awardXp],
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
      awardXp(sessionXp(input.minutes), input.kind === 'practice' ? 'Practice set' : 'Study session');
    },
    [commit, logStudy, awardXp],
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
      awardXp(XP_REWARDS.missionItem, 'Mission task');
    },
    [addSession, commit, logStudy, awardXp],
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

  /* ── Private Cloud actions ─────────────────────────────────────── */

  const cloudSignIn = useCallback(
    async (
      identifier: string,
      password: string,
      method: AuthMethod,
      opts?: { dial?: string; syncPat?: string },
    ) => {
      setCloud((c) => ({ ...c, busy: true, error: undefined }));
      const cfg = await loadCloudConfig();
      if (!cfg) {
        setCloud({ status: 'disabled' });
        return { ok: false, error: 'The repository database is not configured yet.', pulled: false };
      }
      cfgRef.current = cfg;
      const r = await login(cfg, { identifier, password, method, ...opts });
      if (!r.ok) {
        setCloud((c) => ({ ...c, busy: false, error: r.error }));
        return { ok: false, error: r.error, pulled: false };
      }
      sessionRef.current = r.session;
      vaultRef.current = r.vault;
      setCloud({ status: 'signedin', email: r.session.email, busy: true, lastSync: lastSyncAt() || undefined });
      let pulled = false;
      try {
        if (decideSync(r.remote) === 'pull' && r.remote) pulled = await doPull();
        else await doPush();
      } catch (e) {
        setCloud((c) => ({ ...c, error: errMsg(e) }));
      }
      setCloud((c) => ({ ...c, busy: false, lastSync: lastSyncAt() || c.lastSync }));
      if (pulled) pushToast({ emoji: '☁️', title: 'Cloud data restored', body: 'Your vault from another device is now active here.' });
      else pushToast({ emoji: '🔐', title: 'Signed in', body: 'Progress is encrypted and safe on this device.' });
      return { ok: true, pulled, note: r.note };
    },
    [doPull, doPush, pushToast],
  );

  const cloudSignUp = useCallback(
    async (
      identifier: string,
      password: string,
      method: AuthMethod,
      opts?: { dial?: string; syncPat?: string },
    ) => {
      setCloud((c) => ({ ...c, busy: true, error: undefined }));
      const cfg = await loadCloudConfig();
      if (!cfg) {
        setCloud({ status: 'disabled' });
        return { ok: false, error: 'The repository database is not configured yet.', needsConfirm: false };
      }
      cfgRef.current = cfg;
      const r = await register(cfg, { identifier, password, method, ...opts });
      if (!r.ok) {
        setCloud((c) => ({ ...c, busy: false, error: r.error }));
        return { ok: false, error: r.error, needsConfirm: false };
      }
      if (r.needsConfirm) {
        setCloud({ status: 'signedout' });
        return { ok: true, needsConfirm: true };
      }
      sessionRef.current = r.session;
      vaultRef.current = r.vault;
      setCloud({ status: 'signedin', email: r.session.email, busy: true });
      await doPush(); // seal current device progress into the new vault
      pushToast({ emoji: '🛰️', title: 'Vault created', body: 'Your progress is encrypted and safe on this device.' });
      return { ok: true, needsConfirm: false, note: r.note };
    },
    [doPush, pushToast],
  );

  const cloudSignOut = useCallback(async () => {
    const cfg = cfgRef.current;
    if (pushTimerRef.current) window.clearTimeout(pushTimerRef.current);
    if (cfg) await signOut(cfg);
    sessionRef.current = null;
    vaultRef.current = null;
    clearDirty();
    setCloud({ status: 'signedout' });
    pushToast({ emoji: '🔓', title: 'Signed out', body: 'Vault locked. Your data stays safe on this device.' });
  }, [pushToast]);

  const cloudSyncNow = useCallback(async () => {
    const out = await reconcile();
    if (out === 'pushed') pushToast({ emoji: '💾', title: 'Saved', body: 'Latest progress encrypted on this device.' });
    else if (out === 'pulled') pushToast({ emoji: '📥', title: 'Restored', body: 'Cloud vault applied to this device.' });
    else pushToast({ emoji: '😴', title: 'Nothing to sync', body: 'Device and cloud already match.' });
  }, [reconcile, pushToast]);

  const exportBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(stateRef.current, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast({ emoji: '💾', title: 'Backup exported', body: 'A full JSON copy was downloaded.' });
  }, [pushToast]);

  const importBackup = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as StudentState;
        if (!(parsed && parsed.version === 1 && parsed.profile)) throw new Error('Not a valid NEXUS backup file.');
        backupLocalState();
        setState(parsed);
        pushToast({ emoji: '📥', title: 'Backup imported', body: 'Your state was restored from the file.' });
      } catch (e) {
        pushToast({ emoji: '⚠️', title: 'Import failed', body: errMsg(e) });
      }
    },
    [pushToast],
  );

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
      markNoteRead,
      markDppSolved,
      awardXp,
      resetAll,
      loadDemo,
      cloud,
      cloudSignIn,
      cloudSignUp,
      cloudSignOut,
      cloudSyncNow,
      exportBackup,
      importBackup,
    }),
    [
      state, toasts, dismissToast, commit, startOnboarding, updateProfile, ensureMission,
      completeMissionItem, completeMissionAll, addSession, setConcept, setLabExperiment,
      markExperimentComplete, setMarks, resetMarks, setNonTheory, setMooc, logStudy, markNoteRead, markDppSolved, awardXp, resetAll, loadDemo,
      cloud, cloudSignIn, cloudSignUp, cloudSignOut, cloudSyncNow, exportBackup, importBackup,
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
