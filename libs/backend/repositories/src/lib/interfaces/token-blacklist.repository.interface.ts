/**
 * Token Blacklist Repository Interface
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Reference: Design Doc § 4.1.3
 *
 * Used for revoking JWT access tokens before they expire.
 * Typically backed by Redis with TTL for automatic cleanup.
 */

/**
 * Token Blacklist Repository Interface
 * Abstracts data access for token revocation
 */
export interface ITokenBlacklistRepository {
  /**
   * Add token to blacklist with TTL
   * Token will be automatically removed after TTL expires
   * @param token - JWT access token to blacklist
   * @param ttlSeconds - Time to live in seconds
   */
  add(token: string, ttlSeconds: number): Promise<void>;

  /**
   * Check if token is blacklisted
   * @param token - JWT access token to check
   * @returns true if token is blacklisted, false otherwise
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * Remove token from blacklist (manual cleanup)
   * Useful for testing or manual intervention
   * @param token - JWT access token to remove
   */
  remove(token: string): Promise<void>;
}