/**
 * Validation Constants
 * Field length constraints, numeric limits, and validation rules
 * Reference: Constitution § 10.1 - Zero Hardcoding Policy
 */

// Port Configuration
export const MIN_PORT = 1;
export const MAX_PORT = 65535;
export const DEFAULT_PORT = 3000;

// Password Constraints
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;

// Name Constraints
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 100;

// Pagination Limits
export const PAGINATION_MIN = 1;
export const PAGINATION_MAX = 50;
export const PAGINATION_DEFAULT = 20;

// File Upload Limits
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// String Length Constraints
export const EMAIL_MAX_LENGTH = 255;
export const URL_MAX_LENGTH = 2048;
export const TEXT_SHORT_MAX_LENGTH = 255;
export const TEXT_MEDIUM_MAX_LENGTH = 1000;

// Numeric Constraints
export const MILEAGE_MIN = 0;
export const MILEAGE_MAX = 999999;
export const SERVICE_COST_MIN = 0;
export const SERVICE_COST_MAX = 999999.99;
export const RATING_MIN = 1;
export const RATING_MAX = 5;

// Year Constraints
export const VEHICLE_YEAR_MIN = 1900;
export const VEHICLE_YEAR_MAX = new Date().getFullYear() + 1;

// Timeouts and Intervals (milliseconds)
export const DEFAULT_REQUEST_TIMEOUT_MS = 30000; // 30 seconds
export const DEFAULT_DB_QUERY_TIMEOUT_MS = 10000; // 10 seconds
export const DEFAULT_CACHE_TTL_SECONDS = 300; // 5 minutes
