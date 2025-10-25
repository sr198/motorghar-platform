/**
 * API Constants
 * Rate limiting, mime types, and API configuration
 * Reference: Constitution § 5 - Performance & Resilience
 */

// Rate Limiting
export const RATE_LIMIT_PUBLIC_DEFAULT = 60; // requests per minute
export const RATE_LIMIT_AUTHENTICATED_DEFAULT = 300; // requests per minute
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

// API Versioning
export const API_VERSION_DEFAULT = 'v1';
export const API_BASE_PATH = '/api';

// MIME Types
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
] as const;

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
] as const;

export type AllowedMimeType = typeof ALLOWED_MIME_TYPES[number];

// HTTP Status Codes (commonly used)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Request Headers
export const CUSTOM_HEADERS = {
  REQUEST_ID: 'X-Request-ID',
  IDEMPOTENCY_KEY: 'Idempotency-Key',
  API_VERSION: 'X-API-Version',
} as const;
