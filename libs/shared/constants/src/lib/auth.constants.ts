/**
 * Authentication & Security Constants
 * JWT, password hashing, and security-related settings
 * Reference: Constitution § 4 - Security & Data
 */

// JWT Configuration
export const MIN_JWT_SECRET_LENGTH = 32;
export const JWT_ACCESS_EXPIRY_DEFAULT = '15m';
export const JWT_REFRESH_EXPIRY_DEFAULT = '7d';

// Password Hashing
export const BCRYPT_SALT_ROUNDS_DEFAULT = 12;
export const BCRYPT_SALT_ROUNDS_MIN = 10;
export const BCRYPT_SALT_ROUNDS_MAX = 15;

// Session & Token
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days
export const TOKEN_BLACKLIST_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

// Security Headers
export const SECURITY_HEADERS = {
  HSTS_MAX_AGE: 31536000, // 1 year
  FRAME_DENY: 'DENY',
  CONTENT_TYPE_NO_SNIFF: 'nosniff',
  XSS_PROTECTION: '1; mode=block',
} as const;
