import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { z } from 'zod';
import { loadEnvConfig, getEnvConfig, resetEnvConfig, type EnvConfig } from './env.config.js';

describe('env.config', () => {
  const originalEnv = process.env;

  // Minimal valid environment for testing
  const validEnv = {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
    REDIS_URL: 'redis://localhost:6379',
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: '9000',
    MINIO_USE_SSL: 'false',
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    JWT_SECRET: 'test-secret-key-at-least-32-chars-long-12345',
    JWT_REFRESH_SECRET: 'test-refresh-secret-key-at-least-32-chars-long',
    CORS_ORIGIN: 'http://localhost:3000',
    EMAIL_FROM: 'test@example.com',
  };

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
    resetEnvConfig();
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = originalEnv;
    resetEnvConfig();
  });

  describe('loadEnvConfig', () => {
    it('should load and validate a valid environment configuration', () => {
      process.env = { ...validEnv };

      const config = loadEnvConfig();

      expect(config).toBeDefined();
      expect(config.NODE_ENV).toBe('test');
      expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
      expect(config.REDIS_URL).toBe(validEnv.REDIS_URL);
      expect(config.JWT_SECRET).toBe(validEnv.JWT_SECRET);
    });

    it('should apply default values for optional fields', () => {
      process.env = { ...validEnv };

      const config = loadEnvConfig();

      expect(config.PORT).toBe(3000); // Default port
      expect(config.NODE_ENV).toBe('test'); // Provided
      expect(config.API_VERSION).toBe('v1'); // Default
      expect(config.JWT_ACCESS_EXPIRY).toBe('15m'); // Default
      expect(config.JWT_REFRESH_EXPIRY).toBe('7d'); // Default
      expect(config.RATE_LIMIT_PUBLIC).toBe(60); // Default
      expect(config.RATE_LIMIT_AUTHENTICATED).toBe(300); // Default
    });

    it('should transform string PORT to number', () => {
      process.env = { ...validEnv, PORT: '4000' };

      const config = loadEnvConfig();

      expect(config.PORT).toBe(4000);
      expect(typeof config.PORT).toBe('number');
    });

    it('should transform MINIO_PORT to number', () => {
      process.env = { ...validEnv, MINIO_PORT: '9001' };

      const config = loadEnvConfig();

      expect(config.MINIO_PORT).toBe(9001);
      expect(typeof config.MINIO_PORT).toBe('number');
    });

    it('should transform MINIO_USE_SSL to boolean', () => {
      process.env = { ...validEnv, MINIO_USE_SSL: 'true' };

      const config = loadEnvConfig();

      expect(config.MINIO_USE_SSL).toBe(true);
      expect(typeof config.MINIO_USE_SSL).toBe('boolean');
    });

    it('should transform CORS_ORIGIN to array', () => {
      process.env = { ...validEnv, CORS_ORIGIN: 'http://localhost:3000,http://localhost:3001' };

      const config = loadEnvConfig();

      expect(config.CORS_ORIGIN).toEqual(['http://localhost:3000', 'http://localhost:3001']);
      expect(Array.isArray(config.CORS_ORIGIN)).toBe(true);
    });

    it('should throw error when required DATABASE_URL is missing', () => {
      process.env = { ...validEnv };
      delete process.env.DATABASE_URL;

      expect(() => loadEnvConfig()).toThrow('Environment configuration validation failed');
    });

    it('should throw error when required REDIS_URL is missing', () => {
      process.env = { ...validEnv };
      delete process.env.REDIS_URL;

      expect(() => loadEnvConfig()).toThrow('Environment configuration validation failed');
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env = { ...validEnv, JWT_SECRET: 'short' };

      expect(() => loadEnvConfig()).toThrow('Environment configuration validation failed');
    });

    it('should throw error when JWT_REFRESH_SECRET is too short', () => {
      process.env = { ...validEnv, JWT_REFRESH_SECRET: 'short' };

      expect(() => loadEnvConfig()).toThrow('Environment configuration validation failed');
    });

    it('should throw error when PORT is out of range', () => {
      process.env = { ...validEnv, PORT: '99999' };

      expect(() => loadEnvConfig()).toThrow();
    });

    it('should throw error when EMAIL_FROM is invalid', () => {
      process.env = { ...validEnv, EMAIL_FROM: 'not-an-email' };

      expect(() => loadEnvConfig()).toThrow('Environment configuration validation failed');
    });

    it('should validate NODE_ENV enum values', () => {
      process.env = { ...validEnv, NODE_ENV: 'production' };
      const config = loadEnvConfig();
      expect(config.NODE_ENV).toBe('production');

      resetEnvConfig();
      process.env = { ...validEnv, NODE_ENV: 'invalid' as any };
      expect(() => loadEnvConfig()).toThrow();
    });

    it('should validate EMAIL_PROVIDER enum values', () => {
      process.env = { ...validEnv, EMAIL_PROVIDER: 'smtp' };
      const config = loadEnvConfig();
      expect(config.EMAIL_PROVIDER).toBe('smtp');

      resetEnvConfig();
      process.env = { ...validEnv, EMAIL_PROVIDER: 'invalid' as any };
      expect(() => loadEnvConfig()).toThrow();
    });

    it('should validate SMS_PROVIDER enum values', () => {
      process.env = { ...validEnv, SMS_PROVIDER: 'twilio' };
      const config = loadEnvConfig();
      expect(config.SMS_PROVIDER).toBe('twilio');

      resetEnvConfig();
      process.env = { ...validEnv, SMS_PROVIDER: 'invalid' as any };
      expect(() => loadEnvConfig()).toThrow();
    });

    it('should validate MAPS_PROVIDER enum values', () => {
      process.env = { ...validEnv, MAPS_PROVIDER: 'openstreetmap' };
      const config = loadEnvConfig();
      expect(config.MAPS_PROVIDER).toBe('openstreetmap');

      resetEnvConfig();
      process.env = { ...validEnv, MAPS_PROVIDER: 'invalid' as any };
      expect(() => loadEnvConfig()).toThrow();
    });

    it('should apply default bucket names for MinIO', () => {
      process.env = { ...validEnv };

      const config = loadEnvConfig();

      expect(config.MINIO_BUCKET_DOCUMENTS).toBe('motorghar-documents');
      expect(config.MINIO_BUCKET_DEFAULTS).toBe('motorghar-defaults');
      expect(config.MINIO_BUCKET_USER_UPLOADS).toBe('motorghar-user-uploads');
    });

    it('should apply admin defaults', () => {
      process.env = { ...validEnv };

      const config = loadEnvConfig();

      expect(config.ADMIN_EMAIL).toBe('admin@motorghar.com');
      expect(config.ADMIN_PASSWORD).toBe('Admin@123');
      expect(config.ADMIN_NAME).toBe('MotorGhar Admin');
    });

    it('should handle ZodError and format error messages', () => {
      process.env = { ...validEnv };
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;

      try {
        loadEnvConfig();
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Environment configuration validation failed');
        expect(error.message).toContain('DATABASE_URL');
        expect(error.message).toContain('REDIS_URL');
      }
    });
  });

  describe('getEnvConfig', () => {
    it('should return cached config on subsequent calls', () => {
      process.env = { ...validEnv };

      const config1 = getEnvConfig();
      const config2 = getEnvConfig();

      expect(config1).toBe(config2); // Same reference
    });

    it('should load config if not cached', () => {
      process.env = { ...validEnv };

      const config = getEnvConfig();

      expect(config).toBeDefined();
      expect(config.DATABASE_URL).toBe(validEnv.DATABASE_URL);
    });
  });

  describe('resetEnvConfig', () => {
    it('should clear the cached configuration', () => {
      process.env = { ...validEnv };

      const config1 = getEnvConfig();
      resetEnvConfig();

      // Change environment
      process.env.PORT = '5000';
      const config2 = getEnvConfig();

      expect(config1.PORT).toBe(3000);
      expect(config2.PORT).toBe(5000);
    });

    it('should allow reloading config after reset', () => {
      process.env = { ...validEnv };

      getEnvConfig();
      resetEnvConfig();

      expect(() => getEnvConfig()).not.toThrow();
    });
  });

  describe('Type safety', () => {
    it('should infer correct TypeScript types', () => {
      process.env = { ...validEnv };

      const config: EnvConfig = loadEnvConfig();

      // Type checks (these will fail at compile time if types are wrong)
      const port: number = config.PORT;
      const nodeEnv: 'development' | 'staging' | 'production' | 'test' = config.NODE_ENV;
      const useSSL: boolean = config.MINIO_USE_SSL;
      const corsOrigins: string[] = config.CORS_ORIGIN;

      expect(typeof port).toBe('number');
      expect(typeof nodeEnv).toBe('string');
      expect(typeof useSSL).toBe('boolean');
      expect(Array.isArray(corsOrigins)).toBe(true);
    });
  });
});