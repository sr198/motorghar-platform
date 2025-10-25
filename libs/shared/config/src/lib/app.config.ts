import { getEnvConfig, type EnvConfig } from './env.config.js';

/**
 * Application Configuration
 * Provides typed access to all app configuration derived from environment
 */

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  url: string;
}

export interface MinIOConfig {
  endpoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  buckets: {
    documents: string;
    defaults: string;
    userUploads: string;
  };
}

export interface JWTConfig {
  secret: string;
  refreshSecret: string;
  accessExpiry: string;
  refreshExpiry: string;
}

export interface APIConfig {
  port: number;
  version: string;
  corsOrigins: string[];
  rateLimit: {
    public: number;
    authenticated: number;
  };
}

export interface EmailConfig {
  provider: 'console' | 'smtp';
  from: string;
  smtp?: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
}

export interface SMSConfig {
  provider: 'console' | 'twilio';
  from?: string;
}

export interface MapsConfig {
  provider: 'google' | 'openstreetmap';
  apiKey?: string;
}

export interface AppConfig {
  env: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  database: DatabaseConfig;
  redis: RedisConfig;
  minio: MinIOConfig;
  jwt: JWTConfig;
  api: APIConfig;
  email: EmailConfig;
  sms: SMSConfig;
  maps: MapsConfig;
}

/**
 * Build application configuration from environment
 */
function buildAppConfig(env: EnvConfig): AppConfig {
  return {
    env: env.NODE_ENV,
    isDevelopment: env.NODE_ENV === 'development',
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',

    database: {
      url: env.DATABASE_URL,
    },

    redis: {
      url: env.REDIS_URL,
    },

    minio: {
      endpoint: env.MINIO_ENDPOINT,
      port: env.MINIO_PORT,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
      buckets: {
        documents: env.MINIO_BUCKET_DOCUMENTS,
        defaults: env.MINIO_BUCKET_DEFAULTS,
        userUploads: env.MINIO_BUCKET_USER_UPLOADS,
      },
    },

    jwt: {
      secret: env.JWT_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiry: env.JWT_ACCESS_EXPIRY,
      refreshExpiry: env.JWT_REFRESH_EXPIRY,
    },

    api: {
      port: env.PORT,
      version: env.API_VERSION,
      corsOrigins: env.CORS_ORIGIN,
      rateLimit: {
        public: env.RATE_LIMIT_PUBLIC,
        authenticated: env.RATE_LIMIT_AUTHENTICATED,
      },
    },

    email: {
      provider: env.EMAIL_PROVIDER,
      from: env.EMAIL_FROM,
      smtp: env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD
        ? {
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            user: env.SMTP_USER,
            password: env.SMTP_PASSWORD,
          }
        : undefined,
    },

    sms: {
      provider: env.SMS_PROVIDER,
      from: env.SMS_FROM,
    },

    maps: {
      provider: env.MAPS_PROVIDER,
      apiKey: env.GOOGLE_MAPS_API_KEY,
    },
  };
}

let cachedAppConfig: AppConfig | null = null;

/**
 * Get application configuration
 * Loads and caches on first call
 */
export function getAppConfig(): AppConfig {
  if (!cachedAppConfig) {
    const envConfig = getEnvConfig();
    cachedAppConfig = buildAppConfig(envConfig);
  }
  return cachedAppConfig;
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetAppConfig(): void {
  cachedAppConfig = null;
}
