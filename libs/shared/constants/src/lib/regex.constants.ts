/**
 * Regex Patterns
 * Validation patterns for various data types
 * Reference: Constitution § 10.3 - Constants Library Pattern
 */

/**
 * Nepal Vehicle Registration Number Pattern
 * Format: Province(2 letters) + District(1-2 digits) + Category(1-2 letters) + Number(1-4 digits)
 * Examples: BA 1 PA 1234, BA 12 CHA 123
 *
 * Note: This is the current Nepal format. For multi-country support in future,
 * registration format should be configurable per country from database.
 */
export const NEPAL_REGISTRATION_REGEX = /^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/;
export const NEPAL_REGISTRATION_ERROR_MESSAGE = 'Invalid Nepal vehicle registration format (e.g., BA 1 PA 1234)';

/**
 * Email Pattern (basic validation)
 * For production, rely on Zod's email validation or dedicated email validation library
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone Number Pattern (Nepal)
 * Supports: +977-XXXXXXXXXX or 98XXXXXXXX (10 digits)
 * Note: For international support, use a phone validation library like libphonenumber
 */
export const NEPAL_PHONE_REGEX = /^(?:\+977[-\s]?)?[9][0-9]{9}$/;
export const NEPAL_PHONE_ERROR_MESSAGE = 'Invalid Nepal phone number format';

/**
 * URL Pattern (basic validation)
 * Starts with http:// or https://
 */
export const URL_REGEX = /^https?:\/\/.+/;

/**
 * Alphanumeric with spaces
 * Common for names, titles, etc.
 */
export const ALPHANUMERIC_WITH_SPACES_REGEX = /^[a-zA-Z0-9\s]+$/;

/**
 * Hex Color Code
 * #RGB or #RRGGBB format
 */
export const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
