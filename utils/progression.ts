/*
 * ========================================
 * GYMATE TRAINER PROGRESSION
 * ========================================
 *
 * Trainer Level is calculated entirely from
 * total XP.
 *
 * We DO NOT store trainer level in SQLite.
 *
 * SQLite stores:
 *
 *   total_xp
 *
 * This utility calculates:
 *
 *   level
 *   XP required
 *   XP progress
 *   XP remaining
 *
 * ========================================
 * SINGLE SOURCE OF TRUTH
 * ========================================
 *
 * There used to be TWO different Trainer
 * Level formulas in this codebase:
 *
 *   1. database/progressionRepository.ts
 *      -> flat 500 XP per level
 *         (0 XP = Level 0, 500 XP = Level 1, ...)
 *
 *   2. This file (utils/progression.ts)
 *      -> a hand-tuned non-linear curve
 *
 * app/(tabs)/profile.tsx (the actual
 * "TRAINER LEVEL" UI the user sees) has
 * always used #1, via getXPProgress()
 * re-exported from services/xpService.ts.
 *
 * This file has been reconciled to also
 * use the flat 500 XP/level formula, so
 * that award results (previousLevel,
 * currentLevel, didLevelUp) returned by
 * services/xpService.ts agree with what
 * the Trainer Level UI displays.
 *
 * This matters because the Pokémon system's
 * Pokéball Shard rewards key off level-up
 * events reported by xpService. Shards must
 * always agree with the level the user sees
 * on their profile.
 *
 * The math itself now simply delegates to
 * database/progressionRepository.ts so there
 * is exactly one implementation of "what
 * level is this XP total".
 *
 * ========================================
 */

import {
  XP_PER_LEVEL,
  calculateTrainerLevel,
  getXPForLevel as repositoryGetXPForLevel,
} from '../database/progressionRepository';

/*
 * ========================================
 * PROGRESSION TYPE
 * ========================================
 */

export type TrainerProgression = {
  level: number;

  totalXP: number;

  currentLevelXP: number;

  nextLevelXP: number | null;

  xpIntoLevel: number;

  xpNeededForNextLevel: number;

  progress: number;

  isMaxLevel: boolean;
};

/*
 * ========================================
 * GET XP REQUIRED FOR LEVEL
 * ========================================
 *
 * Delegates to progressionRepository.ts.
 * ========================================
 */

export function getXPForLevel(
  level: number
): number {
  return repositoryGetXPForLevel(
    level
  );
}

/*
 * ========================================
 * GET TRAINER LEVEL
 * ========================================
 *
 * Delegates to progressionRepository.ts.
 *
 * Trainer Level has no ceiling: every
 * additional 500 XP is another level.
 * ========================================
 */

export function getTrainerLevel(
  totalXP: number
): number {
  return calculateTrainerLevel(
    totalXP
  );
}

/*
 * ========================================
 * GET XP PROGRESS
 * ========================================
 */

export function getTrainerProgression(
  totalXP: number
): TrainerProgression {
  /*
   * Sanitize XP.
   */

  const xp =
    Math.max(
      0,
      Math.floor(totalXP)
    );

  const level =
    getTrainerLevel(xp);

  const currentLevelXP =
    level *
    XP_PER_LEVEL;

  const nextLevelXP =
    (level + 1) *
    XP_PER_LEVEL;

  const xpIntoLevel =
    xp - currentLevelXP;

  const xpNeededForNextLevel =
    XP_PER_LEVEL;

  const progress =
    Math.min(
      1,
      Math.max(
        0,
        xpIntoLevel /
          xpNeededForNextLevel
      )
    );

  /*
   * Trainer Level has no maximum, unlike
   * the old non-linear table. This is kept
   * on the type for backward compatibility
   * with any future UI that checks it, but
   * it is always false.
   */

  return {
    level,

    totalXP: xp,

    currentLevelXP,

    nextLevelXP,

    xpIntoLevel,

    xpNeededForNextLevel,

    progress,

    isMaxLevel: false,
  };
}

/*
 * ========================================
 * GET XP NEEDED FOR NEXT LEVEL
 * ========================================
 */

export function getXPForNextLevel(
  totalXP: number
): number | null {
  const progression =
    getTrainerProgression(
      totalXP
    );

  return progression.nextLevelXP;
}

/*
 * ========================================
 * GET CURRENT LEVEL
 * ========================================
 */

export function getCurrentTrainerLevel(
  totalXP: number
): number {
  return getTrainerLevel(
    totalXP
  );
}
