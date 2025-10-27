/**
 * Auth Plugin Integration Tests
 * Tests the authentication decorators with mocked AuthService
 */

import Fastify, { FastifyInstance } from 'fastify';
import authPlugin from './auth.plugin';
import type { AuthService, TokenPayload } from '@motorghar-platform/auth-service';

describe('Auth Plugin', () => {
  let app: FastifyInstance;
  let mockAuthService: AuthService;

  const mockUser: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'ADMIN',
  };

  beforeEach(async () => {
    // Create mock auth service
    mockAuthService = {
      verifyAccessToken: jest.fn(),
    } as any;

    // Create fresh Fastify instance
    app = Fastify();

    // Register auth plugin with mock service
    await app.register(authPlugin, { authService: mockAuthService });

    // Test route with authenticate
    app.get(
      '/protected',
      {
        preHandler: app.authenticate,
      },
      async (request) => {
        return { user: request.user };
      }
    );

    // Test route with optionalAuth
    app.get(
      '/optional',
      {
        preHandler: app.optionalAuth,
      },
      async (request) => {
        return { user: request.user || null };
      }
    );

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('authenticate decorator', () => {
    it('should return 401 when authorization header is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should return 401 when authorization header is malformed', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should return 401 when token is invalid', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Invalid or expired token',
      });
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('invalid-token');
    });

    it('should attach user to request when token is valid', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user: mockUser });
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('should handle expired token error', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockRejectedValue(
        new Error('Token has expired')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer expired-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Invalid or expired token',
      });
    });

    it('should handle revoked token error', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockRejectedValue(
        new Error('Token has been revoked')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/protected',
        headers: {
          authorization: 'Bearer revoked-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Invalid or expired token',
      });
    });
  });

  describe('optionalAuth decorator', () => {
    it('should continue without user when authorization header is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/optional',
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user: null });
    });

    it('should continue without user when token is invalid', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockRejectedValue(
        new Error('Invalid token')
      );

      const response = await app.inject({
        method: 'GET',
        url: '/optional',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user: null });
    });

    it('should attach user to request when token is valid', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockUser);

      const response = await app.inject({
        method: 'GET',
        url: '/optional',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user: mockUser });
      expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith('valid-token');
    });

    it('should continue without user when authorization header is malformed', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/optional',
        headers: {
          authorization: 'InvalidFormat token123',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ user: null });
    });
  });

  describe('plugin metadata', () => {
    it('should have correct plugin name', () => {
      expect(authPlugin[Symbol.for('plugin-meta')]).toBeDefined();
      expect(authPlugin[Symbol.for('plugin-meta')].name).toBe('@motorghar/auth-plugin');
    });

    it('should have no dependencies', () => {
      expect(authPlugin[Symbol.for('plugin-meta')].dependencies).toEqual([]);
    });
  });
});