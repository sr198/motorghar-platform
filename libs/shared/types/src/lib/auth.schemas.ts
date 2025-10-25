import { z } from 'zod';
import { EmailSchema } from './api.schemas.js';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_MAX_LENGTH,
  NAME_MIN_LENGTH,
  NAME_MAX_LENGTH,
} from '@motorghar-platform/constants';

/**
 * Authentication & Authorization Schemas
 * Request/response schemas for auth endpoints
 * Reference: Solution Design v1.0 § 3.1 & 7 (User Management & Security)
 * Per Constitution § 10.2 - Using constants from @motorghar-platform/constants
 */

// User Roles
export const UserRoleSchema = z.enum(['OWNER', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Registration
export const RegisterRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  name: z.string().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH),
  phone: z.string().optional(),
  lang: z.enum(['en', 'ne']).default('en'),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const RegisterResponseSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: EmailSchema,
    name: z.string(),
    role: UserRoleSchema,
  }),
  tokens: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// Login
export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = RegisterResponseSchema;
export type LoginResponse = RegisterResponse;

// Refresh Token
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;

export const RefreshTokenResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

// Profile
export const UpdateProfileRequestSchema = z.object({
  name: z.string().min(NAME_MIN_LENGTH).max(NAME_MAX_LENGTH).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  lang: z.enum(['en', 'ne']).optional(),
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

// JWT Payload
export const JWTPayloadSchema = z.object({
  userId: z.string().uuid(),
  email: EmailSchema,
  role: UserRoleSchema,
  iat: z.number(),
  exp: z.number(),
});

export type JWTPayload = z.infer<typeof JWTPayloadSchema>;
