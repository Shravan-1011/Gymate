import {
  getOrCreatePokemonStarterState,
  markStarterSelected,
  type PokemonStarterState,
} from '../database/pokemonStarterRepository';

import {
  createUserPokemon,
  getUserPokemonForProfile,
  getPCPokemonForProfile,
  updatePokemonProgress,
} from '../database/userPokemonRepository';

import {
  getPokedexSpeciesIds,
} from '../database/pokedexRepository';

import {
  addPokemonToTeam,
  removePokemonFromTeam,
  getPokemonTeam,
  isTeamFull,
} from '../database/pokemonTeamRepository';

import {
  getOrCreatePokemonCurrency,
  spendPokeballShards,
} from '../database/pokemonCurrencyRepository';

import {
  addPokeballs,
  consumePokeball,
  getPokemonInventory,
} from '../database/pokemonInventoryRepository';

import {
  getSpeciesById,
  getStarterOptions,
  getBallConfig,
  rollSpeciesForBall,
} from './pokemonDataService';

import { safelyEvaluateAchievements } from './pokemonAchievementService';

import {
  PokeballType,
  PokemonSpecies,
  UserPokemon,
} from '../types/pokemon';

/*
 * ========================================
 * POKÉMON SERVICE
 * ========================================
 *
 * Orchestrates multi-step Pokémon
 * operations across the repositories
 * above. UI screens call THIS file, not
 * the repositories directly:
 *
 *   UI
 *    ↓
 *   pokemonService.ts (this file)
 *    ↓
 *   repositories
 *    ↓
 *   SQLite
 *
 * ========================================
 */

/*
 * ========================================
 * IS POKÉMON SYSTEM INITIALIZED
 * ========================================
 *
 * Used by the Pokémon tab to decide
 * between showing starter selection or
 * the normal dashboard.
 * ========================================
 */

export async function isPokemonSystemInitialized(
  profileId: string
): Promise<boolean> {
  const state =
    await getOrCreatePokemonStarterState(
      profileId
    );

  return state.starterSelected;
}

export async function getStarterState(
  profileId: string
): Promise<PokemonStarterState> {
  return getOrCreatePokemonStarterState(
    profileId
  );
}

export function getAvailableStarters(): PokemonSpecies[] {
  return getStarterOptions();
}

/*
 * ========================================
 * SELECT STARTER
 * ========================================
 *
 * One-time initialization flow:
 *
 *   1. Validate the species is a real
 *      starter option.
 *   2. Create the owned user_pokemon.
 *   3. Add it directly to Team slot 1.
 *   4. Mark starter selection complete.
 *
 * markStarterSelected() is itself
 * idempotent (see
 * pokemonStarterRepository.ts), so if
 * this is somehow called twice, the
 * second call safely does nothing beyond
 * returning the original choice — it does
 * NOT create a second Pokémon.
 * ========================================
 */

export async function selectStarterPokemon(
  profileId: string,
  starterSpeciesId: string
): Promise<{
  starterState: PokemonStarterState;
  userPokemon: UserPokemon;
}> {
  const existingState =
    await getOrCreatePokemonStarterState(
      profileId
    );

  if (existingState.starterSelected) {
    throw new Error(
      'STARTER_ALREADY_SELECTED'
    );
  }

  const species = getSpeciesById(
    starterSpeciesId
  );

  if (!species || !species.isStarter) {
    throw new Error(
      'INVALID_STARTER_SPECIES'
    );
  }

  console.log(
    '[POKEMON] Starter selection',
    profileId,
    starterSpeciesId
  );

  const userPokemon =
    await createUserPokemon(
      profileId,
      species.id,
      'starter'
    );

  console.log(
    '[POKEMON] Added Pokémon',
    userPokemon.id
  );

  await addPokemonToTeam(
    profileId,
    userPokemon.id,
    1
  );

  console.log(
    '[POKEMON] Team updated',
    profileId
  );

  const starterState =
    await markStarterSelected(
      profileId,
      species.id
    );

  /*
   * Make sure currency/inventory rows
   * exist from day one so later reads
   * never have to null-check them.
   */

  await getOrCreatePokemonCurrency(
    profileId
  );

  await safelyEvaluateAchievements(
    profileId
  );

  return {
    starterState,
    userPokemon,
  };
}

/*
 * ========================================
 * GET SINGLE POKÉMON DETAIL
 * ========================================
 *
 * Powers the Pokédex-style detail screen.
 * Works whether the Pokémon is currently
 * on the team or in the PC.
 * ========================================
 */

