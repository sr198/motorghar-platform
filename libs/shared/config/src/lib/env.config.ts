import { z } from 'zod';
import {
  DEFAULT_PORT,
  MIN_PORT,
  MAX_PORT,
  API_VERSION_DEFAULT,
  RATE_LIMIT_PUBLIC_DEFAULT,
  RATE_LIMIT_AUTHENTICATED_DEFAULT,
  PASSWORD_MIN_LENGTH,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
} from '@motorghar-platform/constants';

/**
 * Environment Configuration Schema
 * Validates all required environment variables for MotorGhar Platform
 * Reference: Solution Design v1.0 § 10 (Deployment & Environments)
 * Per Constitution § 10.2 - Using constants from @motorghar-platform/constants
 */

const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.string().default(String(DEFAULT_PORT)).transform(Number).pipe(z.number().min(MIN_PORT).max(MAX_PORT)),

  // Database Configuration
  DATABASE_URL: z.string().describe('PostgreSQL connection string'),

  // Redis Configuration
  REDIS_URL: z.string().describe('Redis connection string'),

  // MinIO Configuration
  MINIO_ENDPOINT: z.string().min(1),
  MINIO_PORT: z.string().transform(Number).pipe(z.number().positive()),
  MINIO_USE_SSL: z.string().transform((val) => val === 'true').pipe(z.boolean()),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(PASSWORD_MIN_LENGTH),
  MINIO_BUCKET_DOCUMENTS: z.string().default('motorghar-documents'),
  MINIO_BUCKET_DEFAULTS: z.string().default('motorghar-defaults'),
  MINIO_BUCKET_USER_UPLOADS: z.string().default('motorghar-user-uploads'),

  // JWT Configuration
  // Note: Validation rules (min: 32) will be moved to config service in Phase 2+ (per ADR 001)
  JWT_SECRET: z.string().min(32).describe('Secret for signing JWT access tokens (min 32 chars)'),
  JWT_REFRESH_SECRET: z.string().min(32).describe('Secret for signing JWT refresh tokens (min 32 chars)'),
  JWT_ACCESS_EXPIRY: z.string().default('15m').describe('Access token TTL (e.g., 15m, 1h)'),
  JWT_REFRESH_EXPIRY: z.string().default('7d').describe('Refresh token TTL (e.g., 7d, 30d)'),
  JWT_ISSUER: z.string().default('motorghar').describe('JWT token issuer'),
  JWT_AUDIENCE: z.string().default('motorghar-client').describe('JWT token audience'),

  // Session Configuration
  SESSION_MAX_PER_USER: z.string().default('5').transform(Number).pipe(z.number().min(0)).describe('Max concurrent sessions per user (0 = unlimited)'),
  SESSION_TRACK_DEVICES: z.string().default('true').transform((val) => val === 'true').pipe(z.boolean()).describe('Enable device info tracking'),
  SESSION_CLEANUP_INTERVAL: z.string().default('3600').transform(Number).pipe(z.number().positive()).describe('Session cleanup interval in seconds'),

  // Session Features (Future)
  SESSION_REMEMBER_ME_ENABLED: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Enable remember-me functionality'),
  SESSION_REMEMBER_ME_EXPIRY: z.string().default('30d').describe('Remember-me token TTL'),
  SESSION_SLIDING_ENABLED: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Extend session on activity'),

  // Security Features (Future)
  AUTH_IP_RATE_LIMIT_ENABLED: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Enable IP-based rate limiting'),
  AUTH_DETECT_SUSPICIOUS_LOGIN: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Enable login anomaly detection'),
  AUTH_2FA_ENABLED: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Enable two-factor authentication'),

  // Performance Configuration (Future)
  RBAC_CACHE_ENABLED: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Cache user roles in Redis'),
  RBAC_CACHE_TTL: z.string().default('300').transform(Number).pipe(z.number().positive()).describe('Role cache TTL in seconds'),
  SESSION_CACHE_ENABLED: z.string().default('false').transform((val) => val === 'true').pipe(z.boolean()).describe('Cache session validation'),
  SESSION_CACHE_TTL: z.string().default('60').transform(Number).pipe(z.number().positive()).describe('Session cache TTL in seconds'),

  // API Configuration
  API_VERSION: z.string().default(API_VERSION_DEFAULT),

  // CORS Configuration
  CORS_ORIGIN: z.string().transform((val) => val.split(',')).pipe(z.array(z.string())),

  // Rate Limiting
  RATE_LIMIT_PUBLIC: z.string().default(String(RATE_LIMIT_PUBLIC_DEFAULT)).transform(Number).pipe(z.number().positive()),
  RATE_LIMIT_AUTHENTICATED: z.string().default(String(RATE_LIMIT_AUTHENTICATED_DEFAULT)).transform(Number).pipe(z.number().positive()),

  // Email Configuration
  EMAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
  EMAIL_FROM: z.string().email(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional().transform((val) => val ? Number(val) : undefined).pipe(z.number().positive().optional()),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),

  // SMS Configuration
  SMS_PROVIDER: z.enum(['console', 'twilio']).default('console'),
  SMS_FROM: z.string().optional(),

  // Maps Configuration
  MAPS_PROVIDER: z.enum(['google', 'openstreetmap']).default('google'),
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Admin Bootstrap
  ADMIN_EMAIL: z.string().email().default('admin@motorghar.com'),
  ADMIN_PASSWORD: z.string().min(PASSWORD_MIN_LENGTH).default('Admin@123'),
  ADMIN_NAME: z.string().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH).default('MotorGhar Admin'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let cachedConfig: EnvConfig | null = null;

/**
 * Load and validate environment configuration
 * Throws if validation fails
 */
export function loadEnvConfig(): EnvConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    cachedConfig = envSchema.parse(process.env);
    return cachedConfig;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formatted = error.issues.map(
        (err) => `  - ${err.path.join('.')}: ${err.message}`
      ).join('\n');

      throw new Error(
        `❌ Environment configuration validation failed:\n${formatted}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Loads on first call, returns cached on subsequent calls
 */
export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    return loadEnvConfig();
  }
  return cachedConfig;
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetEnvConfig(): void {
  cachedConfig = null;
}
