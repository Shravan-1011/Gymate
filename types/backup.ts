/*
 * ========================================
 * GYMATE BACKUP TYPES
 * ========================================
 *
 * Versioned application-level backup.
 *
 * IMPORTANT:
 *
 * This is intentionally NOT a raw SQLite
 * dump. It stores Gymate's user data in a
 * structured format so future database
 * schema changes can be handled safely.
 * ========================================
 */

export const GYMATE_BACKUP_FORMAT =
  'gymate-backup';

export const GYMATE_BACKUP_VERSION = 1;


/*
 * ========================================
 * GENERIC DATABASE ROW
 * ========================================
 *
 * Backup records preserve their original
 * database column names so relationships
 * and IDs remain intact during restore.
 * ========================================
 */

export type BackupRow =
  Record<
    string,
    string |
    number |
    boolean |
    null
  >;


/*
 * ========================================
 * BACKUP SECTIONS
 * ========================================
 */

export type GymateBackup = {
  format: typeof GYMATE_BACKUP_FORMAT;

  version: typeof GYMATE_BACKUP_VERSION;

  appVersion: string;

  createdAt: string;

  /*
   * Profile identity.
   *
   * Password hashes are deliberately
   * excluded from backups.
   */
  profile: {
    id: string;

    username: string;

    trainerSpriteId?: string | null;

    createdAt: string;

    updatedAt: string;
  };

  profileDetails: BackupRow | null;

  progression: BackupRow | null;

  xpTransactions: BackupRow[];

  workouts: {
    sessions: BackupRow[];

    exercises: BackupRow[];

    sets: BackupRow[];
  };

  customExercises: BackupRow[];

  pokemon: {
    starterState: BackupRow | null;

    currency: BackupRow | null;

    shardGrants: BackupRow[];

    inventory: BackupRow[];

    userPokemon: BackupRow[];

    team: BackupRow[];

    pokedex: BackupRow[];

    streakShardGrants: BackupRow[];

    achievements: BackupRow[];

    gymBadges: BackupRow[];
  };

  diet: {
    templates: BackupRow[];

    templateFoods: BackupRow[];

    dailyNutrition: BackupRow[];

    dailyFoods: BackupRow[];
  };

  activity: {
    steps: BackupRow[];

    runningSessions: BackupRow[];

    todoSlots: BackupRow[];

    dailyTodos: BackupRow[];
  };
};


/*
 * ========================================
 * BACKUP RESULT
 * ========================================
 */

export type GymateBackupResult = {
  success: boolean;

  message: string;

  restoredRecords: number;
};