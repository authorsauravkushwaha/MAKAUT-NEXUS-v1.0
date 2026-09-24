/* ── MAKAUT NEXUS — shared domain types ─────────────────────────────── */

export type VerificationStatus = 'verified' | 'provisional' | 'pending' | 'unverified';
export type SourceType = 'primary' | 'secondary' | 'internal';
export type CourseKind = 'theory' | 'lab' | 'sessional';

/** Every academic fact in NEXUS carries provenance. */
export interface SourceRef {
  source_ref: string;
  source_type: SourceType;
  verification_status: VerificationStatus;
  checked: string;
}

export interface SourceEntry extends SourceRef {
  id: string;
  label: string;
  note?: string;
  url?: string | null;
}

export interface Concept {
  id: string;
  label: string;
}

export interface ModuleDef {
  id: string;
  index: string;
  title: string;
  hours: number;
  co: string;
  bloom: string;
  questions: number;
  concepts: Concept[];
}

export interface CourseDef extends SourceRef {
  id: string;
  code?: string;
  title: string;
  short: string;
  kind: CourseKind;
  credits: number;
  hours: number;
  color: string;
  glow: string;
  group?: string;
  description: string;
  outcomes?: string[];
  modules?: ModuleDef[];
  experiments?: LabExperimentDef[];
  requirement_pct?: number;
  items?: { id: string; label: string }[];
  target_pct?: number;
}

export interface LabExperimentDef {
  id: string;
  index: string;
  title: string;
  hours: number;
  record_required: boolean;
}

export interface SemesterDef extends SourceRef {
  id: string;
  index: number;
  label: string;
  year: string;
  academic_year: string;
  total_credits: number;
  credits_note: string;
  components_count: number;
  theoretical_hours?: number;
  courses: {
    id: string;
    kind: CourseKind;
    credits: number;
    hours: number;
    modules?: number;
    experiments?: number;
    note?: string;
  }[];
  status?: string;
}

/* ── Student state ──────────────────────────────────────────────────── */

export interface Profile {
  name: string;
  college: string;
  branch: string;
  year: string;
  semester: string;
  group: string;
  targetSgpa: number;
  dailyMinutes: number;
  examDate: string; // ISO date yyyy-mm-dd
}

export interface ModuleProgress {
  progressPct: number;
  concepts: Record<string, boolean>;
  questionsDone: number;
  questionsTotal: number;
  lastStudied: string | null; // ISO datetime | null
  sessions: number;
}

export type ExperimentStatus = 'not_started' | 'in_progress' | 'completed';
export type RecordStatus = 'pending' | 'done';

export interface ExperimentState {
  status: ExperimentStatus;
  record: RecordStatus;
  verified: boolean;
}

export interface MarksEntry {
  internal: number | '';
  ese: number | '';
}

export interface MissionItem {
  id: string;
  kind: 'study' | 'lab' | 'revision' | 'practice';
  courseId: string;
  moduleId?: string;
  labId?: string;
  experimentId?: string;
  label: string;
  sublabel: string;
  minutes: number;
}

export interface Mission {
  date: string;
  generatedAt: string;
  totalMinutes: number;
  items: MissionItem[];
  completedItemIds: string[];
}

export interface StreakState {
  current: number;
  longest: number;
  days: string[]; // ISO dates with study activity (most recent last)
  todayDone: boolean;
}

export interface NonTheoryState {
  attendance: boolean;
  participation: boolean;
}

export interface StudentState {
  version: number;
  onboarded: boolean;
  profile: Profile;
  /** courseId → moduleId → progress */
  moduleProgress: Record<string, Record<string, ModuleProgress>>;
  /** courseId → revision percent (0–100) */
  revision: Record<string, number>;
  /** labId → experimentId → state */
  labs: Record<string, Record<string, ExperimentState>>;
  nonTheory: NonTheoryState;
  skill: { moocPct: number };
  /** courseId → marks */
  marks: Record<string, MarksEntry>;
  streak: StreakState;
  achievements: string[];
  mission: Mission | null;
  studyMinutesToday: number;
  studyLog: { date: string; minutes: number }[];
}

/** Alias used by AI modules. */
export type StateLike = StudentState;

/* ── Derived analytics ──────────────────────────────────────────────── */

export interface CourseProgress {
  courseId: string;
  progressPct: number; // 0–100
  questionsDone: number;
  questionsTotal: number;
  modulesDone: number;
  modulesTotal: number;
}

export interface ReadinessBreakdown {
  syllabus: number;
  practice: number;
  labs: number;
  revision: number;
  readiness: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  emoji: string;
  blurb: string;
  /** returns progress 0–1 (1 = unlocked) */
  progress: (d: DeriveContext) => number;
}

export interface DeriveContext {
  state: StudentState;
  courses: CourseDef[];
  labs: CourseDef[];
  sessionals: CourseDef[];
}

/* ── AI ─────────────────────────────────────────────────────────────── */

export type ChatRole = 'student' | 'nexus';

export type ChatMessage =
  | { id: string; role: ChatRole; kind: 'text'; text: string; tag?: 'academic' | 'makaut' | 'system'; at: number }
  | { id: string; role: ChatRole; kind: 'mission'; at: number; mission: Mission }
  | { id: string; role: ChatRole; kind: 'summary'; at: number; summary: SemesterSummaryData }
  | { id: string; role: ChatRole; kind: 'plan'; at: number; plan: StudyPlan };

export interface SemesterSummaryData {
  credits: number;
  components: number;
  syllabus: number;
  practice: number;
  labs: number;
  revision: number;
  biggestGap: { courseId: string; courseTitle: string; moduleId: string; moduleTitle: string; progressPct: number };
  todayAction: { label: string; minutes: number };
  nextCheckpoint: { label: string; done: number; total: number };
}

export interface StudyPlanDay {
  day: number;
  date: string;
  phase: 'Foundation' | 'Coverage' | 'Revision + Practice';
  focus: string;
  tasks: { courseId: string; label: string; minutes: number }[];
  totalMinutes: number;
}

export interface StudyPlan {
  generatedAt: string;
  days: number;
  dailyMinutes: number;
  startCompletion: number;
  targetSgpa: number;
  weeks: { label: string; theme: string; days: StudyPlanDay[] }[];
}
