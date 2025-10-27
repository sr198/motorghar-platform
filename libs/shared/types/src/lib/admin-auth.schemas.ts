/**
 * Admin Authentication Schemas
 * Zod validation schemas for admin auth endpoints
 * Reference: Phase 1 Spec § 2 (Admin Authentication)
 */

import { z } from 'zod';
import { PASSWORD_MIN_LENGTH } from '@motorghar-platform/constants';

/**
 * POST /api/v1/admin/auth/login
 */
export const AdminLoginRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`),
});

export type AdminLoginRequest = z.infer<typeof AdminLoginRequestSchema>;

export const AdminLoginResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      name: z.string(),
      role: z.enum(['ADMIN']),
    }),
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

export type AdminLoginResponse = z.infer<typeof AdminLoginResponseSchema>;

/**
 * POST /api/v1/admin/auth/refresh
 */
export const AdminRefreshRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type AdminRefreshRequest = z.infer<typeof AdminRefreshRequestSchema>;

export const AdminRefreshResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
  }),
});

export type AdminRefreshResponse = z.infer<typeof AdminRefreshResponseSchema>;

/**
 * POST /api/v1/admin/auth/logout
 */
export const AdminLogoutRequestSchema = z.object({
  refreshToken: z.string().optional(),
});

export type AdminLogoutRequest = z.infer<typeof AdminLogoutRequestSchema>;

export const AdminLogoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export type AdminLogoutResponse = z.infer<typeof AdminLogoutResponseSchema>;
