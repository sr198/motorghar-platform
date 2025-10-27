/**
 * Authentication & Security Constants
 * System-level constants only - validation rules are inline in schemas
 *
 * Note: Validation rules (min lengths, etc.) will be moved to config service in Phase 2+
 * Reference: Constitution § 4 - Security & Data
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 */

// User Roles (matching Prisma UserRole enum)
export const USER_ROLE = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
} as const;

// Security Headers
export const SECURITY_HEADERS = {
  HSTS_MAX_AGE: 31536000, // 1 year
  FRAME_DENY: 'DENY',
  CONTENT_TYPE_NO_SNIFF: 'nosniff',
  XSS_PROTECTION: '1; mode=block',
} as const;
