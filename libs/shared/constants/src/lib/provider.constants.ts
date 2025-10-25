/**
 * Provider Constants
 * Third-party service provider options and configurations
 * Reference: Constitution § 10.1 - Configuration over Code
 */

// Email Providers
export const EMAIL_PROVIDERS = ['console', 'smtp', 'sendgrid', 'ses'] as const;
export const EMAIL_PROVIDER_DEFAULT = 'console';

export type EmailProvider = typeof EMAIL_PROVIDERS[number];

// SMS Providers
export const SMS_PROVIDERS = ['console', 'twilio', 'sns'] as const;
export const SMS_PROVIDER_DEFAULT = 'console';

export type SmsProvider = typeof SMS_PROVIDERS[number];

// Maps Providers
export const MAPS_PROVIDERS = ['google', 'openstreetmap', 'mapbox'] as const;
export const MAPS_PROVIDER_DEFAULT = 'google';

export type MapsProvider = typeof MAPS_PROVIDERS[number];

// Storage Providers
export const STORAGE_PROVIDERS = ['minio', 's3', 'gcs', 'local'] as const;
export const STORAGE_PROVIDER_DEFAULT = 'minio';

export type StorageProvider = typeof STORAGE_PROVIDERS[number];

// Cache Providers
export const CACHE_PROVIDERS = ['redis', 'memcached', 'memory'] as const;
export const CACHE_PROVIDER_DEFAULT = 'redis';

export type CacheProvider = typeof CACHE_PROVIDERS[number];

// Logger Providers
export const LOGGER_PROVIDERS = ['pino', 'winston', 'console'] as const;
export const LOGGER_PROVIDER_DEFAULT = 'pino';

export type LoggerProvider = typeof LOGGER_PROVIDERS[number];

// Log Levels
export const LOG_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;
export const LOG_LEVEL_DEFAULT_DEV = 'debug';
export const LOG_LEVEL_DEFAULT_PROD = 'info';

export type LogLevel = typeof LOG_LEVELS[number];
