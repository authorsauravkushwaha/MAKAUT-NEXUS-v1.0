import type { CourseDef, SemesterDef, SourceEntry } from '@/types';

import semester1 from '@data/makaut/semester_1.json';
import semester2 from '@data/makaut/semester_2.json';
import sourcesJson from '@data/makaut/sources.json';
import groupsJson from '@data/makaut/groups.json';
import universityJson from '@data/makaut/university.json';
import academicYearJson from '@data/makaut/academic_year_2026_27.json';

import mathematics1 from '@data/courses/mathematics_1.json';
import physics from '@data/courses/physics.json';
import beee from '@data/courses/beee.json';
import english from '@data/courses/english.json';
import graphics from '@data/courses/graphics.json';
import physicsLab from '@data/courses/physics_lab.json';
import beeeLab from '@data/courses/beee_lab.json';
import graphicsLab from '@data/courses/graphics_lab.json';
import nonTheory from '@data/courses/non_theory.json';
import skillCourse from '@data/courses/skill_course.json';

export const UNIVERSITY = universityJson;
export const ACADEMIC_YEAR = academicYearJson;
export const SOURCES: SourceEntry[] = sourcesJson as SourceEntry[];
export const GROUPS = groupsJson;
export const SEMESTER_1 = semester1 as unknown as SemesterDef;
export const SEMESTER_2 = semester2 as unknown as SemesterDef;

export const THEORY_COURSES = [
  mathematics1,
  physics,
  beee,
  english,
  graphics,
] as unknown as CourseDef[];

export const LAB_COURSES = [physicsLab, beeeLab, graphicsLab] as unknown as CourseDef[];

export const SESSIONAL_COURSES = [nonTheory, skillCourse] as unknown as CourseDef[];

export const ALL_COURSES: CourseDef[] = [
  ...THEORY_COURSES,
  ...LAB_COURSES,
  ...SESSIONAL_COURSES,
];

export const COURSE_MAP: Record<string, CourseDef> = Object.fromEntries(
  ALL_COURSES.map((c) => [c.id, c]),
);

export const SOURCE_MAP: Record<string, SourceEntry> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
);

export function getCourse(id: string): CourseDef | undefined {
  return COURSE_MAP[id];
}

export function sourceOf(fact: { source_ref: string; source_type: string; verification_status: string; checked: string }) {
  const src = SOURCE_MAP[fact.source_ref];
  return {
    label: src?.label ?? fact.source_ref,
    source_type: fact.source_type,
    verification_status: fact.verification_status,
    checked: fact.checked,
    note: src?.note,
  };
}
