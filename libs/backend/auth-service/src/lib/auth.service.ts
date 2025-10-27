/**
 * AuthService
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Reference: Design Doc § 4.2.1
 *
 * Business logic for authentication operations:
 * - Login with email/password
 * - Token refresh
 * - Logout (single and all devices)
 * - Token verification
 * - Session management
 */

import type {
  IUserRepository,
  ISessionRepository,
  ITokenBlacklistRepository,
  DeviceInfo,
  Session,
  UserRole,
} from '@motorghar-platform/repositories';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  type TokenPayload,
} from '@motorghar-platform/auth';
import { verifyPassword } from '@motorghar-platform/auth';

/**
 * Configuration for AuthService
 * All values come from environment variables
 */
export interface AuthServiceConfig {
  jwtSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  maxSessionsPerUser: number;
  jwtIssuer?: string;
  jwtAudience?: string;
}

/**
 * Result returned from successful login
 */
export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

/**
 * Result returned from token refresh
 */
export interface RefreshResult {
  accessToken: string;
  expiresIn: number;
}

/**
 * AuthService - Handles authentication business logic
 */
export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly blacklistRepo: ITokenBlacklistRepository,
    private readonly config: AuthServiceConfig
  ) {}

  /**
   * Login with email and password
   * Creates new session and returns tokens
   *
   * @param email - User email
   * @param password - Plain text password
   * @param deviceInfo - Device information
   * @param ipAddress - Client IP address
   * @returns Login result with tokens and user info
   * @throws Error if credentials are invalid or user not found
   */
  async login(
    email: string,
    password: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<LoginResult> {
    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    const isActive = await this.userRepo.isActive(user.id);
    if (!isActive) {
      throw new Error('User account is inactive');
    }

    // Create token payload
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate tokens
    const accessToken = generateAccessToken(
      tokenPayload,
      this.config.jwtSecret,
      this.config.accessTokenExpiry,
      this.config.jwtIssuer,
      this.config.jwtAudience
    );

    const refreshToken = generateRefreshToken(
      tokenPayload,
      this.config.jwtSecret,
      this.config.refreshTokenExpiry,
      this.config.jwtIssuer,
      this.config.jwtAudience
    );

    // Enforce max sessions per user
    await this.enforceMaxSessions(user.id);

    // Create session
    const expiresAt = this.calculateExpiryDate(this.config.refreshTokenExpiry);
    await this.sessionRepo.create({
      userId: user.id,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt,
      lastActivityAt: new Date(),
    });

    // Update last login timestamp
    await this.userRepo.updateLastLogin(user.id, new Date());

    // Parse expiry to seconds for response
    const expiresIn = this.parseExpiryToSeconds(this.config.accessTokenExpiry);

    return {
      accessToken,
      refreshToken,
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * @param refreshToken - Refresh token
   * @returns New access token
   * @throws Error if refresh token is invalid or expired
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult> {
    // Verify refresh token
    let payload: TokenPayload;
    try {
      payload = verifyToken(
        refreshToken,
        this.config.jwtSecret,
        this.config.jwtIssuer,
        this.config.jwtAudience
      );
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    // Find session by refresh token
    const session = await this.sessionRepo.findByRefreshToken(refreshToken);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if session is revoked
    if (session.revokedAt) {
      throw new Error('Session has been revoked');
    }

    // Check if session is expired
    if (session.expiresAt < new Date()) {
      throw new Error('Session has expired');
    }

    // Verify user is still active
    const isActive = await this.userRepo.isActive(payload.userId);
    if (!isActive) {
      throw new Error('User account is inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      payload,
      this.config.jwtSecret,
      this.config.accessTokenExpiry,
      this.config.jwtIssuer,
      this.config.jwtAudience
    );

    // Update session activity
    await this.sessionRepo.updateLastActivity(session.id, new Date());

    const expiresIn = this.parseExpiryToSeconds(this.config.accessTokenExpiry);

    return {
      accessToken,
      expiresIn,
    };
  }

  /**
   * Logout - revoke session and blacklist tokens
   *
   * @param userId - User ID
   * @param accessToken - Access token to blacklist
   * @param refreshToken - Refresh token to revoke session
   * @throws Error if session not found
   */
  async logout(
    userId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    // Find and revoke session
    const session = await this.sessionRepo.findByRefreshToken(refreshToken);
    if (session && session.userId === userId) {
      await this.sessionRepo.revoke(session.id);
    }

    // Blacklist access token
    const ttl = this.parseExpiryToSeconds(this.config.accessTokenExpiry);
    await this.blacklistRepo.add(accessToken, ttl);
  }

  /**
   * Logout from all devices - revoke all sessions
   *
   * @param userId - User ID
   */
  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllForUser(userId);
  }

  /**
   * Verify and decode access token
   * Checks if token is valid and not blacklisted
   *
   * @param token - Access token
   * @returns Decoded token payload
   * @throws Error if token is invalid, expired, or blacklisted
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    // Check if token is blacklisted
    const isBlacklisted = await this.blacklistRepo.isBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    // Verify token
    try {
      return verifyToken(
        token,
        this.config.jwtSecret,
        this.config.jwtIssuer,
        this.config.jwtAudience
      );
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Get active sessions for user
   *
   * @param userId - User ID
   * @returns Array of active sessions
   */
  async getActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepo.findActiveByUser(userId);
  }

  /**
   * Revoke a specific session
   * Validates that session belongs to user
   *
   * @param userId - User ID
   * @param sessionId - Session ID to revoke
   * @throws Error if session not found or doesn't belong to user
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const sessions = await this.sessionRepo.findActiveByUser(userId);
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error('Session not found or already revoked');
    }

    await this.sessionRepo.revoke(sessionId);
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

  /**
   * Calculate expiry date from expiry string
   *
   * @param expiry - Expiry string (e.g., '15m', '7d')
   * @returns Expiry date
   * @private
   */
  private calculateExpiryDate(expiry: string): Date {
    const seconds = this.parseExpiryToSeconds(expiry);
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + seconds);
    return expiryDate;
  }

  /**
   * Parse expiry string to seconds
   * Supports formats: '15m', '7d', '1h', '30s'
   *
   * @param expiry - Expiry string
   * @returns Seconds
   * @private
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiry format: ${expiry}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        throw new Error(`Invalid expiry unit: ${unit}`);
    }
  }
}

// Re-export types for convenience
export type { TokenPayload, DeviceInfo, Session };
