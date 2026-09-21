import {
  hasStreakShardGrant,
  createStreakShardGrant,
} from '../database/pokemonStreakShardRepository';

import { addPokeballShards } from '../database/pokemonCurrencyRepository';

import {
  getStreakShardIntervalDays,
  getStreakShardReward,
} from './pokemonDataService';

/*
 * ========================================
 * STREAK SHARD SERVICE
 * ========================================
 *
 * Every STREAK_SHARD_INTERVAL_DAYS-day
 * streak milestone (7, 14, 21, ...)
 * grants STREAK_SHARD_REWARD Pokéball
 * Shards, on top of whatever XP the
 * streak itself already earned.
 *
 * Call this any time currentStreak may
 * have just increased — see
 * xpService.awardDailyStreakXP.
 * ========================================
 */

export async function grantStreakMilestoneShards(
  profileId: string,
  currentStreak: number
): Promise<void> {
  const interval =
    getStreakShardIntervalDays();

  if (
    currentStreak <= 0 ||
    currentStreak % interval !== 0
  ) {
    return;
  }

  const milestone =
    currentStreak / interval;

  const alreadyGranted =
    await hasStreakShardGrant(
      profileId,
      milestone
    );

  if (alreadyGranted) {
    return;
  }

  const reward = getStreakShardReward();

  const granted =
    await createStreakShardGrant(
      profileId,
      milestone,
      reward
    );

  if (!granted) {
    /*
     * Lost a race with a concurrent
     * call — the other call already
     * paid this milestone.
     */
    return;
  }

  await addPokeballShards(
    profileId,
    reward
  );

  console.log(
    '[POKEMON] Streak shard bonus',
    profileId,
    `${currentStreak}-day streak`,
    reward
  );
}
