/**
 * RBACService Unit Tests
 * Tests all role-based access control business logic with mocked repositories
 * Reference: Constitution § 3 - Testing Requirements (≥80% coverage)
 */

import { RBACService } from './rbac.service.js';
import type { IUserRepository, UserRole } from '@motorghar-platform/repositories';

describe('RBACService', () => {
  let rbacService: RBACService;
  let mockUserRepo: jest.Mocked<IUserRepository>;

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

    rbacService = new RBACService(mockUserRepo);
  });

  describe('hasRole', () => {
    it('should return true if user has the specified role', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasRole('user-123', 'ADMIN');

      // Assert
      expect(result).toBe(true);
      expect(mockUserRepo.getRole).toHaveBeenCalledWith('user-123');
    });

    it('should return false if user has different role', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasRole('user-123', 'OWNER');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue(null);

      // Act
      const result = await rbacService.hasRole('nonexistent-user', 'ADMIN');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has one of the specified roles', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAnyRole('user-123', ['ADMIN', 'OWNER']);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user has none of the specified roles', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAnyRole('user-123', ['OWNER'] as UserRole[]);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue(null);

      // Act
      const result = await rbacService.hasAnyRole('nonexistent-user', ['ADMIN', 'OWNER']);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true if roles array contains user role', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('OWNER');

      // Act
      const result = await rbacService.hasAnyRole('user-123', ['ADMIN', 'OWNER']);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if roles array is empty', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAnyRole('user-123', []);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('hasAllRoles', () => {
    it('should return true if user has the single role specified', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAllRoles('user-123', ['ADMIN']);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user has different role', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAllRoles('user-123', ['OWNER'] as UserRole[]);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if roles array has multiple elements', async () => {
      // Arrange
      // Note: In current design, users can only have one role
      // So hasAllRoles with multiple roles will always return false
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAllRoles('user-123', ['ADMIN', 'OWNER']);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue(null);

      // Act
      const result = await rbacService.hasAllRoles('nonexistent-user', ['ADMIN']);

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if roles array is empty', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.hasAllRoles('user-123', []);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return user role if found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.getUserRole('user-123');

      // Assert
      expect(result).toBe('ADMIN');
      expect(mockUserRepo.getRole).toHaveBeenCalledWith('user-123');
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue(null);

      // Act
      const result = await rbacService.getUserRole('nonexistent-user');

      // Assert
      expect(result).toBeNull();
    });

    it('should return OWNER role correctly', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('OWNER');

      // Act
      const result = await rbacService.getUserRole('user-123');

      // Assert
      expect(result).toBe('OWNER');
    });
  });

  describe('isAdmin', () => {
    it('should return true if user is admin', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.isAdmin('user-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user is not admin', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('OWNER');

      // Act
      const result = await rbacService.isAdmin('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue(null);

      // Act
      const result = await rbacService.isAdmin('nonexistent-user');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true if user is owner', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('OWNER');

      // Act
      const result = await rbacService.isOwner('user-123');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false if user is not owner', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue('ADMIN');

      // Act
      const result = await rbacService.isOwner('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepo.getRole.mockResolvedValue(null);

      // Act
      const result = await rbacService.isOwner('nonexistent-user');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('isUserActive', () => {
    it('should return true if user is active', async () => {
      // Arrange
      mockUserRepo.isActive.mockResolvedValue(true);

      // Act
      const result = await rbacService.isUserActive('user-123');

      // Assert
      expect(result).toBe(true);
      expect(mockUserRepo.isActive).toHaveBeenCalledWith('user-123');
    });

    it('should return false if user is inactive', async () => {
      // Arrange
      mockUserRepo.isActive.mockResolvedValue(false);

      // Act
      const result = await rbacService.isUserActive('user-123');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      // Arrange
      mockUserRepo.isActive.mockResolvedValue(false);

      // Act
      const result = await rbacService.isUserActive('nonexistent-user');

      // Assert
      expect(result).toBe(false);
    });
  });
});
