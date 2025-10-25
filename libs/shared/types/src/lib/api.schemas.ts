import { z } from 'zod';
import {
  PAGINATION_MIN,
  PAGINATION_MAX,
  PAGINATION_DEFAULT,
  ALLOWED_MIME_TYPES,
  NEPAL_REGISTRATION_REGEX,
  NEPAL_REGISTRATION_ERROR_MESSAGE,
} from '@motorghar-platform/constants';

/**
 * API Response Schemas
 * Standard API response format and common validation schemas
 * Reference: Solution Design v1.0 § 6 (API Design)
 * Per Constitution § 10.2 - Using constants from @motorghar-platform/constants
 */

// Standard API Response Envelope
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
});

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

// Pagination
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(PAGINATION_MIN).max(PAGINATION_MAX).default(PAGINATION_DEFAULT),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    }),
  });

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
};

// Common Field Validations
export const UUIDSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const DateSchema = z.string().datetime();
export const URLSchema = z.string().url();

// Vehicle-related validations
export const RegistrationNumberSchema = z
  .string()
  .regex(NEPAL_REGISTRATION_REGEX, NEPAL_REGISTRATION_ERROR_MESSAGE)
  .optional();

export const VehicleTypeSchema = z.enum(['CAR', 'BIKE']);
export const UsagePatternSchema = z.enum(['DAILY', 'OCCASIONAL', 'RARE']);

// Service-related validations
export const ReminderTypeSchema = z.enum(['SERVICE', 'INSURANCE', 'EMI', 'CUSTOM']);
export const ReminderStatusSchema = z.enum(['PENDING', 'SENT', 'DISMISSED']);

// Document-related validations
export const DocumentKindSchema = z.enum(['BLUEBOOK', 'INSURANCE', 'TAX', 'OTHER']);
export const MimeTypeSchema = z.enum(ALLOWED_MIME_TYPES);

// News-related validations
export const NewsTypeSchema = z.enum(['NEWS', 'EVENT', 'RECALL']);
