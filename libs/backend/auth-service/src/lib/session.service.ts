/**
 * SessionService
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Reference: Design Doc § 4.2.3
 *
 * Business logic for session management:
 * - Create sessions with max limit enforcement
 * - Validate sessions
 * - List user sessions
 * - Revoke sessions
 * - Cleanup expired sessions
 */

import type {
  ISessionRepository,
  DeviceInfo,
  Session,
} from '@motorghar-platform/repositories';

/**
 * Configuration for SessionService
 */
export interface SessionServiceConfig {
  maxSessionsPerUser: number;
  sessionTTL: number; // in seconds
}

/**
 * SessionService - Handles session management business logic
 */
export class SessionService {
  constructor(
    private readonly sessionRepo: ISessionRepository,
    private readonly config: SessionServiceConfig
  ) {}

  /**
   * Create new session for user
   * Enforces max sessions limit by revoking oldest sessions
   *
   * @param userId - User ID
   * @param refreshToken - Refresh token for the session
   * @param deviceInfo - Device information
   * @param ipAddress - Client IP address
   * @returns Created session
   */
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<Session> {
    // Enforce max sessions per user
    await this.enforceMaxSessions(userId);

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + this.config.sessionTTL);

    // Create session
    return this.sessionRepo.create({
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
      lastActivityAt: new Date(),
    });
  }

  /**
   * Validate session by refresh token
   * Checks if session exists, is not revoked, and not expired
   *
   * @param refreshToken - Refresh token
   * @returns Session if valid, null otherwise
   */
  async validateSession(refreshToken: string): Promise<Session | null> {
    const session = await this.sessionRepo.findByRefreshToken(refreshToken);

    if (!session) {
      return null;
    }

    // Check if revoked
    if (session.revokedAt) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  /**
   * List all active sessions for user
   * Active = not revoked and not expired
   *
   * @param userId - User ID
   * @returns Array of active sessions (sorted by createdAt desc)
   */
  async listUserSessions(userId: string): Promise<Session[]> {
    return this.sessionRepo.findActiveByUser(userId);
  }

  /**
   * Revoke specific session
   *
   * @param sessionId - Session ID
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepo.revoke(sessionId);
  }

  /**
   * Revoke all sessions for user
   *
   * @param userId - User ID
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllForUser(userId);
  }

  /**
   * Update session activity timestamp
   *
   * @param sessionId - Session ID
   */
  async updateActivity(sessionId: string): Promise<void> {
    await this.sessionRepo.updateLastActivity(sessionId, new Date());
  }

  /**
   * Cleanup expired sessions (background job)
   * Deletes sessions where expiresAt < now
   *
   * @returns Count of deleted sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.sessionRepo.cleanupExpired();
  }

  /**
   * Enforce max sessions per user
   * Removes oldest sessions if limit exceeded
   *
   * @param userId - User ID
   * @private
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    if (this.config.maxSessionsPerUser <= 0) {
      return; // Unlimited sessions
    }

    const activeSessions = await this.sessionRepo.findActiveByUser(userId);

    if (activeSessions.length >= this.config.maxSessionsPerUser) {
      // Sort by creation date (oldest first) and revoke oldest
      const sessionsToRevoke = activeSessions
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, activeSessions.length - this.config.maxSessionsPerUser + 1);

      for (const session of sessionsToRevoke) {
        await this.sessionRepo.revoke(session.id);
      }
    }
  }
}

// Re-export types for convenience
export type { DeviceInfo, Session };
