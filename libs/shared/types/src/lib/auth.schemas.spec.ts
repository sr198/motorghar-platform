import { describe, it, expect } from '@jest/globals';
import {
  UserRoleSchema,
  RegisterRequestSchema,
  RegisterResponseSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  RefreshTokenRequestSchema,
  RefreshTokenResponseSchema,
  UpdateProfileRequestSchema,
  JWTPayloadSchema,
} from './auth.schemas.js';

describe('auth.schemas', () => {
  describe('UserRoleSchema', () => {
    it('should validate OWNER role', () => {
      const result = UserRoleSchema.safeParse('OWNER');
      expect(result.success).toBe(true);
    });

    it('should validate ADMIN role', () => {
      const result = UserRoleSchema.safeParse('ADMIN');
      expect(result.success).toBe(true);
    });

    it('should reject invalid role', () => {
      const result = UserRoleSchema.safeParse('USER');
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterRequestSchema', () => {
    const validRequest = {
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'John Doe',
      lang: 'en' as const,
    };

    it('should validate a valid registration request', () => {
      const result = RegisterRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should apply default language as "en"', () => {
      const request = {
        email: 'user@example.com',
        password: 'SecurePass123!',
        name: 'John Doe',
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lang).toBe('en');
      }
    });

    it('should allow optional phone number', () => {
      const requestWithPhone = {
        ...validRequest,
        phone: '+977-9812345678',
      };

      const result = RegisterRequestSchema.safeParse(requestWithPhone);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.phone).toBe('+977-9812345678');
      }
    });

    it('should validate Nepali language', () => {
      const request = {
        ...validRequest,
        lang: 'ne' as const,
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lang).toBe('ne');
      }
    });

    it('should reject invalid email', () => {
      const request = {
        ...validRequest,
        email: 'invalid-email',
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should enforce minimum password length of 8', () => {
      const request = {
        ...validRequest,
        password: 'Short1!',
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum password length of 100', () => {
      const request = {
        ...validRequest,
        password: 'A'.repeat(101),
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should allow password at boundary lengths', () => {
      const minPassword = {
        ...validRequest,
        password: 'Pass1234', // 8 chars
      };
      const maxPassword = {
        ...validRequest,
        password: 'A'.repeat(100), // 100 chars
      };

      expect(RegisterRequestSchema.safeParse(minPassword).success).toBe(true);
      expect(RegisterRequestSchema.safeParse(maxPassword).success).toBe(true);
    });

    it('should enforce minimum name length of 2', () => {
      const request = {
        ...validRequest,
        name: 'A',
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum name length of 100', () => {
      const request = {
        ...validRequest,
        name: 'A'.repeat(101),
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should allow name at boundary lengths', () => {
      const minName = {
        ...validRequest,
        name: 'AB', // 2 chars
      };
      const maxName = {
        ...validRequest,
        name: 'A'.repeat(100), // 100 chars
      };

      expect(RegisterRequestSchema.safeParse(minName).success).toBe(true);
      expect(RegisterRequestSchema.safeParse(maxName).success).toBe(true);
    });

    it('should reject invalid language', () => {
      const request = {
        ...validRequest,
        lang: 'fr' as any,
      };

      const result = RegisterRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should require all mandatory fields', () => {
      const incomplete = { email: 'user@example.com' };

      const result = RegisterRequestSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe('RegisterResponseSchema', () => {
    const validResponse = {
      user: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'OWNER' as const,
      },
      tokens: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    };

    it('should validate a valid registration response', () => {
      const result = RegisterResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should require valid UUID for user ID', () => {
      const response = {
        ...validResponse,
        user: { ...validResponse.user, id: 'not-a-uuid' },
      };

      const result = RegisterResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('should require valid email', () => {
      const response = {
        ...validResponse,
        user: { ...validResponse.user, email: 'not-an-email' },
      };

      const result = RegisterResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });

    it('should require valid role', () => {
      const response = {
        ...validResponse,
        user: { ...validResponse.user, role: 'INVALID' as any },
      };

      const result = RegisterResponseSchema.safeParse(response);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginRequestSchema', () => {
    const validRequest = {
      email: 'user@example.com',
      password: 'SecurePass123!',
    };

    it('should validate a valid login request', () => {
      const result = LoginRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should require email field', () => {
      const request = { password: 'SecurePass123!' };

      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should require password field', () => {
      const request = { email: 'user@example.com' };

      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email', () => {
      const request = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      const result = LoginRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('LoginResponseSchema', () => {
    it('should be identical to RegisterResponseSchema', () => {
      const response = {
        user: {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'OWNER' as const,
        },
        tokens: {
          accessToken: 'token1',
          refreshToken: 'token2',
        },
      };

      const registerResult = RegisterResponseSchema.safeParse(response);
      const loginResult = LoginResponseSchema.safeParse(response);

      expect(registerResult.success).toBe(true);
      expect(loginResult.success).toBe(true);
    });
  });

  describe('RefreshTokenRequestSchema', () => {
    it('should validate a valid refresh token request', () => {
      const request = {
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };

      const result = RefreshTokenRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should require refreshToken field', () => {
      const request = {};

      const result = RefreshTokenRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });
  });

  describe('RefreshTokenResponseSchema', () => {
    it('should validate a valid refresh token response', () => {
      const response = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      const result = RefreshTokenResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it('should require both tokens', () => {
      const incomplete = { accessToken: 'token' };

      const result = RefreshTokenResponseSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateProfileRequestSchema', () => {
    it('should validate a valid profile update request', () => {
      const request = {
        name: 'Jane Doe',
        phone: '+977-9812345678',
        address: '123 Main St',
        city: 'Kathmandu',
        lang: 'ne' as const,
      };

      const result = UpdateProfileRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should allow partial updates', () => {
      const request = { name: 'Jane Doe' };

      const result = UpdateProfileRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should allow empty object for no updates', () => {
      const request = {};

      const result = UpdateProfileRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it('should enforce minimum name length when provided', () => {
      const request = { name: 'A' };

      const result = UpdateProfileRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum name length when provided', () => {
      const request = { name: 'A'.repeat(101) };

      const result = UpdateProfileRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it('should validate language options', () => {
      const validEn = { lang: 'en' as const };
      const validNe = { lang: 'ne' as const };
      const invalid = { lang: 'fr' as any };

      expect(UpdateProfileRequestSchema.safeParse(validEn).success).toBe(true);
      expect(UpdateProfileRequestSchema.safeParse(validNe).success).toBe(true);
      expect(UpdateProfileRequestSchema.safeParse(invalid).success).toBe(false);
    });
  });

  describe('JWTPayloadSchema', () => {
    const validPayload = {
      userId: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      role: 'OWNER' as const,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    it('should validate a valid JWT payload', () => {
      const result = JWTPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should require valid UUID for userId', () => {
      const payload = {
        ...validPayload,
        userId: 'not-a-uuid',
      };

      const result = JWTPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should require valid email', () => {
      const payload = {
        ...validPayload,
        email: 'not-an-email',
      };

      const result = JWTPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should require valid role', () => {
      const payload = {
        ...validPayload,
        role: 'INVALID' as any,
      };

      const result = JWTPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should require iat and exp as numbers', () => {
      const payload = {
        ...validPayload,
        iat: '1234567890' as any,
      };

      const result = JWTPayloadSchema.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should require all fields', () => {
      const incomplete = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
      };

      const result = JWTPayloadSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
    });
  });
});
