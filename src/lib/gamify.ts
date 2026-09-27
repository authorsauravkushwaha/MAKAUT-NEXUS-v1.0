/* ── Study-world gamification: XP, levels, progress ───────────────────
 * Level curve: level n starts at 80·(n−1)² XP → fast early wins,
 * then a steady climb. Every academic action awards XP (see context). */

export function levelFromXp(xp: number): number {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 80));
}

export function xpForLevel(level: number): number {
  return 80 * (level - 1) * (level - 1);
}

export interface LevelProgress {
  level: number;
  /** XP accumulated inside the current level */
  into: number;
  /** XP needed to finish the current level */
  need: number;
  /** 0–100 progress to next level */
  pct: number;
  /** XP still required for the next level */
  toNext: number;
  nextLevelAt: number;
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const nextLevelAt = xpForLevel(level + 1);
  const span = Math.max(1, nextLevelAt - base);
  const into = Math.max(0, xp - base);
  return {
    level,
    into,
    need: span,
    pct: Math.min(100, Math.round((into / span) * 100)),
    toNext: Math.max(0, nextLevelAt - xp),
    nextLevelAt,
  };
}

export const XP_REWARDS = {
  noteRead: 10,
  dppSolved: 15,
  missionItem: 10,
  sessionMin: 0.5, // ½ XP per study minute, clamped 5–30
} as const;

export function sessionXp(minutes: number): number {
  return Math.max(5, Math.min(30, Math.round(minutes * XP_REWARDS.sessionMin)));
}

/** Fun rank titles per level band — shown on the level pill & dashboard. */
export function levelTitle(level: number): string {
  if (level >= 15) return 'NEXUS Legend';
  if (level >= 11) return 'Semester Titan';
  if (level >= 8) return 'Knowledge Rider';
  if (level >= 5) return 'Note Navigator';
  if (level >= 3) return 'Book Explorer';
  return 'Fresh Scholar';
}
