import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  createHealthResponse,
  checkDatabase,
  checkRedis,
  checkMinIO,
  type HealthStatus,
} from './health.js';

describe('health', () => {
  describe('createHealthResponse', () => {
    it('should create a healthy response when all checks are up', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'up', responseTime: 10 },
        redis: { status: 'up', responseTime: 5 },
        minio: { status: 'up', responseTime: 15 },
      };

      const response = createHealthResponse(checks);

      expect(response.status).toBe('healthy');
      expect(response.checks).toEqual(checks);
      expect(response.timestamp).toBeDefined();
      expect(typeof response.timestamp).toBe('string');
    });

    it('should create a degraded response when some checks are down', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'up', responseTime: 10 },
        redis: { status: 'down', error: 'Connection refused' },
        minio: { status: 'up', responseTime: 15 },
      };

      const response = createHealthResponse(checks);

      expect(response.status).toBe('degraded');
      expect(response.checks).toEqual(checks);
    });

    it('should create response with valid ISO timestamp', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'up' },
      };

      const response = createHealthResponse(checks);
      const timestamp = new Date(response.timestamp);

      expect(timestamp.toISOString()).toBe(response.timestamp);
      expect(isNaN(timestamp.getTime())).toBe(false);
    });

    it('should handle empty checks object', () => {
      const checks: HealthStatus['checks'] = {};

      const response = createHealthResponse(checks);

      // Empty checks means all are up (vacuous truth)
      expect(response.status).toBe('healthy');
      expect(response.checks).toEqual({});
    });

    it('should handle single check down', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'down', error: 'Cannot connect' },
      };

      const response = createHealthResponse(checks);

      expect(response.status).toBe('degraded');
    });

    it('should handle multiple checks down', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'down', error: 'Cannot connect' },
        redis: { status: 'down', error: 'Timeout' },
      };

      const response = createHealthResponse(checks);

      expect(response.status).toBe('degraded');
    });

    it('should preserve response times in checks', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'up', responseTime: 25 },
        redis: { status: 'up', responseTime: 3 },
      };

      const response = createHealthResponse(checks);

      expect(response.checks.database.responseTime).toBe(25);
      expect(response.checks.redis.responseTime).toBe(3);
    });

    it('should preserve error messages in failed checks', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'down', error: 'Connection timeout', responseTime: 5000 },
      };

      const response = createHealthResponse(checks);

      expect(response.checks.database.error).toBe('Connection timeout');
      expect(response.checks.database.responseTime).toBe(5000);
    });
  });

  describe('checkDatabase', () => {
    it('should return up status when check function succeeds', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

      const result = await checkDatabase(checkFn);

      expect(result.status).toBe('up');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(checkFn).toHaveBeenCalledTimes(1);
    });

    it('should return down status when check function fails', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Connection failed'));

      const result = await checkDatabase(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('Connection failed');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(checkFn).toHaveBeenCalledTimes(1);
    });

    it('should measure response time', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 10))
      );

      const result = await checkDatabase(checkFn);

      expect(result.responseTime).toBeGreaterThanOrEqual(10);
    });

    it('should handle non-Error rejections', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue('String error');

      const result = await checkDatabase(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('Unknown error');
    });

    it('should handle Error with custom message', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue(
        new Error('Database connection timeout after 30s')
      );

      const result = await checkDatabase(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('Database connection timeout after 30s');
    });

    it('should record response time even on failure', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockImplementation(
        () => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10))
      );

      const result = await checkDatabase(checkFn);

      expect(result.status).toBe('down');
      expect(result.responseTime).toBeGreaterThanOrEqual(10);
    });
  });

  describe('checkRedis', () => {
    it('should return up status when check function succeeds', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

      const result = await checkRedis(checkFn);

      expect(result.status).toBe('up');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(checkFn).toHaveBeenCalledTimes(1);
    });

    it('should return down status when check function fails', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Redis unavailable'));

      const result = await checkRedis(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('Redis unavailable');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should measure response time', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5))
      );

      const result = await checkRedis(checkFn);

      expect(result.responseTime).toBeGreaterThanOrEqual(5);
    });

    it('should handle non-Error rejections', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue({ code: 'ECONNREFUSED' });

      const result = await checkRedis(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('checkMinIO', () => {
    it('should return up status when check function succeeds', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

      const result = await checkMinIO(checkFn);

      expect(result.status).toBe('up');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
      expect(result.error).toBeUndefined();
      expect(checkFn).toHaveBeenCalledTimes(1);
    });

    it('should return down status when check function fails', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('MinIO not reachable'));

      const result = await checkMinIO(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('MinIO not reachable');
      expect(result.responseTime).toBeGreaterThanOrEqual(0);
    });

    it('should measure response time', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 15))
      );

      const result = await checkMinIO(checkFn);

      expect(result.responseTime).toBeGreaterThanOrEqual(15);
    });

    it('should handle non-Error rejections', async () => {
      const checkFn = jest.fn<() => Promise<void>>().mockRejectedValue(null);

      const result = await checkMinIO(checkFn);

      expect(result.status).toBe('down');
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Integration scenarios', () => {
    it('should create complete health check response with all services', async () => {
      const dbCheck = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const redisCheck = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const minioCheck = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

      const database = await checkDatabase(dbCheck);
      const redis = await checkRedis(redisCheck);
      const minio = await checkMinIO(minioCheck);

      const response = createHealthResponse({ database, redis, minio });

      expect(response.status).toBe('healthy');
      expect(response.checks.database.status).toBe('up');
      expect(response.checks.redis.status).toBe('up');
      expect(response.checks.minio.status).toBe('up');
    });

    it('should create degraded response when one service fails', async () => {
      const dbCheck = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
      const redisCheck = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Connection lost'));
      const minioCheck = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);

      const database = await checkDatabase(dbCheck);
      const redis = await checkRedis(redisCheck);
      const minio = await checkMinIO(minioCheck);

      const response = createHealthResponse({ database, redis, minio });

      expect(response.status).toBe('degraded');
      expect(response.checks.database.status).toBe('up');
      expect(response.checks.redis.status).toBe('down');
      expect(response.checks.redis.error).toBe('Connection lost');
      expect(response.checks.minio.status).toBe('up');
    });

    it('should handle all services down scenario', async () => {
      const dbCheck = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('DB down'));
      const redisCheck = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('Redis down'));
      const minioCheck = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('MinIO down'));

      const database = await checkDatabase(dbCheck);
      const redis = await checkRedis(redisCheck);
      const minio = await checkMinIO(minioCheck);

      const response = createHealthResponse({ database, redis, minio });

      expect(response.status).toBe('degraded');
      expect(response.checks.database.status).toBe('down');
      expect(response.checks.redis.status).toBe('down');
      expect(response.checks.minio.status).toBe('down');
    });
  });

  describe('Type safety', () => {
    it('should enforce correct HealthStatus type', () => {
      const checks: HealthStatus['checks'] = {
        database: { status: 'up' as const, responseTime: 10 },
      };

      const response: HealthStatus = createHealthResponse(checks);

      // Type assertions
      const status: 'healthy' | 'degraded' | 'unhealthy' = response.status;
      const timestamp: string = response.timestamp;
      const dbStatus: 'up' | 'down' = response.checks.database.status;

      expect(status).toBeDefined();
      expect(timestamp).toBeDefined();
      expect(dbStatus).toBeDefined();
    });
  });
});
