import { describe, it, expect } from '@jest/globals';
import {
  ApiResponseSchema,
  PaginationQuerySchema,
  PaginatedResponseSchema,
  UUIDSchema,
  EmailSchema,
  DateSchema,
  URLSchema,
  RegistrationNumberSchema,
  VehicleTypeSchema,
  UsagePatternSchema,
  ReminderTypeSchema,
  ReminderStatusSchema,
  DocumentKindSchema,
  MimeTypeSchema,
  NewsTypeSchema,
} from './api.schemas.js';
import { z } from 'zod';

describe('api.schemas', () => {
  describe('ApiResponseSchema', () => {
    it('should validate a successful response', () => {
      const validResponse = {
        success: true,
        data: { id: '123', name: 'Test' },
      };

      const result = ApiResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate an error response', () => {
      const errorResponse = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: { resource: 'user' },
        },
      };

      const result = ApiResponseSchema.safeParse(errorResponse);
      expect(result.success).toBe(true);
    });

    it('should require success field', () => {
      const invalid = { data: {} };

      const result = ApiResponseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('PaginationQuerySchema', () => {
    it('should validate pagination with cursor and limit', () => {
      const valid = {
        cursor: 'abc123',
        limit: 25,
      };

      const result = PaginationQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('abc123');
        expect(result.data.limit).toBe(25);
      }
    });

    it('should apply default limit of 20', () => {
      const valid = {};

      const result = PaginationQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    it('should make cursor optional', () => {
      const valid = { limit: 10 };

      const result = PaginationQuerySchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBeUndefined();
      }
    });

    it('should enforce minimum limit of 1', () => {
      const invalid = { limit: 0 };

      const result = PaginationQuerySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum limit of 50', () => {
      const invalid = { limit: 51 };

      const result = PaginationQuerySchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should accept limit at boundary values', () => {
      const min = PaginationQuerySchema.safeParse({ limit: 1 });
      const max = PaginationQuerySchema.safeParse({ limit: 50 });

      expect(min.success).toBe(true);
      expect(max.success).toBe(true);
    });
  });

  describe('PaginatedResponseSchema', () => {
    it('should validate paginated response with data', () => {
      const userSchema = z.object({ id: z.string(), name: z.string() });
      const PaginatedUserSchema = PaginatedResponseSchema(userSchema);

      const valid = {
        data: [
          { id: '1', name: 'User 1' },
          { id: '2', name: 'User 2' },
        ],
        pagination: {
          nextCursor: 'cursor-123',
          hasMore: true,
        },
      };

      const result = PaginatedUserSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should validate paginated response with no more pages', () => {
      const itemSchema = z.object({ id: z.string() });
      const PaginatedItemSchema = PaginatedResponseSchema(itemSchema);

      const valid = {
        data: [{ id: '1' }],
        pagination: {
          nextCursor: null,
          hasMore: false,
        },
      };

      const result = PaginatedItemSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });
  });

  describe('UUIDSchema', () => {
    it('should validate a valid UUID', () => {
      const valid = '550e8400-e29b-41d4-a716-446655440000';

      const result = UUIDSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const invalid = 'not-a-uuid';

      const result = UUIDSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject UUID with wrong format', () => {
      const invalid = '550e8400-e29b-41d4-a716';

      const result = UUIDSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('EmailSchema', () => {
    it('should validate a valid email', () => {
      const valid = 'user@example.com';

      const result = EmailSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalid = 'not-an-email';

      const result = EmailSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const invalid = 'user@';

      const result = EmailSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('DateSchema', () => {
    it('should validate ISO datetime string', () => {
      const valid = '2025-10-25T10:30:00.000Z';

      const result = DateSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid datetime', () => {
      const invalid = '2025-10-25';

      const result = DateSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('URLSchema', () => {
    it('should validate a valid URL', () => {
      const valid = 'https://example.com';

      const result = URLSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalid = 'not-a-url';

      const result = URLSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('RegistrationNumberSchema', () => {
    it('should validate valid Nepal registration numbers', () => {
      const validNumbers = [
        'BA1PA1234',
        'BA12CHA123',
        'KA1KA1',
        'LU12JHA9999',
      ];

      validNumbers.forEach((num) => {
        const result = RegistrationNumberSchema.safeParse(num);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid registration numbers', () => {
      const invalidNumbers = [
        'BA1PA',         // Too short
        'BA1PA12345',    // Too many digits
        'B1PA1234',      // Only 1 letter at start
        'BA1P1234',      // Only 1 letter in category
        'ba1pa1234',     // Lowercase
        '1234',          // No letters
      ];

      invalidNumbers.forEach((num) => {
        const result = RegistrationNumberSchema.safeParse(num);
        expect(result.success).toBe(false);
      });
    });

    it('should allow optional registration number', () => {
      const result = RegistrationNumberSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('VehicleTypeSchema', () => {
    it('should validate CAR type', () => {
      const result = VehicleTypeSchema.safeParse('CAR');
      expect(result.success).toBe(true);
    });

    it('should validate BIKE type', () => {
      const result = VehicleTypeSchema.safeParse('BIKE');
      expect(result.success).toBe(true);
    });

    it('should reject invalid vehicle type', () => {
      const result = VehicleTypeSchema.safeParse('TRUCK');
      expect(result.success).toBe(false);
    });
  });

  describe('UsagePatternSchema', () => {
    it('should validate all usage patterns', () => {
      const patterns = ['DAILY', 'OCCASIONAL', 'RARE'];

      patterns.forEach((pattern) => {
        const result = UsagePatternSchema.safeParse(pattern);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid usage pattern', () => {
      const result = UsagePatternSchema.safeParse('NEVER');
      expect(result.success).toBe(false);
    });
  });

  describe('ReminderTypeSchema', () => {
    it('should validate all reminder types', () => {
      const types = ['SERVICE', 'INSURANCE', 'EMI', 'CUSTOM'];

      types.forEach((type) => {
        const result = ReminderTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid reminder type', () => {
      const result = ReminderTypeSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('ReminderStatusSchema', () => {
    it('should validate all reminder statuses', () => {
      const statuses = ['PENDING', 'SENT', 'DISMISSED'];

      statuses.forEach((status) => {
        const result = ReminderStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid reminder status', () => {
      const result = ReminderStatusSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('DocumentKindSchema', () => {
    it('should validate all document kinds', () => {
      const kinds = ['BLUEBOOK', 'INSURANCE', 'TAX', 'OTHER'];

      kinds.forEach((kind) => {
        const result = DocumentKindSchema.safeParse(kind);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid document kind', () => {
      const result = DocumentKindSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });

  describe('MimeTypeSchema', () => {
    it('should validate allowed image MIME types', () => {
      const imageMimes = ['image/jpeg', 'image/png', 'image/webp'];

      imageMimes.forEach((mime) => {
        const result = MimeTypeSchema.safeParse(mime);
        expect(result.success).toBe(true);
      });
    });

    it('should validate allowed document MIME types', () => {
      const result = MimeTypeSchema.safeParse('application/pdf');
      expect(result.success).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      const disallowed = ['image/gif', 'application/zip', 'text/plain'];

      disallowed.forEach((mime) => {
        const result = MimeTypeSchema.safeParse(mime);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('NewsTypeSchema', () => {
    it('should validate all news types', () => {
      const types = ['NEWS', 'EVENT', 'RECALL'];

      types.forEach((type) => {
        const result = NewsTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid news type', () => {
      const result = NewsTypeSchema.safeParse('INVALID');
      expect(result.success).toBe(false);
    });
  });
});
