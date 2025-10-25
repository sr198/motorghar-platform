/**
 * Application-wide Constants
 * Core application identifiers and settings
 */

export const APP_NAME = 'motorghar' as const;
export const APP_DISPLAY_NAME = 'MotorGhar' as const;

export const SUPPORTED_LANGUAGES = ['en', 'ne'] as const;
export const DEFAULT_LANGUAGE = 'en' as const;

export const DEFAULT_COUNTRY_CODE = 'NP' as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];