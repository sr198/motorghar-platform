/**
 * Prisma Session Repository Unit Tests
 * Testing with mocked Prisma client
 * Target: ≥80% coverage
 */

import { PrismaSessionRepository } from './prisma-session.repository.js';
import type { CreateSessionDTO, DeviceInfo } from '../interfaces/index.js';
import type { PrismaClient } from '@prisma/client';

// Mock Prisma Client
const createMockPrisma = () => ({
  session: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
});

describe('PrismaSessionRepository', () => {
  let repository: PrismaSessionRepository;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const mockDeviceInfo: DeviceInfo = {
    userAgent: 'Mozilla/5.0',
    deviceType: 'desktop',
    os: 'macOS',
    browser: 'Chrome',
  };

  const mockSessionData: CreateSessionDTO = {
    userId: 'user-123',
    refreshToken: 'refresh-token-abc',
    deviceInfo: mockDeviceInfo,
    ipAddress: '192.168.1.1',
    expiresAt: new Date('2025-02-01'),
    lastActivityAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    repository = new PrismaSessionRepository(
      mockPrisma as unknown as PrismaClient
    );
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const mockCreatedSession = {
        id: 'session-123',
        ...mockSessionData,
        deviceInfo: mockDeviceInfo as Record<string, unknown>,
        createdAt: new Date('2025-01-01'),
        revokedAt: null,
      };

      mockPrisma.session.create.mockResolvedValue(mockCreatedSession);

      const result = await repository.create(mockSessionData);

      expect(result).toEqual({
        id: 'session-123',
        userId: mockSessionData.userId,
        refreshToken: mockSessionData.refreshToken,
        deviceInfo: mockDeviceInfo,
        ipAddress: mockSessionData.ipAddress,
        expiresAt: mockSessionData.expiresAt,
        lastActivityAt: mockSessionData.lastActivityAt,
        createdAt: mockCreatedSession.createdAt,
        revokedAt: null,
      });

      expect(mockPrisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: mockSessionData.userId,
          refreshToken: mockSessionData.refreshToken,
          deviceInfo: mockDeviceInfo,
          ipAddress: mockSessionData.ipAddress,
          expiresAt: mockSessionData.expiresAt,
          lastActivityAt: mockSessionData.lastActivityAt,
        },
      });
    });
  });

  describe('findByRefreshToken', () => {
    it('should return session when found', async () => {
      const mockSession = {
        id: 'session-123',
        userId: 'user-123',
        refreshToken: 'refresh-token-abc',
        deviceInfo: mockDeviceInfo as Record<string, unknown>,
        ipAddress: '192.168.1.1',
        expiresAt: new Date('2025-02-01'),
        lastActivityAt: new Date('2025-01-01'),
        createdAt: new Date('2025-01-01'),
        revokedAt: null,
      };

      mockPrisma.session.findUnique.mockResolvedValue(mockSession);

      const result = await repository.findByRefreshToken('refresh-token-abc');

      expect(result).toEqual({
        ...mockSession,
        deviceInfo: mockDeviceInfo,
      });

      expect(mockPrisma.session.findUnique).toHaveBeenCalledWith({
        where: { refreshToken: 'refresh-token-abc' },
      });
    });

    it('should return null when session not found', async () => {
      mockPrisma.session.findUnique.mockResolvedValue(null);

      const result = await repository.findByRefreshToken('nonexistent-token');

      expect(result).toBeNull();
    });
  });

  describe('findActiveByUser', () => {
    it('should return active sessions for user', async () => {
      const now = new Date('2025-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      const mockSessions = [
        {
          id: 'session-1',
          userId: 'user-123',
          refreshToken: 'token-1',
          deviceInfo: mockDeviceInfo as Record<string, unknown>,
          ipAddress: '192.168.1.1',
          expiresAt: new Date('2025-02-01'),
          lastActivityAt: new Date('2025-01-14'),
          createdAt: new Date('2025-01-10'),
          revokedAt: null,
        },
        {
          id: 'session-2',
          userId: 'user-123',
          refreshToken: 'token-2',
          deviceInfo: mockDeviceInfo as Record<string, unknown>,
          ipAddress: '192.168.1.2',
          expiresAt: new Date('2025-02-01'),
          lastActivityAt: new Date('2025-01-15'),
          createdAt: new Date('2025-01-12'),
          revokedAt: null,
        },
      ];

      mockPrisma.session.findMany.mockResolvedValue(mockSessions);

      const result = await repository.findActiveByUser('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[1].id).toBe('session-2');

      expect(mockPrisma.session.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revokedAt: null,
          expiresAt: {
            gt: expect.any(Date),
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      jest.useRealTimers();
    });

    it('should return empty array when no active sessions', async () => {
      mockPrisma.session.findMany.mockResolvedValue([]);

      const result = await repository.findActiveByUser('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('revoke', () => {
    it('should revoke a specific session', async () => {
      mockPrisma.session.update.mockResolvedValue({});

      await repository.revoke('session-123');

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all sessions for user', async () => {
      mockPrisma.session.updateMany.mockResolvedValue({ count: 3 });

      await repository.revokeAllForUser('user-123');

      expect(mockPrisma.session.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          revokedAt: null,
        },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });

  describe('updateLastActivity', () => {
    it('should update session last activity timestamp', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');
      mockPrisma.session.update.mockResolvedValue({});

      await repository.updateLastActivity('session-123', timestamp);

      expect(mockPrisma.session.update).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        data: { lastActivityAt: timestamp },
      });
    });
  });

  describe('cleanupExpired', () => {
    it('should delete expired sessions and return count', async () => {
      const now = new Date('2025-01-15');
      jest.useFakeTimers();
      jest.setSystemTime(now);

      mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 });

      const result = await repository.cleanupExpired();

      expect(result).toBe(5);
      expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });

      jest.useRealTimers();
    });

    it('should return 0 when no expired sessions', async () => {
      mockPrisma.session.deleteMany.mockResolvedValue({ count: 0 });

      const result = await repository.cleanupExpired();

      expect(result).toBe(0);
    });
  });
});
