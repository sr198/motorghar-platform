/**
 * Prisma Session Repository Implementation
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Implements ISessionRepository using Prisma ORM
 */

import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type {
  ISessionRepository,
  Session,
  CreateSessionDTO,
  DeviceInfo,
} from '../interfaces/index.js';

/**
 * Type guard to validate DeviceInfo structure
 */
function isValidDeviceInfo(value: unknown): value is DeviceInfo {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.userAgent === 'string' &&
    (obj.deviceType === 'mobile' ||
      obj.deviceType === 'tablet' ||
      obj.deviceType === 'desktop' ||
      obj.deviceType === 'unknown') &&
    (obj.os === undefined || typeof obj.os === 'string') &&
    (obj.browser === undefined || typeof obj.browser === 'string')
  );
}

/**
 * Convert DeviceInfo to Prisma JsonValue
 * Creates a proper JSON object that Prisma can store
 */
function deviceInfoToJson(deviceInfo: DeviceInfo): Prisma.InputJsonValue {
  // Explicitly construct the object to ensure it's a valid JSON structure
  const jsonObject: Record<string, string> = {
    userAgent: deviceInfo.userAgent,
    deviceType: deviceInfo.deviceType,
  };

  // Add optional fields if they exist
  if (deviceInfo.os !== undefined) {
    jsonObject.os = deviceInfo.os;
  }
  if (deviceInfo.browser !== undefined) {
    jsonObject.browser = deviceInfo.browser;
  }

  return jsonObject;
}

/**
 * Parse and validate DeviceInfo from Prisma JsonValue
 */
function parseDeviceInfo(value: Prisma.JsonValue): DeviceInfo {
  if (!isValidDeviceInfo(value)) {
    throw new Error(
      `Invalid deviceInfo format: ${JSON.stringify(value)}`
    );
  }
  return value;
}

/**
 * Prisma implementation of Session Repository
 */
export class PrismaSessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new session
   */
  async create(session: CreateSessionDTO): Promise<Session> {
    const created = await this.prisma.session.create({
      data: {
        userId: session.userId,
        refreshToken: session.refreshToken,
        deviceInfo: deviceInfoToJson(session.deviceInfo),
        ipAddress: session.ipAddress,
        expiresAt: session.expiresAt,
        lastActivityAt: session.lastActivityAt,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      refreshToken: created.refreshToken,
      deviceInfo: parseDeviceInfo(created.deviceInfo),
      ipAddress: created.ipAddress,
      expiresAt: created.expiresAt,
      lastActivityAt: created.lastActivityAt,
      createdAt: created.createdAt,
      revokedAt: created.revokedAt,
    };
  }

  /**
   * Find session by refresh token
   */
  async findByRefreshToken(token: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({
      where: { refreshToken: token },
    });

    if (!session) {
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      deviceInfo: parseDeviceInfo(session.deviceInfo),
      ipAddress: session.ipAddress,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    };
  }

  /**
   * Find all active sessions for a user
   * Active = not revoked and not expired
   */
  async findActiveByUser(userId: string): Promise<Session[]> {
    const now = new Date();
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      refreshToken: session.refreshToken,
      deviceInfo: parseDeviceInfo(session.deviceInfo),
      ipAddress: session.ipAddress,
      expiresAt: session.expiresAt,
      lastActivityAt: session.lastActivityAt,
      createdAt: session.createdAt,
      revokedAt: session.revokedAt,
    }));
  }

  /**
   * Revoke a specific session
   */
  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all sessions for a user
   */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Update session last activity timestamp
   */
  async updateLastActivity(sessionId: string, timestamp: Date): Promise<void> {
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { lastActivityAt: timestamp },
    });
  }

  /**
   * Cleanup expired sessions
   * Deletes sessions where expiresAt < now
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    return result.count;
  }
}