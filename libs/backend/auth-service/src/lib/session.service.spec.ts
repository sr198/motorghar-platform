/**
 * SessionService Unit Tests
 * Tests all session management business logic with mocked repositories
 * Reference: Constitution § 3 - Testing Requirements (≥80% coverage)
 */

import { SessionService, type SessionServiceConfig } from './session.service.js';
import type {
  ISessionRepository,
  Session,
  DeviceInfo,
} from '@motorghar-platform/repositories';

describe('SessionService', () => {
  let sessionService: SessionService;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;
  let config: SessionServiceConfig;

  const mockDeviceInfo: DeviceInfo = {
    userAgent: 'Mozilla/5.0',
    deviceType: 'desktop',
    os: 'macOS',
    browser: 'Chrome',
  };

  const mockSession: Session = {
    id: 'session-123',
    userId: 'user-123',
    refreshToken: 'refresh-token-123',
    deviceInfo: mockDeviceInfo,
    ipAddress: '127.0.0.1',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    lastActivityAt: new Date(),
    createdAt: new Date(),
    revokedAt: null,
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock repository methods
    mockSessionRepo = {
      create: jest.fn(),
      findByRefreshToken: jest.fn(),
      findActiveByUser: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      updateLastActivity: jest.fn(),
      cleanupExpired: jest.fn(),
    };

    config = {
      maxSessionsPerUser: 5,
      sessionTTL: 7 * 24 * 60 * 60, // 7 days in seconds
    };

    sessionService = new SessionService(mockSessionRepo, config);
  });

  describe('createSession', () => {
    it('should successfully create a new session', async () => {
      // Arrange
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      const result = await sessionService.createSession(
        'user-123',
        'refresh-token-123',
        mockDeviceInfo,
        '127.0.0.1'
      );

      // Assert
      expect(result).toEqual(mockSession);
      expect(mockSessionRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-123',
          refreshToken: 'refresh-token-123',
          deviceInfo: mockDeviceInfo,
          ipAddress: '127.0.0.1',
          expiresAt: expect.any(Date),
          lastActivityAt: expect.any(Date),
        })
      );
    });

    it('should enforce max sessions per user', async () => {
      // Arrange
      const existingSessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      }));

      mockSessionRepo.findActiveByUser.mockResolvedValue(existingSessions);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      await sessionService.createSession(
        'user-123',
        'refresh-token-123',
        mockDeviceInfo,
        '127.0.0.1'
      );

      // Assert
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-4'); // Oldest session
    });

    it('should not enforce max sessions if limit is 0 (unlimited)', async () => {
      // Arrange
      const unlimitedConfig = { ...config, maxSessionsPerUser: 0 };
      const unlimitedService = new SessionService(mockSessionRepo, unlimitedConfig);

      const existingSessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
      }));

      mockSessionRepo.findActiveByUser.mockResolvedValue(existingSessions);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      await unlimitedService.createSession(
        'user-123',
        'refresh-token-123',
        mockDeviceInfo,
        '127.0.0.1'
      );

      // Assert
      expect(mockSessionRepo.revoke).not.toHaveBeenCalled();
    });

    it('should revoke multiple old sessions when limit exceeded by more than one', async () => {
      // Arrange
      const configWith2Max = { ...config, maxSessionsPerUser: 2 };
      const serviceWith2Max = new SessionService(mockSessionRepo, configWith2Max);

      const existingSessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        createdAt: new Date(Date.now() - i * 1000), // Older sessions have higher index
      }));

      mockSessionRepo.findActiveByUser.mockResolvedValue(existingSessions);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      await serviceWith2Max.createSession(
        'user-123',
        'refresh-token-123',
        mockDeviceInfo,
        '127.0.0.1'
      );

      // Assert
      // Should revoke 4 oldest sessions (indices 1-4) to make room for new one
      expect(mockSessionRepo.revoke).toHaveBeenCalledTimes(4);
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-1');
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-2');
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-3');
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-4');
    });

    it('should calculate correct expiry date based on TTL', async () => {
      // Arrange
      const customTTL = 3600; // 1 hour
      const customConfig = { ...config, sessionTTL: customTTL };
      const customService = new SessionService(mockSessionRepo, customConfig);

      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      const beforeCreate = Date.now();

      // Act
      await customService.createSession(
        'user-123',
        'refresh-token-123',
        mockDeviceInfo,
        '127.0.0.1'
      );

      const afterCreate = Date.now();

      // Assert
      const createCall = mockSessionRepo.create.mock.calls[0][0];
      const expiresAt = createCall.expiresAt.getTime();

      // Expiry should be approximately TTL seconds from now
      const expectedMin = beforeCreate + customTTL * 1000;
      const expectedMax = afterCreate + customTTL * 1000;

      expect(expiresAt).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAt).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('validateSession', () => {
    it('should return session if valid', async () => {
      // Arrange
      mockSessionRepo.findByRefreshToken.mockResolvedValue(mockSession);

      // Act
      const result = await sessionService.validateSession('refresh-token-123');

      // Assert
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found', async () => {
      // Arrange
      mockSessionRepo.findByRefreshToken.mockResolvedValue(null);

      // Act
      const result = await sessionService.validateSession('nonexistent-token');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if session is revoked', async () => {
      // Arrange
      const revokedSession = { ...mockSession, revokedAt: new Date() };
      mockSessionRepo.findByRefreshToken.mockResolvedValue(revokedSession);

      // Act
      const result = await sessionService.validateSession('refresh-token-123');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if session is expired', async () => {
      // Arrange
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      mockSessionRepo.findByRefreshToken.mockResolvedValue(expiredSession);

      // Act
      const result = await sessionService.validateSession('refresh-token-123');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('listUserSessions', () => {
    it('should return all active sessions for user', async () => {
      // Arrange
      const sessions = [mockSession, { ...mockSession, id: 'session-456' }];
      mockSessionRepo.findActiveByUser.mockResolvedValue(sessions);

      // Act
      const result = await sessionService.listUserSessions('user-123');

      // Assert
      expect(result).toEqual(sessions);
      expect(mockSessionRepo.findActiveByUser).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array if no active sessions', async () => {
      // Arrange
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);

      // Act
      const result = await sessionService.listUserSessions('user-123');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('revokeSession', () => {
    it('should successfully revoke a session', async () => {
      // Act
      await sessionService.revokeSession('session-123');

      // Assert
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-123');
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions for user', async () => {
      // Act
      await sessionService.revokeAllSessions('user-123');

      // Assert
      expect(mockSessionRepo.revokeAllForUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('updateActivity', () => {
    it('should update session activity timestamp', async () => {
      // Act
      await sessionService.updateActivity('session-123');

      // Assert
      expect(mockSessionRepo.updateLastActivity).toHaveBeenCalledWith(
        'session-123',
        expect.any(Date)
      );
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should cleanup expired sessions and return count', async () => {
      // Arrange
      mockSessionRepo.cleanupExpired.mockResolvedValue(10);

      // Act
      const result = await sessionService.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(10);
      expect(mockSessionRepo.cleanupExpired).toHaveBeenCalled();
    });

    it('should return 0 if no sessions were cleaned up', async () => {
      // Arrange
      mockSessionRepo.cleanupExpired.mockResolvedValue(0);

      // Act
      const result = await sessionService.cleanupExpiredSessions();

      // Assert
      expect(result).toBe(0);
    });
  });
});