export async function getUserPokemonDetail(
  profileId: string,
  userPokemonId: string
): Promise<{
  userPokemon: UserPokemon;
  species: PokemonSpecies | null;
  isOnTeam: boolean;
  teamSlot: number | null;
} | null> {
  const owned = await getUserPokemonForProfile(
    profileId
  );

  const userPokemon = owned.find(
    (pokemon) => pokemon.id === userPokemonId
  );

  if (!userPokemon) {
    return null;
  }

  const team = await getPokemonTeam(
    profileId
  );

  const teamSlot =
    team.find(
      (slot) =>
        slot.userPokemonId === userPokemonId
    )?.slot ?? null;

  return {
    userPokemon,
    species: getSpeciesById(
      userPokemon.speciesId
    ),
    isOnTeam: teamSlot !== null,
    teamSlot,
  };
}

/*
 * ========================================
 * TEAM + PC
 * ========================================
 */

export async function getTeamWithDetails(
  profileId: string
): Promise<
  {
    slot: number;
    userPokemon: UserPokemon;
    species: PokemonSpecies | null;
  }[]
> {
  const team = await getPokemonTeam(
    profileId
  );

  const allOwned =
    await getUserPokemonForProfile(
      profileId
    );

  const byId = new Map(
    allOwned.map((pokemon) => [
      pokemon.id,
      pokemon,
    ])
  );

  return team
    .map((slot) => {
      const userPokemon = byId.get(
        slot.userPokemonId
      );

      if (!userPokemon) {
        return null;
      }

      return {
        slot: slot.slot,
        userPokemon,
        species: getSpeciesById(
          userPokemon.speciesId
        ),
      };
    })
    .filter(
      (
        entry
      ): entry is {
        slot: number;
        userPokemon: UserPokemon;
        species: PokemonSpecies | null;
      } => entry !== null
    );
}

export async function getPCWithDetails(
  profileId: string
): Promise<
  {
    userPokemon: UserPokemon;
    species: PokemonSpecies | null;
  }[]
> {
  const pcPokemon =
    await getPCPokemonForProfile(
      profileId
    );

  return pcPokemon.map((userPokemon) => ({
    userPokemon,
    species: getSpeciesById(
      userPokemon.speciesId
    ),
  }));
}

/*
 * ========================================
 * MOVE PC → TEAM
 * ========================================
 */

export async function moveToTeam(
  profileId: string,
  userPokemonId: string
): Promise<void> {
  const full = await isTeamFull(
    profileId
  );

  if (full) {
    throw new Error('TEAM_IS_FULL');
  }

  await addPokemonToTeam(
    profileId,
    userPokemonId
  );
}

/*
 * ========================================
 * MOVE TEAM → PC
 * ========================================
 */

export async function moveToPC(
  profileId: string,
  userPokemonId: string
): Promise<void> {
  await removePokemonFromTeam(
    profileId,
    userPokemonId
  );
}

/*
 * ========================================
 * SHOP
 * ========================================
 */

export async function getShopState(
  profileId: string
): Promise<{
  shardBalance: number;
  inventory: Awaited<
    ReturnType<typeof getPokemonInventory>
  >;
}> {
  const currency =
    await getOrCreatePokemonCurrency(
      profileId
    );

  const inventory =
    await getPokemonInventory(profileId);

  return {
    shardBalance:
      currency.pokeballShards,

    inventory,
  };
}

/*
 * ========================================
 * BUY BALL
 * ========================================
 *
 * Spends shards, then adds the ball to
 * inventory. If spending fails (not
 * enough shards), nothing is added — the
 * two steps are ordered so we never grant
 * a ball for shards that were never
 * actually deducted.
 * ========================================
 */

export async function buyPokeball(
  profileId: string,
  ballType: PokeballType
): Promise<{
  success: boolean;
  reason?: string;
}> {
  const config = getBallConfig(ballType);

  const result = await spendPokeballShards(
    profileId,
    config.shardCost
  );

  if (!result) {
    return {
      success: false,
      reason: 'NOT_ENOUGH_SHARDS',
    };
  }

  await addPokeballs(
    profileId,
    ballType,
    1
  );

  console.log(
    '[POKEMON] Ball purchased',
    profileId,
    ballType
  );

  return { success: true };
}

/*
 * ========================================
 * OPEN BALL
 * ========================================
 *
 * Full pipeline:
 *
 *   1. Consume one ball from inventory
 *      (fails cleanly if none owned).
 *
 *   2. Read the permanent Pokédex ledger.
 *
 *   3. Roll a species from the ball's
 *      evolution-stage catch pool,
 *      EXCLUDING every species already
 *      registered in the Pokédex.
 *
 *   4. If every eligible species is
 *      already registered, refund the ball.
 *
 *   5. Create the owned user_pokemon.
 *
 *   6. It lands in the PC by default.
 *
 * IMPORTANT:
 * The Pokédex ledger is used instead of
 * user_pokemon because evolution changes
 * user_pokemon.species_id.
 * ========================================
 */

