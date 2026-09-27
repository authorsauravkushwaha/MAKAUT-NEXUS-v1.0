import { LIBRARY, LIBRARY_MAP, FREE_BOOKS, COURSE_MAP, THEORY_COURSES } from '@/data';
import { QUESTIONS } from '@/ai/questionBank';
import type { StudentState, SubjectLibrary, ChapterNote, Dpp, SubjectChapterLibrary } from '@/types';

export interface ChapterLibrary extends SubjectChapterLibrary {
  subjectId: string;
  questionIds: string[];
}

export function getSubjectLibrary(subjectId: string): SubjectLibrary | undefined {
  return LIBRARY_MAP[subjectId];
}

export function getChapterLibrary(subjectId: string, moduleId: string): ChapterLibrary | undefined {
  const lib = LIBRARY_MAP[subjectId];
  const chapter = lib?.chapters.find((c) => c.moduleId === moduleId);
  if (!chapter) return undefined;
  const questionIds = QUESTIONS.filter((q) => q.courseId === subjectId && q.moduleId === moduleId).map((q) => q.id);
  return { ...chapter, subjectId, questionIds };
}

export function booksForSubject(subjectId?: string): typeof FREE_BOOKS {
  if (!subjectId) return FREE_BOOKS;
  return FREE_BOOKS.filter((b) => b.subjects.includes(subjectId));
}

export interface LibraryVideo {
  subjectId: string;
  subject: string;
  color: string;
  moduleId: string;
  chapter: string;
  note: ChapterNote;
  url: string;
  /** Human label derived from the video search/source, when available. */
  label: string;
}

function videoLabel(url: string): string {
  try {
    const u = new URL(url);
    const q = u.searchParams.get('search_query') ?? u.searchParams.get('q');
    if (q) return q.trim();
  } catch {
    /* fall through */
  }
  return 'Chapter video';
}

/** Every free lecture video shipped with a chapter note (deduped by URL). */
export function libraryVideos(): LibraryVideo[] {
  const out: LibraryVideo[] = [];
  const seen = new Set<string>();
  for (const course of THEORY_COURSES) {
    const lib = LIBRARY_MAP[course.id];
    if (!lib) continue;
    for (const ch of lib.chapters) {
      const mod = COURSE_MAP[course.id]?.modules?.find((m) => m.id === ch.moduleId);
      for (const n of ch.notes) {
        for (const r of n.resources ?? []) {
          if (r.kind !== 'video' || !r.url || seen.has(r.url)) continue;
          seen.add(r.url);
          out.push({
            subjectId: course.id,
            subject: course.title,
            color: course.color ?? '#22d3ee',
            moduleId: ch.moduleId,
            chapter: mod?.title ?? ch.moduleId,
            note: n,
            url: r.url,
            label: videoLabel(r.url),
          });
        }
      }
    }
  }
  return out;
}

export function libraryVideoCount(): number {
  return libraryVideos().length;
}

export interface LibraryTotals {
  subjects: number;
  chapters: number;
  notes: number;
  dppProblems: number;
  books: number;
  bankQuestions: number;
}

export function libraryTotals(): LibraryTotals {
  let chapters = 0;
  let notes = 0;
  let dppProblems = 0;
  for (const lib of LIBRARY) {
    chapters += lib.chapters.length;
    for (const c of lib.chapters) {
      notes += c.notes.length;
      for (const d of c.dpps) dppProblems += d.questions.length;
    }
  }
  return {
    subjects: LIBRARY.length,
    chapters,
    notes,
    dppProblems,
    books: FREE_BOOKS.length,
    bankQuestions: QUESTIONS.length,
  };
}

export interface SubjectLibraryStats {
  subjectId: string;
  chapters: number;
  notes: number;
  dppProblems: number;
  read: number;
  solved: number;
  /** 0–100 combined read+solve progress */
  progressPct: number;
}

export function subjectLibraryStats(state: StudentState, subjectId: string): SubjectLibraryStats {
  const lib = LIBRARY_MAP[subjectId];
  let notes = 0;
  let dppProblems = 0;
  let read = 0;
  let solved = 0;
  for (const c of lib?.chapters ?? []) {
    notes += c.notes.length;
    for (const n of c.notes) if (state.library.notesRead.includes(n.id)) read++;
    for (const d of c.dpps)
      for (const q of d.questions) {
        dppProblems++;
        if (state.library.dppSolved.includes(q.id)) solved++;
      }
  }
  const total = notes + dppProblems;
  return {
    subjectId,
    chapters: lib?.chapters.length ?? 0,
    notes,
    dppProblems,
    read,
    solved,
    progressPct: total ? Math.round(((read + solved) / total) * 100) : 0,
  };
}

export function libraryProgress(state: StudentState): { read: number; solved: number; total: number; pct: number } {
  const t = libraryTotals();
  const read = state.library.notesRead.length;
  const solved = state.library.dppSolved.length;
  const total = t.notes + t.dppProblems;
  return { read, solved, total, pct: total ? Math.round(((read + solved) / total) * 100) : 0 };
}

export function noteIsRead(state: StudentState, note: ChapterNote): boolean {
  return state.library.notesRead.includes(note.id);
}

export function dppQuestionSolved(state: StudentState, questionId: string): boolean {
  return state.library.dppSolved.includes(questionId);
}

export function dppSolvedCount(state: StudentState, dpp: Dpp): number {
  return dpp.questions.filter((q) => state.library.dppSolved.includes(q.id)).length;
}

/** Subjects that ship with library content, in syllabus order, with course labels. */
export function librarySubjects(): { id: string; title: string; short: string; color: string; credits?: number; hours?: number }[] {
  return THEORY_COURSES.filter((c) => LIBRARY_MAP[c.id]).map((c) => ({
    id: c.id,
    title: c.title,
    short: c.short,
    color: c.color ?? '#22d3ee',
    credits: c.credits,
    hours: c.hours,
  }));
}
