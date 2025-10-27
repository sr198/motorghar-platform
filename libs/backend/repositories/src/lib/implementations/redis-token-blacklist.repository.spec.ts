/**
 * Redis Token Blacklist Repository Unit Tests
 * Testing with mocked Redis client
 * Target: ≥80% coverage
 */

import { RedisTokenBlacklistRepository } from './redis-token-blacklist.repository.js';
import type { Redis } from 'ioredis';

// Mock Redis Client
const createMockRedis = () => ({
  set: jest.fn(),
  get: jest.fn(),
  exists: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
});

describe('RedisTokenBlacklistRepository', () => {
  let repository: RedisTokenBlacklistRepository;
  let mockRedis: ReturnType<typeof createMockRedis>;

  const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';
  const expectedKey = `auth:blacklist:token:${testToken}`;

  beforeEach(() => {
    mockRedis = createMockRedis();
    repository = new RedisTokenBlacklistRepository(
      mockRedis as unknown as Redis
    );
  });

  describe('add', () => {
    it('should add token to blacklist with TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await repository.add(testToken, 3600);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expectedKey,
        '1',
        'EX',
        3600
      );
    });

    it('should handle different TTL values', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await repository.add(testToken, 7200);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expectedKey,
        '1',
        'EX',
        7200
      );
    });

    it('should handle short TTL', async () => {
      mockRedis.set.mockResolvedValue('OK');

      await repository.add(testToken, 60);

      expect(mockRedis.set).toHaveBeenCalledWith(
        expectedKey,
        '1',
        'EX',
        60
      );
    });
  });

  describe('isBlacklisted', () => {
    it('should return true when token exists in blacklist', async () => {
      mockRedis.exists.mockResolvedValue(1);

      const result = await repository.isBlacklisted(testToken);

      expect(result).toBe(true);
      expect(mockRedis.exists).toHaveBeenCalledWith(expectedKey);
    });

    it('should return false when token does not exist in blacklist', async () => {
      mockRedis.exists.mockResolvedValue(0);

      const result = await repository.isBlacklisted(testToken);

      expect(result).toBe(false);
      expect(mockRedis.exists).toHaveBeenCalledWith(expectedKey);
    });

    it('should handle different tokens', async () => {
      const differentToken = 'different.token.value';
      const differentKey = `auth:blacklist:token:${differentToken}`;
      mockRedis.exists.mockResolvedValue(1);

      await repository.isBlacklisted(differentToken);

      expect(mockRedis.exists).toHaveBeenCalledWith(differentKey);
    });
  });

  describe('remove', () => {
    it('should remove token from blacklist', async () => {
      mockRedis.del.mockResolvedValue(1);

      await repository.remove(testToken);

      expect(mockRedis.del).toHaveBeenCalledWith(expectedKey);
    });

    it('should handle removing non-existent token', async () => {
      mockRedis.del.mockResolvedValue(0);

      await repository.remove(testToken);

      expect(mockRedis.del).toHaveBeenCalledWith(expectedKey);
    });

    it('should remove different tokens', async () => {
      const differentToken = 'another.token.value';
      const differentKey = `auth:blacklist:token:${differentToken}`;
      mockRedis.del.mockResolvedValue(1);

      await repository.remove(differentToken);

      expect(mockRedis.del).toHaveBeenCalledWith(differentKey);
    });
  });

  describe('key generation', () => {
    it('should use consistent key prefix', async () => {
      mockRedis.exists.mockResolvedValue(0);

      await repository.isBlacklisted(testToken);

      expect(mockRedis.exists).toHaveBeenCalledWith(
        expect.stringContaining('auth:blacklist:token:')
      );
    });

    it('should include full token in key', async () => {
      const longToken = 'a'.repeat(200);
      const expectedLongKey = `auth:blacklist:token:${longToken}`;
      mockRedis.exists.mockResolvedValue(0);

      await repository.isBlacklisted(longToken);

      expect(mockRedis.exists).toHaveBeenCalledWith(expectedLongKey);
    });
  });

  describe('integration scenarios', () => {
    it('should handle add -> check -> remove workflow', async () => {
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.exists.mockResolvedValue(1);
      mockRedis.del.mockResolvedValue(1);

      // Add token
      await repository.add(testToken, 3600);
      expect(mockRedis.set).toHaveBeenCalled();

      // Check token is blacklisted
      const isBlacklisted = await repository.isBlacklisted(testToken);
      expect(isBlacklisted).toBe(true);

      // Remove token
      await repository.remove(testToken);
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should handle multiple tokens independently', async () => {
      const token1 = 'token.one';
      const token2 = 'token.two';

      mockRedis.set.mockResolvedValue('OK');
      mockRedis.exists.mockImplementation((key: string) => {
        if (key === `auth:blacklist:token:${token1}`) return Promise.resolve(1);
        if (key === `auth:blacklist:token:${token2}`) return Promise.resolve(0);
        return Promise.resolve(0);
      });

      await repository.add(token1, 3600);

      const result1 = await repository.isBlacklisted(token1);
      const result2 = await repository.isBlacklisted(token2);

      expect(result1).toBe(true);
      expect(result2).toBe(false);
    });
  });
});
