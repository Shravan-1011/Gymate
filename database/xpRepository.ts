import { getDatabase } from './database';

/*
 * ========================================
 * XP TRANSACTION TYPE
 * ========================================
 */

export type XPTransaction = {
  id: string;

  profileId: string;

  source: string;

  amount: number;

  activityDate: string;

  referenceId: string | null;

  createdAt: string;
};

/*
 * ========================================
 * DATABASE ROW TYPE
 * ========================================
 */

type XPTransactionRow = {
  id: string;

  profile_id: string;

  source: string;

  amount: number;

  reason: string;

  activity_date: string;

  reference_id: string | null;

  created_at: string;
};

/*
 * ========================================
 * ROW → XP TRANSACTION
 * ========================================
 */

function mapXPTransaction(
  row: XPTransactionRow
): XPTransaction {
  return {
    id: row.id,

    profileId:
      row.profile_id,

    source:
      row.source,

    amount:
      row.amount,

    activityDate:
      row.activity_date,

    referenceId:
      row.reference_id,

    createdAt:
      row.created_at,
  };
}

/*
 * ========================================
 * CREATE XP TRANSACTION
 * ========================================
 *
 * Records one XP event.
 *
 * IMPORTANT:
 *
 * The current Gymate database contains
 * BOTH:
 *
 *   source
 *   reason
 *
 * "reason" is still NOT NULL because
 * older versions of the database created
 * the column that way.
 *
 * Therefore we populate BOTH fields.
 *
 * ========================================
 */

export async function createXPTransaction(
  profileId: string,
  amount: number,
  source: string,
  activityDate: string,
  referenceId?:
    | string
    | null
): Promise<XPTransaction> {
  const db =
    await getDatabase();

  /*
   * ======================================
   * VALIDATION
   * ======================================
   */

  if (!profileId) {
    throw new Error(
      'PROFILE_ID_REQUIRED'
    );
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    throw new Error(
      'INVALID_XP_AMOUNT'
    );
  }

  if (!source.trim()) {
    throw new Error(
      'XP_SOURCE_REQUIRED'
    );
  }

  if (!activityDate.trim()) {
    throw new Error(
      'XP_ACTIVITY_DATE_REQUIRED'
    );
  }

  /*
   * XP is always stored as an integer.
   */

  const xpAmount =
    Math.floor(amount);

  if (xpAmount <= 0) {
    throw new Error(
      'INVALID_XP_AMOUNT'
    );
  }

  /*
   * ======================================
   * VERIFY PROFILE
   * ======================================
   */

  const profileExists =
    await db.getFirstAsync<{
      id: string;
    }>(
      `
        SELECT id
        FROM profiles
        WHERE id = ?
        LIMIT 1;
      `,
      profileId
    );

  if (!profileExists) {
    throw new Error(
      'PROFILE_NOT_FOUND'
    );
  }

  /*
   * ======================================
   * NORMALIZED VALUES
   * ======================================
   */

  const normalizedSource =
    source.trim();

  const normalizedDate =
    activityDate.trim();

  const normalizedReference =
    referenceId
      ? referenceId.trim()
      : null;

  /*
   * ======================================
   * DUPLICATE CHECK
   * ======================================
   *
   * Same:
   *
   * profile
   * source
   * reference
   *
   * = same XP event.
   */

  if (
    normalizedReference
  ) {
    const existing =
      await findXPTransactionByReference(
        profileId,
        normalizedSource,
        normalizedReference
      );

    if (existing) {
      return existing;
    }
  }

  /*
   * ======================================
   * CREATE TRANSACTION ID
   * ======================================
   */

  const id =
    `xp-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}`;

  const now =
    new Date().toISOString();

  /*
   * ======================================
   * INSERT TRANSACTION
   * ======================================
   *
   * IMPORTANT:
   *
   * We insert BOTH:
   *
   *   source
   *   reason
   *
   * because the existing database has:
   *
   *   reason TEXT NOT NULL
   *
   * We keep reason equal to source for
   * compatibility with the existing schema.
   *
   * ======================================
   */

  await db.runAsync(
    `
      INSERT INTO xp_transactions (
        id,
        profile_id,
        source,
        amount,
        reason,
        activity_date,
        reference_id,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `,
    id,
    profileId,
    normalizedSource,
    xpAmount,
    normalizedSource,
    normalizedDate,
    normalizedReference,
    now
  );

  /*
   * ======================================
   * GET CREATED TRANSACTION
   * ======================================
   */

  const created =
    await db.getFirstAsync<XPTransactionRow>(
      `
        SELECT *
        FROM xp_transactions
        WHERE id = ?
        LIMIT 1;
      `,
      id
    );

  if (!created) {
    throw new Error(
      'FAILED_TO_CREATE_XP_TRANSACTION'
    );
  }

  return mapXPTransaction(
    created
  );
}