export async function openPokeball(
  profileId: string,
  ballType: PokeballType
): Promise<{
  success: boolean;
  reason?: string;
  species?: PokemonSpecies;
  userPokemon?: UserPokemon;
}> {
  const config = getBallConfig(ballType);

  if (config.catchRule === 'mega_evolution') {
    return {
      success: false,
      reason: 'GS_BALL_CANNOT_CATCH',
    };
  }

  const consumed = await consumePokeball(
    profileId,
    ballType
  );

  if (!consumed) {
    return {
      success: false,
      reason: 'NO_BALLS_OWNED',
    };
  }

  /*
   * ======================================
   * PERMANENT POKÉDEX CHECK
   * ======================================
   *
   * This is the important part.
   *
   * Do NOT use user_pokemon here because
   * its species_id changes during evolution.
   *
   * pokedex_entries permanently remembers
   * every species the trainer has registered.
   */

  const pokedexSpeciesIds =
    await getPokedexSpeciesIds(
      profileId
    );

  const species =
    rollSpeciesForBall(
      ballType,
      pokedexSpeciesIds
    );

  /*
   * ======================================
   * NO ELIGIBLE POKÉMON
   * ======================================
   */

  if (!species) {
    /*
     * Every species this ball could
     * produce is already registered
     * in the Pokédex.
     *
     * Refund the ball so the user never
     * loses a ball for an exhausted pool.
     */

    await addPokeballs(
      profileId,
      ballType,
      1
    );

    return {
      success: false,
      reason:
        'ALL_SPECIES_OWNED_FOR_THIS_BALL',
    };
  }

  console.log(
    '[POKEMON] Ball opened',
    profileId,
    ballType
  );

  const source =
    ballType as UserPokemon['source'];

  const userPokemon =
    await createUserPokemon(
      profileId,
      species.id,
      source
    );

  console.log(
    '[POKEMON] Pokémon obtained',
    userPokemon.id,
    species.name
  );

  await safelyEvaluateAchievements(
    profileId
  );

  return {
    success: true,
    species,
    userPokemon,
  };
}

// /*
//  * ========================================
//  * MEGA EVOLVE POKÉMON (GS Ball)
//  * ========================================
//  *
//  * NOT a catch — a permanent, expensive
//  * upgrade of a Pokémon the profile
//  * already owns (PC or team, doesn't
//  * matter which). Only available for
//  * species with canMegaEvolve = true, and
//  * only from their fully-evolved (stage 3)
//  * non-mega form — a Pokémon cannot be
//  * mega-evolved twice.
//  * ========================================
//  */

// export async function megaEvolvePokemon(
//   profileId: string,
//   userPokemonId: string
// ): Promise<{
//   success: boolean;
//   reason?: string;
//   species?: PokemonSpecies;
//   userPokemon?: UserPokemon;
// }> {
//   const pokemon = await getUserPokemonForProfile(
//     profileId
//   ).then((all) =>
//     all.find(
//       (entry) => entry.id === userPokemonId
//     )
//   );

//   if (!pokemon) {
//     return {
//       success: false,
//       reason: 'POKEMON_NOT_OWNED',
//     };
//   }

//   const species = getSpeciesById(
//     pokemon.speciesId
//   );

//   if (!species) {
//     return {
//       success: false,
//       reason: 'UNKNOWN_SPECIES',
//     };
//   }

//   if (species.isMegaForm) {
//     return {
//       success: false,
//       reason: 'ALREADY_MEGA_EVOLVED',
//     };
//   }

//   if (
//     !species.canMegaEvolve ||
//     !species.megaFormSpeciesId
//   ) {
//     return {
//       success: false,
//       reason: 'SPECIES_CANNOT_MEGA_EVOLVE',
//     };
//   }

//   const megaSpecies = getSpeciesById(
//     species.megaFormSpeciesId
//   );

//   if (!megaSpecies) {
//     return {
//       success: false,
//       reason: 'UNKNOWN_MEGA_SPECIES',
//     };
//   }

//   const consumed = await consumePokeball(
//     profileId,
//     'gs_ball'
//   );

//   if (!consumed) {
//     return {
//       success: false,
//       reason: 'NO_GS_BALLS_OWNED',
//     };
//   }

//   const updated =
//     await updatePokemonProgress(
//       userPokemonId,
//       pokemon.xp,
//       pokemon.level,
//       megaSpecies.id
//     );

//   console.log(
//     '[POKEMON] Mega evolution',
//     profileId,
//     userPokemonId,
//     species.id,
//     '->',
//     megaSpecies.id
//   );

//   return {
//     success: true,
//     species: megaSpecies,
//     userPokemon: updated ?? undefined,
//   };
// }
