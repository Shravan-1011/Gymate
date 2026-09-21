import * as SQLite from 'expo-sqlite';

/*
 * ========================================
 * GYMATE DATABASE
 * ========================================
 *
 * Database:
 *
 *   gymate.db
 *
 * Tables:
 *
 *   profiles
 *   profile_details
 *
 *   profile_progression
 *   xp_transactions
 *
 *   workout_sessions
 *   workout_exercises
 *   workout_sets
 *
 *   custom_exercises
 *
 * ========================================
 */

const DATABASE_NAME = 'gymate.db';

/*
 * ========================================
 * DATABASE INSTANCE
 * ========================================
 */

let database: SQLite.SQLiteDatabase | null = null;


/*
 * ========================================
 * GET DATABASE
 * ========================================
 */

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database) {
    return database;
  }

  database =
    await SQLite.openDatabaseAsync(
      DATABASE_NAME
    );

  return database;
}


/*
 * ========================================
 * INITIALIZE DATABASE
 * ========================================
 */

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();


  /*
   * ======================================
   * FOREIGN KEYS
   * ======================================
   */

  await db.execAsync(`
    PRAGMA foreign_keys = ON;
  `);


  /*
   * ======================================
   * PROFILES
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY NOT NULL,

      username TEXT NOT NULL UNIQUE,

      password_hash TEXT NOT NULL,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL
      
    );
  `);

  try {
  await db.execAsync(`
    ALTER TABLE profiles
    ADD COLUMN trainer_sprite_id TEXT;
  `);
} catch (error) {
  /*
   * Column already exists.
   * Safe to ignore.
   */
}


  /*
   * ======================================
   * PROFILE DETAILS
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile_details (
      profile_id TEXT PRIMARY KEY NOT NULL,

      display_name TEXT NOT NULL,

      age INTEGER,

      height_cm REAL,

      weight_kg REAL,

      fitness_goal TEXT,

      activity_level TEXT,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * PROFILE PROGRESSION
   * ======================================
   *
   * One progression row per profile.
   *
   * total_xp:
   *   Lifetime XP.
   *
   * current_streak:
   *   Current consecutive active days.
   *
   * longest_streak:
   *   Best streak ever.
   *
   * last_activity_date:
   *   Last calendar day on which the user
   *   performed at least one qualifying
   *   XP-generating activity.
   *
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS profile_progression (
      profile_id TEXT PRIMARY KEY NOT NULL,

      total_xp INTEGER NOT NULL DEFAULT 0,

      current_streak INTEGER NOT NULL DEFAULT 0,

      longest_streak INTEGER NOT NULL DEFAULT 0,

      last_activity_date TEXT,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * PROFILE PROGRESSION MIGRATION
   * ======================================
   *
   * Older Gymate versions may contain:
   *
   *   last_workout_date
   *
   * The new system uses:
   *
   *   last_activity_date
   *
   * because workouts are NOT the only
   * activity that can maintain a streak.
   *
   * ======================================
   */

  const progressionColumns =
    await db.getAllAsync<{
      name: string;
    }>(
      `
        PRAGMA table_info(
          profile_progression
        );
      `
    );


  const hasOldWorkoutColumn =
    progressionColumns.some(
      column =>
        column.name ===
        'last_workout_date'
    );


  const hasActivityColumn =
    progressionColumns.some(
      column =>
        column.name ===
        'last_activity_date'
    );


  /*
   * Rename the old column if necessary.
   */

  if (
    hasOldWorkoutColumn &&
    !hasActivityColumn
  ) {
    await db.execAsync(`
      ALTER TABLE profile_progression
      RENAME COLUMN
        last_workout_date
      TO
        last_activity_date;
    `);
  }


  /*
   * ======================================
   * XP TRANSACTIONS
   * ======================================
   *
   * Every XP reward is recorded here.
   *
   * Example:
   *
   *   Workout:
   *     source = workout
   *     reason = WORKOUT_COMPLETED
   *     amount = 116
   *
   *   Nutrition:
   *     source = nutrition
   *     reason = NUTRITION_COMPLETED
   *     amount = 82
   *
   *   Streak:
   *     source = streak
   *     reason = DAILY_STREAK
   *     amount = 30
   *
   * reference_id prevents the same
   * activity from receiving XP twice.
   *
   * activity_date represents the calendar
   * date on which the activity occurred.
   *
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS xp_transactions (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      source TEXT NOT NULL,

      amount INTEGER NOT NULL,

      reason TEXT NOT NULL,

      activity_date TEXT NOT NULL,

      reference_id TEXT,

      created_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * XP TRANSACTION MIGRATION
   * ======================================
   *
   * Existing Gymate databases may have
   * the old xp_transactions schema:
   *
   *   profile_id
   *   amount
   *   reason
   *   reference_id
   *   created_at
   *
   * New columns:
   *
   *   source
   *   activity_date
   *
   * ======================================
   */

  const xpColumns =
    await db.getAllAsync<{
      name: string;
    }>(
      `
        PRAGMA table_info(
          xp_transactions
        );
      `
    );


  const hasSourceColumn =
    xpColumns.some(
      column =>
        column.name ===
        'source'
    );


  const hasActivityDateColumn =
    xpColumns.some(
      column =>
        column.name ===
        'activity_date'
    );


  /*
   * ======================================
   * ADD SOURCE COLUMN
   * ======================================
   */

  if (!hasSourceColumn) {
    await db.execAsync(`
      ALTER TABLE xp_transactions
      ADD COLUMN source TEXT;
    `);


    /*
     * Populate old transactions using
     * their reason.
     */

    await db.execAsync(`
      UPDATE xp_transactions
      SET source =
        CASE
          WHEN reason = 'WORKOUT_COMPLETED'
            THEN 'workout'

          WHEN reason = 'NUTRITION_COMPLETED'
            THEN 'nutrition'

          WHEN reason = 'RUNNING_COMPLETED'
            THEN 'running'

          WHEN reason = 'STEPS_10K_COMPLETED'
            THEN 'steps'

          WHEN reason = 'TODO_COMPLETED'
            THEN 'todo'

          WHEN reason = 'DAILY_STREAK'
            THEN 'streak'

          ELSE 'workout'
        END
      WHERE source IS NULL;
    `);
  }


  /*
   * ======================================
   * ADD ACTIVITY DATE COLUMN
   * ======================================
   */

  if (!hasActivityDateColumn) {
    await db.execAsync(`
      ALTER TABLE xp_transactions
      ADD COLUMN activity_date TEXT;
    `);


    /*
     * Existing transactions do not have a
     * dedicated activity date.
     *
     * Use their creation date as the best
     * available migration value.
     */

    await db.execAsync(`
      UPDATE xp_transactions
      SET activity_date =
        substr(
          created_at,
          1,
          10
        )
      WHERE activity_date IS NULL;
    `);
  }


  /*
   * ======================================
   * XP DUPLICATE-PREVENTION INDEX
   * ======================================
   *
   * Same profile + source + reference
   * represents the same XP event.
   *
   * Example:
   *
   * profile-1
   * workout
   * workout-123
   *
   * cannot receive the same XP twice.
   *
   * ======================================
   */

  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
    idx_xp_transactions_unique_reference
    ON xp_transactions(
      profile_id,
      source,
      reference_id
    );
  `);


  /*
   * ======================================
   * XP PROFILE INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_xp_transactions_profile
    ON xp_transactions(
      profile_id
    );
  `);


  /*
   * ======================================
   * XP DATE INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_xp_transactions_profile_date
    ON xp_transactions(
      profile_id,
      activity_date
    );
  `);


  /*
   * ======================================
   * XP SOURCE INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_xp_transactions_profile_source
    ON xp_transactions(
      profile_id,
      source
    );
  `);


  /*
   * ======================================
   * WORKOUT SESSIONS
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      split_id TEXT NOT NULL,

      name TEXT NOT NULL,

      started_at TEXT,

      ended_at TEXT,

      status TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * WORKOUT EXERCISES
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_exercises (
      id TEXT PRIMARY KEY NOT NULL,

      workout_id TEXT NOT NULL,

      exercise_id TEXT NOT NULL,

      exercise_name TEXT NOT NULL,

      primary_muscle TEXT NOT NULL,

      secondary_muscles TEXT NOT NULL,

      equipment TEXT NOT NULL,

      is_custom INTEGER NOT NULL DEFAULT 0,

      notes TEXT,

      FOREIGN KEY (
        workout_id
      )
      REFERENCES workout_sessions(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * WORKOUT SETS
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY NOT NULL,

      workout_exercise_id TEXT NOT NULL,

      set_number INTEGER NOT NULL,

      type TEXT NOT NULL,

      weight REAL NOT NULL DEFAULT 0,

      reps INTEGER NOT NULL DEFAULT 0,

      completed INTEGER NOT NULL DEFAULT 0,

      FOREIGN KEY (
        workout_exercise_id
      )
      REFERENCES workout_exercises(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * CUSTOM EXERCISES
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS custom_exercises (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      name TEXT NOT NULL,

      primary_muscle TEXT NOT NULL,

      secondary_muscles TEXT NOT NULL,

      equipment TEXT NOT NULL,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE,

      UNIQUE (
        profile_id,
        name
      )
    );
  `);


  /*
   * ======================================
   * WORKOUT SESSION INDEXES
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_workout_sessions_profile
    ON workout_sessions(
      profile_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_workout_sessions_profile_status
    ON workout_sessions(
      profile_id,
      status
    );
  `);


  /*
   * ======================================
   * WORKOUT EXERCISE INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_workout_exercises_workout
    ON workout_exercises(
      workout_id
    );
  `);


  /*
   * ======================================
   * WORKOUT SET INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_workout_sets_exercise
    ON workout_sets(
      workout_exercise_id
    );
  `);


  /*
   * ======================================
   * CUSTOM EXERCISE INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_custom_exercises_profile
    ON custom_exercises(
      profile_id
    );
  `);


  /*
   * ======================================================================
   * POKÉMON SYSTEM
   * ======================================================================
   *
   * Gamification layer built on top of the
   * existing XP/progression system above.
   *
   * Pokémon SPECIES data is static and does
   * NOT live here — see
   * data/pokemonSpecies.ts. These tables
   * only store what an individual profile
   * OWNS or HAS DONE, the same way
   * custom_exercises stores only what a
   * profile created (not the built-in
   * exercise list).
   *
   * Tables:
   *
   *   pokemon_starter_state
   *   pokemon_currency
   *   pokemon_shard_grants
   *   pokemon_inventory
   *   user_pokemon
   *   pokemon_team
   *
   * ======================================================================
   */


  /*
   * ======================================
   * POKÉMON STARTER STATE
   * ======================================
   *
   * One row per profile. Tracks whether
   * the one-time starter selection flow
   * has been completed, so the Pokémon
   * tab knows whether to show the starter
   * screen or the normal dashboard.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_starter_state (
      profile_id TEXT PRIMARY KEY NOT NULL,

      starter_selected INTEGER NOT NULL DEFAULT 0,

      starter_species_id TEXT,

      selected_at TEXT,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * POKÉMON CURRENCY
   * ======================================
   *
   * One row per profile. Pokéball Shards
   * are a currency SEPARATE from Gymate XP
   * and Trainer Level — this is the single
   * authoritative source for a profile's
   * shard balance.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_currency (
      profile_id TEXT PRIMARY KEY NOT NULL,

      pokeball_shards INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * POKÉMON SHARD GRANTS
   * ======================================
   *
   * Ledger of which Trainer Levels have
   * already paid out their +1 shard
   * reward for a profile.
   *
   * This is what makes shard awarding
   * robust against duplicates: granting
   * a shard for a level the profile has
   * already been paid for is blocked by
   * the unique index below, the same
   * dedupe strategy xp_transactions
   * already uses for
   * (profile_id, source, reference_id).
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_shard_grants (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      trainer_level INTEGER NOT NULL,

      shards_awarded INTEGER NOT NULL,

      granted_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
    idx_pokemon_shard_grants_unique_level
    ON pokemon_shard_grants(
      profile_id,
      trainer_level
    );
  `);


  /*
   * ======================================
   * POKÉMON INVENTORY
   * ======================================
   *
   * Normalized ball inventory: one row per
   * (profile, ball type). Chosen over four
   * fixed columns because ball types are
   * explicitly not finalized — adding a
   * new ball tier later needs zero schema
   * changes with this shape.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_inventory (
      profile_id TEXT NOT NULL,

      ball_type TEXT NOT NULL,

      count INTEGER NOT NULL DEFAULT 0,

      updated_at TEXT NOT NULL,

      PRIMARY KEY (
        profile_id,
        ball_type
      ),

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * USER POKÉMON
   * ======================================
   *
   * An OWNED INSTANCE of a species. The
   * species itself (name, rarity, types,
   * sprite) is static data — see
   * data/pokemonSpecies.ts. species_id
   * here is a lookup key into that static
   * catalog, not a SQL foreign key,
   * because the catalog does not live in
   * SQLite (same reasoning as
   * workout_exercises.exercise_id, which
   * also references the static
   * data/exercises.ts catalog by id).
   *
   * Duplicate species per profile are
   * intentionally ALLOWED — duplicate
   * handling is not finalized, so this
   * table does not enforce species
   * uniqueness per profile.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_pokemon (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      species_id TEXT NOT NULL,

      nickname TEXT,

      xp INTEGER NOT NULL DEFAULT 0,

      level INTEGER NOT NULL DEFAULT 0,

      obtained_at TEXT NOT NULL,

      source TEXT NOT NULL,

      created_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * MIGRATION: user_pokemon.xp
   * ======================================
   *
   * Added after the initial Pokémon
   * foundation shipped without individual
   * Pokémon leveling. Guarded the same
   * way profile_progression/xp_transactions
   * migrations above are, in case this
   * table already exists on a device from
   * an earlier build.
   * ======================================
   */

  const userPokemonColumns =
    await db.getAllAsync<{
      name: string;
    }>(
      `
        PRAGMA table_info(
          user_pokemon
        );
      `
    );

  const hasPokemonXPColumn =
    userPokemonColumns.some(
      (column) => column.name === 'xp'
    );

  if (!hasPokemonXPColumn) {
    await db.execAsync(`
      ALTER TABLE user_pokemon
      ADD COLUMN xp INTEGER NOT NULL DEFAULT 0;
    `);
  }


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_user_pokemon_profile
    ON user_pokemon(
      profile_id
    );
  `);


      /*
   * ======================================
   * POKÉDEX ENTRIES
   * ======================================
   *
   * Permanent species registration for a
   * profile.
   *
   * IMPORTANT:
   *
   * This is NOT the same as user_pokemon.
   *
   * user_pokemon stores the user's current
   * Pokémon instances.
   *
   * pokedex_entries stores every species
   * the user has ever registered.
   *
   * Evolution therefore works like:
   *
   *   Charmander
   *       ↓
   *   Charmeleon
   *       ↓
   *   Charizard
   *
   * Pokédex:
   *
   *   1 → 2 → 3
   *
   * Even though the same user_pokemon
   * instance ultimately contains:
   *
   *   species_id = charizard
   *
   * Once registered, a species is NEVER
   * removed from the Pokédex.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokedex_entries (
      profile_id TEXT NOT NULL,

      species_id TEXT NOT NULL,

      registered_at TEXT NOT NULL,

      PRIMARY KEY (
        profile_id,
        species_id
      ),

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * POKÉDEX INDEX
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_pokedex_entries_profile
    ON pokedex_entries(
      profile_id
    );
  `);
    

  /*
   * ======================================
   * POKÉMON TEAM
   * ======================================
   *
   * The profile's active lineup. Maximum
   * 3 slots, enforced both here (via the
   * CHECK constraint) and in the service
   * layer (pokemonService.ts) before the
   * UI ever attempts an insert.
   *
   * A user_pokemon can only occupy ONE
   * team slot at a time, enforced by the
   * unique index on user_pokemon_id.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_team (
      profile_id TEXT NOT NULL,

      slot INTEGER NOT NULL,

      user_pokemon_id TEXT NOT NULL,

      added_at TEXT NOT NULL,

      PRIMARY KEY (
        profile_id,
        slot
      ),

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE,

      FOREIGN KEY (
        user_pokemon_id
      )
      REFERENCES user_pokemon(id)
      ON DELETE CASCADE,

      CHECK (
        slot >= 1 AND slot <= 3
      )
    );
  `);


  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
    idx_pokemon_team_unique_pokemon
    ON pokemon_team(
      user_pokemon_id
    );
  `);


  /*
   * ======================================
   * POKÉMON STREAK SHARD GRANTS
   * ======================================
   *
   * Ledger of which 7-day streak
   * milestones (7, 14, 21, ...) have
   * already paid out their shard bonus
   * for a profile. Same dedupe pattern
   * as pokemon_shard_grants above —
   * the unique index is the actual
   * guarantee, not application logic.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_streak_shard_grants (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      streak_milestone INTEGER NOT NULL,

      shards_awarded INTEGER NOT NULL,

      granted_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS
    idx_pokemon_streak_shard_grants_unique
    ON pokemon_streak_shard_grants(
      profile_id,
      streak_milestone
    );
  `);


  /*
   * ======================================
   * USER ACHIEVEMENTS
   * ======================================
   *
   * Achievement DEFINITIONS are static —
   * see data/pokemonAchievements.ts. This
   * table only records that a profile
   * unlocked one.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      profile_id TEXT NOT NULL,

      achievement_id TEXT NOT NULL,

      unlocked_at TEXT NOT NULL,

      PRIMARY KEY (
        profile_id,
        achievement_id
      ),

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * USER GYM BADGES
   * ======================================
   *
   * Badge DEFINITIONS are static — see
   * data/pokemonGymBadges.ts. Earned
   * automatically alongside a linked
   * achievement (see
   * services/pokemonAchievementService.ts).
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS user_gym_badges (
      profile_id TEXT NOT NULL,

      badge_id TEXT NOT NULL,

      earned_at TEXT NOT NULL,

      PRIMARY KEY (
        profile_id,
        badge_id
      ),

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);

  /*
   * ======================================================================
   * DIET SYSTEM
   * ======================================================================
   *
   * Templates are reusable plans.
   *
   * Daily nutrition is a separate snapshot
   * of what the user actually ate that day.
   *
   * Changing a template MUST NOT change
   * historical daily nutrition.
   *
   * Tables:
   *
   *   diet_templates
   *   diet_template_foods
   *
   *   daily_nutrition
   *   daily_nutrition_foods
   *
   * ======================================================================
   */


  /*
   * ======================================
   * DIET TEMPLATES
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS diet_templates (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      name TEXT NOT NULL,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * DIET TEMPLATE FOODS
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS diet_template_foods (
      id TEXT PRIMARY KEY NOT NULL,

      template_id TEXT NOT NULL,

      food_name TEXT NOT NULL,

      quantity REAL NOT NULL,

      unit TEXT NOT NULL,

      calories REAL NOT NULL DEFAULT 0,

      protein REAL NOT NULL DEFAULT 0,

      carbs REAL NOT NULL DEFAULT 0,

      fat REAL NOT NULL DEFAULT 0,

      sort_order INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        template_id
      )
      REFERENCES diet_templates(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * DAILY NUTRITION
   * ======================================
   *
   * One row per profile per calendar day.
   *
   * The UNIQUE constraint prevents
   * multiple nutrition records for the
   * same profile/date combination.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_nutrition (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      activity_date TEXT NOT NULL,

      calorie_goal REAL NOT NULL,

      protein_goal REAL NOT NULL,

      water_goal REAL NOT NULL,

      water_consumed REAL NOT NULL DEFAULT 0,

      evaluated INTEGER NOT NULL DEFAULT 0,

      nutrition_xp INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE,

      UNIQUE (
        profile_id,
        activity_date
      )
    );
  `);


  /*
   * ======================================
   * DAILY NUTRITION FOODS
   * ======================================
   *
   * These are independent copies of food
   * data for the specific day.
   *
   * Template edits therefore cannot modify
   * historical nutrition records.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_nutrition_foods (
      id TEXT PRIMARY KEY NOT NULL,

      daily_nutrition_id TEXT NOT NULL,

      food_name TEXT NOT NULL,

      quantity REAL NOT NULL,

      unit TEXT NOT NULL,

      calories REAL NOT NULL DEFAULT 0,

      protein REAL NOT NULL DEFAULT 0,

      carbs REAL NOT NULL DEFAULT 0,

      fat REAL NOT NULL DEFAULT 0,

      sort_order INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        daily_nutrition_id
      )
      REFERENCES daily_nutrition(id)
      ON DELETE CASCADE
    );
  `);


  /*
   * ======================================
   * DIET INDEXES
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_diet_templates_profile
    ON diet_templates(
      profile_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_diet_template_foods_template
    ON diet_template_foods(
      template_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_daily_nutrition_profile
    ON daily_nutrition(
      profile_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_daily_nutrition_profile_date
    ON daily_nutrition(
      profile_id,
      activity_date
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_daily_nutrition_foods_daily
    ON daily_nutrition_foods(
      daily_nutrition_id
    );
  `);

      /*
   * ======================================================================
   * ACTIVITY SYSTEM
   * ======================================================================
   *
   * Activity V1:
   *
   *   1. Steps
   *   2. Running
   *   3. To-Do
   *
   * Tables:
   *
   *   daily_activity_steps
   *   running_sessions
   *   activity_todo_slots
   *   daily_activity_todos
   *
   * ======================================================================
   */


  /*
   * ======================================
   * DAILY ACTIVITY STEPS
   * ======================================
   *
   * One row per profile per calendar day.
   *
   * The step count comes from the phone's
   * native step counter.
   *
   * evaluated / steps_xp prevent the same
   * day's 10K reward from being awarded
   * repeatedly.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_activity_steps (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      activity_date TEXT NOT NULL,

      step_count INTEGER NOT NULL DEFAULT 0,

      evaluated INTEGER NOT NULL DEFAULT 0,

      steps_xp INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE,

      UNIQUE (
        profile_id,
        activity_date
      )
    );
  `);


  /*
   * ======================================
   * RUNNING SESSIONS
   * ======================================
   *
   * One row represents one complete run.
   *
   * route_json stores the GPS route as
   * serialized JSON.
   *
   * This keeps the route associated with
   * the exact historical run.
   * ======================================
   */

    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS running_sessions (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      activity_date TEXT NOT NULL,

      started_at TEXT NOT NULL,

      ended_at TEXT,

      paused_at TEXT,

      total_paused_seconds INTEGER NOT NULL DEFAULT 0,

      duration_seconds INTEGER NOT NULL DEFAULT 0,

      distance_meters REAL NOT NULL DEFAULT 0,

      average_pace_seconds_per_km REAL,

      fastest_pace_seconds_per_km REAL,

      status TEXT NOT NULL,

      running_xp INTEGER NOT NULL DEFAULT 0,

      evaluated INTEGER NOT NULL DEFAULT 0,

      route_json TEXT NOT NULL DEFAULT '[]',

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE
    );
  `);

    /*
   * ======================================
   * RUNNING SESSION PAUSE MIGRATION
   * ======================================
   *
   * Older Gymate installations already
   * have running_sessions without the
   * pause columns.
   *
   * These migrations are therefore
   * required for existing databases.
   * ======================================
   */

  const runningSessionColumns =
    await db.getAllAsync<{
      name: string;
    }>(
      `
        PRAGMA table_info(
          running_sessions
        );
      `
    );


  const hasPausedAtColumn =
    runningSessionColumns.some(
      column =>
        column.name ===
        'paused_at'
    );


  const hasTotalPausedSecondsColumn =
    runningSessionColumns.some(
      column =>
        column.name ===
        'total_paused_seconds'
    );


  if (!hasPausedAtColumn) {

    await db.execAsync(`
      ALTER TABLE running_sessions
      ADD COLUMN paused_at TEXT;
    `);

  }


  if (!hasTotalPausedSecondsColumn) {

    await db.execAsync(`
      ALTER TABLE running_sessions
      ADD COLUMN total_paused_seconds
      INTEGER NOT NULL DEFAULT 0;
    `);

  }


  /*
   * ======================================
   * ACTIVITY TODO SLOTS
   * ======================================
   *
   * Maximum 5 persistent slots.
   *
   * IMPORTANT:
   *
   * The actual task text is NOT stored
   * here.
   *
   * These rows represent the five
   * persistent positions only.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS activity_todo_slots (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      slot_number INTEGER NOT NULL,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE,

      UNIQUE (
        profile_id,
        slot_number
      ),

      CHECK (
        slot_number >= 1
        AND
        slot_number <= 5
      )
    );
  `);


  /*
   * ======================================
   * DAILY ACTIVITY TODOS
   * ======================================
   *
   * Daily snapshot of the task assigned
   * to a persistent slot.
   *
   * Example:
   *
   * Sep 20:
   *   Slot 1 = Running
   *
   * Sep 21:
   *   Slot 1 = Cycling
   *
   * Sep 20 remains Running forever.
   * ======================================
   */

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS daily_activity_todos (
      id TEXT PRIMARY KEY NOT NULL,

      profile_id TEXT NOT NULL,

      activity_date TEXT NOT NULL,

      slot_number INTEGER NOT NULL,

      title TEXT NOT NULL,

      completed INTEGER NOT NULL DEFAULT 0,

      created_at TEXT NOT NULL,

      updated_at TEXT NOT NULL,

      FOREIGN KEY (
        profile_id
      )
      REFERENCES profiles(id)
      ON DELETE CASCADE,

      UNIQUE (
        profile_id,
        activity_date,
        slot_number
      ),

      CHECK (
        slot_number >= 1
        AND
        slot_number <= 5
      )
    );
  `);


  /*
   * ======================================
   * ACTIVITY INDEXES
   * ======================================
   */

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_daily_activity_steps_profile
    ON daily_activity_steps(
      profile_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_daily_activity_steps_profile_date
    ON daily_activity_steps(
      profile_id,
      activity_date
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_running_sessions_profile
    ON running_sessions(
      profile_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_running_sessions_profile_date
    ON running_sessions(
      profile_id,
      activity_date
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_activity_todo_slots_profile
    ON activity_todo_slots(
      profile_id
    );
  `);


  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS
    idx_daily_activity_todos_profile_date
    ON daily_activity_todos(
      profile_id,
      activity_date
    );
  `);

}


/*
 * ========================================
 * CLOSE DATABASE
 * ========================================
 */

export async function closeDatabase(): Promise<void> {
  if (!database) {
    return;
  }

  await database.closeAsync();

  database = null;
}