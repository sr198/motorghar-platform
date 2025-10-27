/**
 * AuthService Unit Tests
 * Tests all authentication business logic with mocked repositories
 * Reference: Constitution § 3 - Testing Requirements (≥80% coverage)
 */

import { AuthService, type AuthServiceConfig } from './auth.service.js';
import type {
  IUserRepository,
  ISessionRepository,
  ITokenBlacklistRepository,
  User,
  Session,
  DeviceInfo,
} from '@motorghar-platform/repositories';
import * as authUtils from '@motorghar-platform/auth';

// Mock the auth utilities module
jest.mock('@motorghar-platform/auth');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockSessionRepo: jest.Mocked<ISessionRepository>;
  let mockBlacklistRepo: jest.Mocked<ITokenBlacklistRepository>;
  let config: AuthServiceConfig;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    name: 'Test User',
    phone: '+1234567890',
    role: 'ADMIN',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

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
    mockUserRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateLastLogin: jest.fn(),
      updatePassword: jest.fn(),
      isActive: jest.fn(),
      getRole: jest.fn(),
    };

    mockSessionRepo = {
      create: jest.fn(),
      findByRefreshToken: jest.fn(),
      findActiveByUser: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      updateLastActivity: jest.fn(),
      cleanupExpired: jest.fn(),
    };

    mockBlacklistRepo = {
      add: jest.fn(),
      isBlacklisted: jest.fn(),
      remove: jest.fn(),
    };

    config = {
      jwtSecret: 'test-secret-key-minimum-32-chars-long',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
      maxSessionsPerUser: 5,
      jwtIssuer: 'motorghar',
      jwtAudience: 'motorghar-client',
    };

    authService = new AuthService(
      mockUserRepo,
      mockSessionRepo,
      mockBlacklistRepo,
      config
    );
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      const result = await authService.login(
        'test@example.com',
        'password123',
        mockDeviceInfo,
        '127.0.0.1'
      );

      // Assert
      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 900, // 15 minutes in seconds
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      });
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(authUtils.verifyPassword).toHaveBeenCalledWith(
        'password123',
        mockUser.passwordHash
      );
      expect(mockUserRepo.updateLastLogin).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(Date)
      );
      expect(mockSessionRepo.create).toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login('nonexistent@example.com', 'password123', mockDeviceInfo, '127.0.0.1')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if password is invalid', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'wrongpassword', mockDeviceInfo, '127.0.0.1')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user is inactive', async () => {
      // Arrange
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(false);

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1')
      ).rejects.toThrow('User account is inactive');
    });

    it('should enforce max sessions per user', async () => {
      // Arrange
      const existingSessions = Array.from({ length: 5 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
        createdAt: new Date(Date.now() - i * 1000),
      }));

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue(existingSessions);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      await authService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1');

      // Assert
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith('session-4'); // Oldest session
    });

    it('should not enforce max sessions if limit is 0 (unlimited)', async () => {
      // Arrange
      const unlimitedConfig = { ...config, maxSessionsPerUser: 0 };
      const unlimitedAuthService = new AuthService(
        mockUserRepo,
        mockSessionRepo,
        mockBlacklistRepo,
        unlimitedConfig
      );

      const existingSessions = Array.from({ length: 10 }, (_, i) => ({
        ...mockSession,
        id: `session-${i}`,
      }));

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue(existingSessions);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      await unlimitedAuthService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1');

      // Assert
      expect(mockSessionRepo.revoke).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh access token', async () => {
      // Arrange
      const tokenPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(tokenPayload);
      mockSessionRepo.findByRefreshToken.mockResolvedValue(mockSession);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('new-access-token');

      // Act
      const result = await authService.refreshToken('refresh-token-123');

      // Assert
      expect(result).toEqual({
        accessToken: 'new-access-token',
        expiresIn: 900,
      });
      expect(mockSessionRepo.updateLastActivity).toHaveBeenCalledWith(
        mockSession.id,
        expect.any(Date)
      );
    });

    it('should throw error if refresh token is invalid', async () => {
      // Arrange
      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(
        'Invalid or expired refresh token'
      );
    });

    it('should throw error if session not found', async () => {
      // Arrange
      const tokenPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(tokenPayload);
      mockSessionRepo.findByRefreshToken.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken('refresh-token-123')).rejects.toThrow(
        'Session not found'
      );
    });

    it('should throw error if session is revoked', async () => {
      // Arrange
      const tokenPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      const revokedSession = { ...mockSession, revokedAt: new Date() };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(tokenPayload);
      mockSessionRepo.findByRefreshToken.mockResolvedValue(revokedSession);

      // Act & Assert
      await expect(authService.refreshToken('refresh-token-123')).rejects.toThrow(
        'Session has been revoked'
      );
    });

    it('should throw error if session is expired', async () => {
      // Arrange
      const tokenPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000),
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(tokenPayload);
      mockSessionRepo.findByRefreshToken.mockResolvedValue(expiredSession);

      // Act & Assert
      await expect(authService.refreshToken('refresh-token-123')).rejects.toThrow(
        'Session has expired'
      );
    });

    it('should throw error if user is inactive', async () => {
      // Arrange
      const tokenPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      (authUtils.verifyToken as jest.Mock).mockReturnValue(tokenPayload);
      mockSessionRepo.findByRefreshToken.mockResolvedValue(mockSession);
      mockUserRepo.isActive.mockResolvedValue(false);

      // Act & Assert
      await expect(authService.refreshToken('refresh-token-123')).rejects.toThrow(
        'User account is inactive'
      );
    });
  });

  describe('logout', () => {
    it('should successfully logout and revoke session', async () => {
      // Arrange
      mockSessionRepo.findByRefreshToken.mockResolvedValue(mockSession);

      // Act
      await authService.logout(mockUser.id, 'access-token', 'refresh-token-123');

      // Assert
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith(mockSession.id);
      expect(mockBlacklistRepo.add).toHaveBeenCalledWith('access-token', 900);
    });

    it('should blacklist token even if session not found', async () => {
      // Arrange
      mockSessionRepo.findByRefreshToken.mockResolvedValue(null);

      // Act
      await authService.logout(mockUser.id, 'access-token', 'refresh-token-123');

      // Assert
      expect(mockSessionRepo.revoke).not.toHaveBeenCalled();
      expect(mockBlacklistRepo.add).toHaveBeenCalledWith('access-token', 900);
    });

    it('should not revoke session if userId does not match', async () => {
      // Arrange
      mockSessionRepo.findByRefreshToken.mockResolvedValue(mockSession);

      // Act
      await authService.logout('different-user-id', 'access-token', 'refresh-token-123');

      // Assert
      expect(mockSessionRepo.revoke).not.toHaveBeenCalled();
      expect(mockBlacklistRepo.add).toHaveBeenCalledWith('access-token', 900);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all sessions for user', async () => {
      // Act
      await authService.logoutAll(mockUser.id);

      // Assert
      expect(mockSessionRepo.revokeAllForUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('verifyAccessToken', () => {
    it('should successfully verify access token', async () => {
      // Arrange
      const tokenPayload = {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
      };

      mockBlacklistRepo.isBlacklisted.mockResolvedValue(false);
      (authUtils.verifyToken as jest.Mock).mockReturnValue(tokenPayload);

      // Act
      const result = await authService.verifyAccessToken('access-token');

      // Assert
      expect(result).toEqual(tokenPayload);
      expect(mockBlacklistRepo.isBlacklisted).toHaveBeenCalledWith('access-token');
    });

    it('should throw error if token is blacklisted', async () => {
      // Arrange
      mockBlacklistRepo.isBlacklisted.mockResolvedValue(true);

      // Act & Assert
      await expect(authService.verifyAccessToken('blacklisted-token')).rejects.toThrow(
        'Token has been revoked'
      );
    });

    it('should throw error if token is invalid', async () => {
      // Arrange
      mockBlacklistRepo.isBlacklisted.mockResolvedValue(false);
      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act & Assert
      await expect(authService.verifyAccessToken('invalid-token')).rejects.toThrow(
        'Invalid or expired token'
      );
    });
  });

  describe('getActiveSessions', () => {
    it('should return active sessions for user', async () => {
      // Arrange
      const sessions = [mockSession];
      mockSessionRepo.findActiveByUser.mockResolvedValue(sessions);

      // Act
      const result = await authService.getActiveSessions(mockUser.id);

      // Assert
      expect(result).toEqual(sessions);
      expect(mockSessionRepo.findActiveByUser).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('revokeSession', () => {
    it('should successfully revoke session belonging to user', async () => {
      // Arrange
      mockSessionRepo.findActiveByUser.mockResolvedValue([mockSession]);

      // Act
      await authService.revokeSession(mockUser.id, mockSession.id);

      // Assert
      expect(mockSessionRepo.revoke).toHaveBeenCalledWith(mockSession.id);
    });

    it('should throw error if session not found', async () => {
      // Arrange
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);

      // Act & Assert
      await expect(authService.revokeSession(mockUser.id, 'nonexistent-session')).rejects.toThrow(
        'Session not found or already revoked'
      );
    });

    it('should throw error if session belongs to different user', async () => {
      // Arrange
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);

      // Act & Assert
      await expect(authService.revokeSession('different-user-id', mockSession.id)).rejects.toThrow(
        'Session not found or already revoked'
      );
    });
  });

  describe('parseExpiryToSeconds', () => {
    it('should parse seconds correctly', async () => {
      // Arrange
      const testConfig = { ...config, accessTokenExpiry: '30s' };
      const testService = new AuthService(
        mockUserRepo,
        mockSessionRepo,
        mockBlacklistRepo,
        testConfig
      );

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      const result = await testService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1');

      // Assert
      expect(result.expiresIn).toBe(30);
    });

    it('should parse minutes correctly', async () => {
      // Arrange (default config uses 15m)
      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      const result = await authService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1');

      // Assert
      expect(result.expiresIn).toBe(900); // 15 * 60
    });

    it('should parse hours correctly', async () => {
      // Arrange
      const testConfig = { ...config, accessTokenExpiry: '2h' };
      const testService = new AuthService(
        mockUserRepo,
        mockSessionRepo,
        mockBlacklistRepo,
        testConfig
      );

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      const result = await testService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1');

      // Assert
      expect(result.expiresIn).toBe(7200); // 2 * 60 * 60
    });

    it('should parse days correctly', async () => {
      // Arrange
      const testConfig = { ...config, accessTokenExpiry: '1d' };
      const testService = new AuthService(
        mockUserRepo,
        mockSessionRepo,
        mockBlacklistRepo,
        testConfig
      );

      mockUserRepo.findByEmail.mockResolvedValue(mockUser);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      mockUserRepo.isActive.mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue('access-token');
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue('refresh-token');
      mockSessionRepo.findActiveByUser.mockResolvedValue([]);
      mockSessionRepo.create.mockResolvedValue(mockSession);

      // Act
      const result = await testService.login('test@example.com', 'password123', mockDeviceInfo, '127.0.0.1');

      // Assert
      expect(result.expiresIn).toBe(86400); // 1 * 60 * 60 * 24
    });
  });
});