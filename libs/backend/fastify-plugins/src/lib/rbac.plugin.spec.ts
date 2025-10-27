/**
 * RBAC Plugin Integration Tests
 * Tests the role-based access control decorators with mocked RBACService
 */

import Fastify, { FastifyInstance } from 'fastify';
import authPlugin from './auth.plugin';
import rbacPlugin from './rbac.plugin';
import type { AuthService, TokenPayload } from '@motorghar-platform/auth-service';
import type { RBACService } from '@motorghar-platform/rbac-service';
import type { UserRole } from '@motorghar-platform/repositories';

describe('RBAC Plugin', () => {
  let app: FastifyInstance;
  let mockAuthService: AuthService;
  let mockRBACService: RBACService;

  const mockAdminUser: TokenPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'admin@example.com',
    role: 'ADMIN',
  };

  const mockOwnerUser: TokenPayload = {
    userId: '987e6543-e21b-43d2-a654-426614174999',
    email: 'owner@example.com',
    role: 'OWNER',
  };

  beforeEach(async () => {
    // Create mock services
    mockAuthService = {
      verifyAccessToken: jest.fn(),
    } as any;

    mockRBACService = {
      hasRole: jest.fn(),
      hasAnyRole: jest.fn(),
      isAdmin: jest.fn(),
    } as any;

    // Create fresh Fastify instance
    app = Fastify();

    // Register plugins
    await app.register(authPlugin, { authService: mockAuthService });
    await app.register(rbacPlugin, { rbacService: mockRBACService });

    // Test route with requireRole
    app.get(
      '/admin-only',
      {
        preHandler: [app.authenticate, app.requireRole('ADMIN')],
      },
      async () => {
        return { message: 'Admin access granted' };
      }
    );

    // Test route with requireAnyRole
    app.get(
      '/admin-or-owner',
      {
        preHandler: [app.authenticate, app.requireAnyRole(['ADMIN', 'OWNER'])],
      },
      async () => {
        return { message: 'Access granted' };
      }
    );

    // Test route with requireAdmin
    app.get(
      '/admin-direct',
      {
        preHandler: [app.authenticate, app.requireAdmin],
      },
      async () => {
        return { message: 'Admin access granted' };
      }
    );

    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('requireRole decorator', () => {
    it('should return 401 when user is not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin-only',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should return 403 when user does not have required role', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockOwnerUser);
      jest.mocked(mockRBACService.hasRole).mockResolvedValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-only',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        success: false,
        error: 'ADMIN role required',
      });
      expect(mockRBACService.hasRole).toHaveBeenCalledWith(mockOwnerUser.userId, 'ADMIN');
    });

    it('should allow access when user has required role', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockAdminUser);
      jest.mocked(mockRBACService.hasRole).mockResolvedValue(true);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-only',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Admin access granted' });
      expect(mockRBACService.hasRole).toHaveBeenCalledWith(mockAdminUser.userId, 'ADMIN');
    });
  });

  describe('requireAnyRole decorator', () => {
    it('should return 401 when user is not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin-or-owner',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should return 403 when user does not have any of the required roles', async () => {
      // Mock a user with neither ADMIN nor OWNER role
      const mockRegularUser: TokenPayload = {
        userId: '111e1111-e11b-11d1-a111-111111111111',
        email: 'user@example.com',
        role: 'ADMIN', // This will be rejected by hasAnyRole check
      };

      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockRegularUser);
      jest.mocked(mockRBACService.hasAnyRole).mockResolvedValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-or-owner',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        success: false,
        error: 'One of [ADMIN, OWNER] roles required',
      });
      expect(mockRBACService.hasAnyRole).toHaveBeenCalledWith(
        mockRegularUser.userId,
        ['ADMIN', 'OWNER']
      );
    });

    it('should allow access when user has ADMIN role', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockAdminUser);
      jest.mocked(mockRBACService.hasAnyRole).mockResolvedValue(true);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-or-owner',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Access granted' });
      expect(mockRBACService.hasAnyRole).toHaveBeenCalledWith(mockAdminUser.userId, [
        'ADMIN',
        'OWNER',
      ]);
    });

    it('should allow access when user has OWNER role', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockOwnerUser);
      jest.mocked(mockRBACService.hasAnyRole).mockResolvedValue(true);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-or-owner',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Access granted' });
      expect(mockRBACService.hasAnyRole).toHaveBeenCalledWith(mockOwnerUser.userId, [
        'ADMIN',
        'OWNER',
      ]);
    });
  });

  describe('requireAdmin decorator', () => {
    it('should return 401 when user is not authenticated', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/admin-direct',
      });

      expect(response.statusCode).toBe(401);
      expect(response.json()).toEqual({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    });

    it('should return 403 when user is not an admin', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockOwnerUser);
      jest.mocked(mockRBACService.isAdmin).mockResolvedValue(false);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-direct',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(403);
      expect(response.json()).toEqual({
        success: false,
        error: 'Admin access required',
      });
      expect(mockRBACService.isAdmin).toHaveBeenCalledWith(mockOwnerUser.userId);
    });

    it('should allow access when user is an admin', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockResolvedValue(mockAdminUser);
      jest.mocked(mockRBACService.isAdmin).mockResolvedValue(true);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-direct',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ message: 'Admin access granted' });
      expect(mockRBACService.isAdmin).toHaveBeenCalledWith(mockAdminUser.userId);
    });
  });

  describe('plugin metadata', () => {
    it('should have correct plugin name', () => {
      expect(rbacPlugin[Symbol.for('plugin-meta')]).toBeDefined();
      expect(rbacPlugin[Symbol.for('plugin-meta')].name).toBe('@motorghar/rbac-plugin');
    });

    it('should depend on auth-plugin', () => {
      expect(rbacPlugin[Symbol.for('plugin-meta')].dependencies).toEqual([
        '@motorghar/auth-plugin',
      ]);
    });
  });

  describe('multiple preHandlers chaining', () => {
    it('should execute authenticate before requireRole', async () => {
      const callOrder: string[] = [];

      jest.mocked(mockAuthService.verifyAccessToken).mockImplementation(async (token) => {
        callOrder.push('authenticate');
        return mockAdminUser;
      });

      jest.mocked(mockRBACService.hasRole).mockImplementation(async (userId, role) => {
        callOrder.push('requireRole');
        return true;
      });

      const response = await app.inject({
        method: 'GET',
        url: '/admin-only',
        headers: {
          authorization: 'Bearer valid-token',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(callOrder).toEqual(['authenticate', 'requireRole']);
    });

    it('should stop at authenticate if it fails', async () => {
      jest.mocked(mockAuthService.verifyAccessToken).mockRejectedValue(
        new Error('Invalid token')
      );

      const hasRoleSpy = jest.mocked(mockRBACService.hasRole);

      const response = await app.inject({
        method: 'GET',
        url: '/admin-only',
        headers: {
          authorization: 'Bearer invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      expect(hasRoleSpy).not.toHaveBeenCalled();
    });
  });
});
