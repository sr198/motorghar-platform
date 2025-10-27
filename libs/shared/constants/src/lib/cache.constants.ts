/**
 * Cache Constants
 * TTL values and cache key prefixes
 * Reference: Solution Design v1.0 § 6 (Caching Strategy)
 */

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SESSION: 7 * 24 * 60 * 60, // 7 days
  TOKEN_BLACKLIST: 15 * 60, // 15 minutes (access token expiry)
  GEOCODE: 24 * 60 * 60, // 24 hours
  METRICS: 5 * 60, // 5 minutes
  CATALOG: 60 * 60, // 1 hour
  NEWS_LIST: 10 * 60, // 10 minutes
  RATE_LIMIT_WINDOW: 60, // 1 minute
  USER_DATA: 30 * 60, // 30 minutes
  SERVICE_CENTER_LIST: 60 * 60, // 1 hour
} as const;

// Cache Key Prefixes
export const CACHE_PREFIX = {
  SESSION: 'session:',
  USER: 'user:',
  VEHICLE_CATALOG: 'catalog:',
  SERVICE_CENTER_GEOCODE: 'geocode:',
  SERVICE_CENTER_LIST: 'centers:',
  NEWS: 'news:',
  METRICS: 'metrics:',
  RATE_LIMIT: 'rate:',
  TOKEN_BLACKLIST: 'blacklist:',
} as const;

// Redis Connection Settings
export const REDIS_MAX_RETRIES_PER_REQUEST = 3;
export const REDIS_CONNECT_TIMEOUT_MS = 10000; // 10 seconds
export const REDIS_COMMAND_TIMEOUT_MS = 5000; // 5 seconds