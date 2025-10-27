/**
 * Session Repository Interface
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Reference: Design Doc § 4.1.2
 */

/**
 * Device information captured during session creation
 */
export interface DeviceInfo {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  browser?: string;
}

/**
 * Session entity type
 */
export interface Session {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
}

/**
 * DTO for creating a new session
 */
export type CreateSessionDTO = Omit<Session, 'id' | 'createdAt' | 'revokedAt'>;

/**
 * Session Repository Interface
 * Abstracts data access for session operations
 */
export interface ISessionRepository {
  /**
   * Create a new session
   * @param session - Session data without id, createdAt, revokedAt
   * @returns Created session with generated id
   */
  create(session: CreateSessionDTO): Promise<Session>;

  /**
   * Find session by refresh token
   * @param token - Refresh token
   * @returns Session or null if not found
   */
  findByRefreshToken(token: string): Promise<Session | null>;

  /**
   * Find all active sessions for a user
   * Active = not revoked and not expired
   * @param userId - User ID
   * @returns Array of active sessions (sorted by createdAt desc)
   */
  findActiveByUser(userId: string): Promise<Session[]>;

  /**
   * Revoke a specific session
   * Sets revokedAt timestamp
   * @param sessionId - Session ID
   */
  revoke(sessionId: string): Promise<void>;

  /**
   * Revoke all sessions for a user
   * Sets revokedAt timestamp for all user sessions
   * @param userId - User ID
   */
  revokeAllForUser(userId: string): Promise<void>;

  /**
   * Update session last activity timestamp
   * @param sessionId - Session ID
   * @param timestamp - Activity timestamp
   */
  updateLastActivity(sessionId: string, timestamp: Date): Promise<void>;

  /**
   * Cleanup expired sessions
   * Deletes sessions where expiresAt < now
   * @returns Count of deleted sessions
   */
  cleanupExpired(): Promise<number>;
}