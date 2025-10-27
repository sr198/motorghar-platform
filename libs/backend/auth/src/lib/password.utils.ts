/**
 * Password Utilities
 * Bcrypt hashing and validation
 * Reference: Constitution § 4 - Security & Data
 * Reference: Constitution § 10 - No hardcoded values
 *
 * Note: All parameters must be provided by caller (from env config)
 */

import bcrypt from 'bcrypt';

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (from env config, e.g., 10)
 * @returns Hashed password
 */
export async function hashPassword(
  password: string,
  saltRounds: number
): Promise<string> {
  return bcrypt.hash(password, saltRounds);
}

/**
 * Verify a plain text password against a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}