/*
 * ========================================
 * FIND BY REFERENCE
 * ========================================
 */

async function findXPTransactionByReference(
  profileId: string,
  source: string,
  referenceId: string
): Promise<XPTransaction | null> {
  const db =
    await getDatabase();

  const row =
    await db.getFirstAsync<XPTransactionRow>(
      `
        SELECT *
        FROM xp_transactions
        WHERE profile_id = ?
        AND source = ?
        AND reference_id = ?
        LIMIT 1;
      `,
      profileId,
      source,
      referenceId
    );

  if (!row) {
    return null;
  }

  return mapXPTransaction(
    row
  );
}

/*
 * ========================================
 * FIND XP TRANSACTION
 * ========================================
 */

export async function findXPTransaction(
  profileId: string,
  source: string,
  referenceId: string
): Promise<XPTransaction | null> {
  if (!profileId) {
    return null;
  }

  if (!source.trim()) {
    return null;
  }

  if (!referenceId) {
    return null;
  }

  return findXPTransactionByReference(
    profileId,
    source.trim(),
    referenceId
  );
}

/*
 * ========================================
 * HAS XP TRANSACTION
 * ========================================
 */

export async function hasXPTransaction(
  profileId: string,
  source: string,
  referenceId: string
): Promise<boolean> {
  const transaction =
    await findXPTransaction(
      profileId,
      source,
      referenceId
    );

  return (
    transaction !== null
  );
}

/*
 * ========================================
 * GET PROFILE XP TRANSACTIONS
 * ========================================
 */

export async function getXPTransactions(
  profileId: string
): Promise<XPTransaction[]> {
  const db =
    await getDatabase();

  if (!profileId) {
    return [];
  }

  const rows =
    await db.getAllAsync<XPTransactionRow>(
      `
        SELECT *
        FROM xp_transactions
        WHERE profile_id = ?
        ORDER BY created_at DESC;
      `,
      profileId
    );

  return rows.map(
    mapXPTransaction
  );
}

/*
 * ========================================
 * GET XP TRANSACTIONS BY SOURCE
 * ========================================
 */

export async function getXPTransactionsBySource(
  profileId: string,
  source: string
): Promise<XPTransaction[]> {
  const db =
    await getDatabase();

  if (!profileId) {
    return [];
  }

  if (!source.trim()) {
    return [];
  }

  const rows =
    await db.getAllAsync<XPTransactionRow>(
      `
        SELECT *
        FROM xp_transactions
        WHERE profile_id = ?
        AND source = ?
        ORDER BY created_at DESC;
      `,
      profileId,
      source.trim()
    );

  return rows.map(
    mapXPTransaction
  );
}

/*
 * ========================================
 * GET XP FOR DATE
 * ========================================
 */

export async function getXPTransactionsForDate(
  profileId: string,
  activityDate: string
): Promise<XPTransaction[]> {
  const db =
    await getDatabase();

  if (!profileId) {
    return [];
  }

  if (!activityDate.trim()) {
    return [];
  }

  const rows =
    await db.getAllAsync<XPTransactionRow>(
      `
        SELECT *
        FROM xp_transactions
        WHERE profile_id = ?
        AND activity_date = ?
        ORDER BY created_at DESC;
      `,
      profileId,
      activityDate.trim()
    );

  return rows.map(
    mapXPTransaction
  );
}

/*
 * ========================================
 * GET TOTAL XP FROM TRANSACTIONS
 * ========================================
 */

export async function getTotalXPFromTransactions(
  profileId: string
): Promise<number> {
  const db =
    await getDatabase();

  if (!profileId) {
    return 0;
  }

  const row =
    await db.getFirstAsync<{
      total_xp:
        | number
        | null;
    }>(
      `
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS total_xp
        FROM xp_transactions
        WHERE profile_id = ?;
      `,
      profileId
    );

  return (
    row?.total_xp ?? 0
  );
}

/*
 * ========================================
 * GET XP BY SOURCE
 * ========================================
 */

export async function getXPBySource(
  profileId: string
): Promise<
  Record<string, number>
> {
  const db =
    await getDatabase();

  if (!profileId) {
    return {};
  }

  const rows =
    await db.getAllAsync<{
      source: string;

      total_xp: number;
    }>(
      `
        SELECT
          source,
          COALESCE(
            SUM(amount),
            0
          ) AS total_xp
        FROM xp_transactions
        WHERE profile_id = ?
        GROUP BY source;
        `,
      profileId
    );

  const result:
    Record<string, number> =
    {};

  for (const row of rows) {
    result[row.source] =
      row.total_xp;
  }

  return result;
}