/**
 * Prisma User Repository Unit Tests
 * Testing with mocked Prisma client
 * Target: ≥80% coverage
 */

import { PrismaUserRepository } from './prisma-user.repository.js';
import type { UserRole } from '../interfaces/user.repository.interface.js';
import type { PrismaClient } from '@prisma/client';
import { UserRole as PrismaUserRole } from '@prisma/client';

// Mock Prisma Client
const createMockPrisma = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    repository = new PrismaUserRepository(
      mockPrisma as unknown as PrismaClient
    );
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hash123',
        name: 'Test User',
        phone: null,
        role: PrismaUserRole.OWNER,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        passwordHash: 'hash123',
        name: 'Test User',
        phone: '+1234567890',
        role: PrismaUserRole.ADMIN,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findById('123');

      expect(result).toEqual(mockUser);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          name: true,
          phone: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.findById('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('updateLastLogin', () => {
    it('should update user updatedAt timestamp', async () => {
      const timestamp = new Date('2025-01-15T10:00:00Z');
      mockPrisma.user.update.mockResolvedValue({});

      await repository.updateLastLogin('123', timestamp);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { updatedAt: timestamp },
      });
    });
  });

  describe('updatePassword', () => {
    it('should update user password hash', async () => {
      const newHash = 'newHash456';
      mockPrisma.user.update.mockResolvedValue({});

      await repository.updatePassword('123', newHash);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: '123' },
        data: { passwordHash: newHash },
      });
    });
  });

  describe('isActive', () => {
    it('should return true when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '123' });

      const result = await repository.isActive('123');

      expect(result).toBe(true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        select: { id: true },
      });
    });

    it('should return false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.isActive('nonexistent-id');

      expect(result).toBe(false);
    });
  });

  describe('getRole', () => {
    it('should return user role when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: PrismaUserRole.ADMIN,
      });

      const result = await repository.getRole('123');

      expect(result).toBe(PrismaUserRole.ADMIN);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: '123' },
        select: { role: true },
      });
    });

    it('should return null when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await repository.getRole('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should handle OWNER role', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        role: PrismaUserRole.OWNER,
      });

      const result = await repository.getRole('123');

      expect(result).toBe(PrismaUserRole.OWNER);
    });
  });
});
