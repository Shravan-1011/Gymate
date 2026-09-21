import * as Crypto from 'expo-crypto';

/*
 * ========================================
 * PASSWORD HASHING
 * ========================================
 *
 * Passwords are NEVER stored directly.
 *
 * We store:
 *
 *     salt + hash
 *
 * This means the original password cannot
 * simply be read from the SQLite database.
 * ========================================
 */

const SALT_LENGTH = 32;

/*
 * ========================================
 * RANDOM SALT
 * ========================================
 */

function generateSalt(): string {
  const bytes =
    Crypto.getRandomBytes(SALT_LENGTH);

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, '0')
    )
    .join('');
}

/*
 * ========================================
 * HASH PASSWORD
 * ========================================
 *
 * Returns:
 *
 *     salt:hash
 *
 * The salt is unique for every password.
 */

export async function hashPassword(
  password: string
): Promise<string> {
  if (!password) {
    throw new Error(
      'Password cannot be empty.'
    );
  }

  const salt = generateSalt();

  const hash =
    await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${password}`
    );

  return `${salt}:${hash}`;
}

/*
 * ========================================
 * VERIFY PASSWORD
 * ========================================
 */

export async function verifyPassword(
  password: string,
  storedPasswordHash: string
): Promise<boolean> {
  if (
    !password ||
    !storedPasswordHash
  ) {
    return false;
  }

  const separatorIndex =
    storedPasswordHash.indexOf(':');

  if (separatorIndex === -1) {
    return false;
  }

  const salt =
    storedPasswordHash.substring(
      0,
      separatorIndex
    );

  const storedHash =
    storedPasswordHash.substring(
      separatorIndex + 1
    );

  if (!salt || !storedHash) {
    return false;
  }

  const calculatedHash =
    await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `${salt}:${password}`
    );

  return calculatedHash === storedHash;
}