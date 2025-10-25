import pino from 'pino';
import { APP_NAME } from '@motorghar-platform/constants';

/**
 * Logger Configuration
 * Creates a structured logger using Pino with request ID tracking
 * Reference: Solution Design v1.0 § 11 (Observability)
 * Per Constitution § 10.2 - Using constants from @motorghar-platform/constants
 */

export interface LoggerOptions {
  name?: string;
  level?: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyPrint?: boolean;
}

/**
 * Create a logger instance with sensible defaults
 */
export function createLogger(options: LoggerOptions = {}) {
  const {
    name = APP_NAME,
    level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    prettyPrint = process.env.NODE_ENV !== 'production',
  } = options;

  const transport = prettyPrint
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined;

  return pino({
    name,
    level,
    transport,
    // Base fields for all log entries
    base: {
      env: process.env.NODE_ENV || 'development',
    },
    // Timestamp in ISO format
    timestamp: () => `,"time":"${new Date().toISOString()}"`,
    // Custom serializers for common objects
    serializers: {
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
      err: pino.stdSerializers.err,
    },
  });
}

/**
 * Default logger instance
 */
export const logger = createLogger();

/**
 * Create a child logger with additional context
 */
export function createChildLogger(bindings: Record<string, unknown>) {
  return logger.child(bindings);
}

/**
 * Create a logger with request ID for tracing
 */
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

/**
 * Type for logger instance
 */
export type Logger = ReturnType<typeof createLogger>;
