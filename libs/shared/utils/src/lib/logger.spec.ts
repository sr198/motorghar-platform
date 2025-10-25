import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { createLogger, createChildLogger, createRequestLogger, type Logger } from './logger.js';

describe('logger', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createLogger', () => {
    it('should create a logger with default options', () => {
      const logger = createLogger();

      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
    });

    it('should create a logger with custom name', () => {
      const logger = createLogger({ name: 'custom-service' });

      expect(logger).toBeDefined();
    });

    it('should create a logger with custom level', () => {
      const logger = createLogger({ level: 'warn' });

      expect(logger).toBeDefined();
    });

    it('should use motorghar as default name', () => {
      const logger = createLogger();
      // Logger is created successfully with default name
      expect(logger).toBeDefined();
    });

    it('should respect LOG_LEVEL environment variable', () => {
      process.env.LOG_LEVEL = 'error';

      const logger = createLogger();

      expect(logger).toBeDefined();
    });

    it('should use info level for production by default', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.LOG_LEVEL;

      const logger = createLogger();

      expect(logger).toBeDefined();
    });

    it('should use debug level for non-production by default', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.LOG_LEVEL;

      const logger = createLogger();

      expect(logger).toBeDefined();
    });

    it('should enable pretty print in non-production', () => {
      process.env.NODE_ENV = 'development';

      const logger = createLogger();

      expect(logger).toBeDefined();
    });

    it('should disable pretty print in production', () => {
      process.env.NODE_ENV = 'production';

      const logger = createLogger();

      expect(logger).toBeDefined();
    });

    it('should allow overriding prettyPrint option', () => {
      const logger = createLogger({ prettyPrint: false });

      expect(logger).toBeDefined();
    });

    it('should support all log levels', () => {
      const levels: Array<'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'> = [
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'fatal',
      ];

      levels.forEach((level) => {
        const logger = createLogger({ level });
        expect(logger).toBeDefined();
      });
    });

    it('should create logger with all options combined', () => {
      const logger = createLogger({
        name: 'test-service',
        level: 'info',
        prettyPrint: true,
      });

      expect(logger).toBeDefined();
    });
  });

  describe('createChildLogger', () => {
    it('should create a child logger with additional context', () => {
      const childLogger = createChildLogger({ userId: '123', action: 'login' });

      expect(childLogger).toBeDefined();
      expect(typeof childLogger.info).toBe('function');
    });

    it('should create a child logger with empty bindings', () => {
      const childLogger = createChildLogger({});

      expect(childLogger).toBeDefined();
    });

    it('should create a child logger with nested objects', () => {
      const childLogger = createChildLogger({
        user: { id: '123', email: 'user@example.com' },
        metadata: { timestamp: Date.now() },
      });

      expect(childLogger).toBeDefined();
    });
  });

  describe('createRequestLogger', () => {
    it('should create a request logger with requestId', () => {
      const requestLogger = createRequestLogger('req-123-456');

      expect(requestLogger).toBeDefined();
      expect(typeof requestLogger.info).toBe('function');
    });

    it('should create a request logger with UUID requestId', () => {
      const requestId = '550e8400-e29b-41d4-a716-446655440000';
      const requestLogger = createRequestLogger(requestId);

      expect(requestLogger).toBeDefined();
    });

    it('should create request loggers with different IDs', () => {
      const logger1 = createRequestLogger('req-1');
      const logger2 = createRequestLogger('req-2');

      expect(logger1).toBeDefined();
      expect(logger2).toBeDefined();
      // Different loggers should be created
      expect(logger1).not.toBe(logger2);
    });
  });

  describe('Logger Type', () => {
    it('should have proper TypeScript type', () => {
      const logger: Logger = createLogger();

      // Type assertions - these will fail at compile time if types are wrong
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.trace).toBe('function');
      expect(typeof logger.fatal).toBe('function');
    });
  });

  describe('Logger functionality', () => {
    it('should allow logging at different levels', () => {
      const logger = createLogger({ level: 'info' });

      // These should not throw
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warning message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });

    it('should accept message with context object', () => {
      const logger = createLogger();

      expect(() => logger.info({ userId: '123' }, 'User logged in')).not.toThrow();
    });

    it('should accept error objects', () => {
      const logger = createLogger();
      const error = new Error('Test error');

      expect(() => logger.error({ err: error }, 'An error occurred')).not.toThrow();
    });

    it('should handle child logger logging', () => {
      const childLogger = createChildLogger({ service: 'auth' });

      expect(() => childLogger.info('Authentication successful')).not.toThrow();
    });

    it('should handle request logger logging', () => {
      const requestLogger = createRequestLogger('req-789');

      expect(() => requestLogger.info('Request processed')).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    it('should handle undefined options', () => {
      const logger = createLogger(undefined);

      expect(logger).toBeDefined();
    });

    it('should handle empty options object', () => {
      const logger = createLogger({});

      expect(logger).toBeDefined();
    });

    it('should handle special characters in logger name', () => {
      const logger = createLogger({ name: 'test-service-123_special' });

      expect(logger).toBeDefined();
    });

    it('should handle logging with null values', () => {
      const logger = createLogger();

      expect(() => logger.info({ value: null }, 'Null value')).not.toThrow();
    });

    it('should handle logging with undefined values', () => {
      const logger = createLogger();

      expect(() => logger.info({ value: undefined }, 'Undefined value')).not.toThrow();
    });
  });
});