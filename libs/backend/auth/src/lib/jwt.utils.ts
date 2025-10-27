/**
 * JWT Utilities
 * Token generation and verification
 * Reference: Constitution § 4 - Security & Data
 * Reference: Constitution § 10 - No hardcoded values
 *
 * Note: All parameters must be provided by caller (from env config)
 */
import * as jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { z } from 'zod';

/**
 * JWT Token Payload
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: 'OWNER' | 'ADMIN';
}

const tokenPayloadSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  email: z.string().min(1, 'Email is required'),
  role: z.enum(['OWNER', 'ADMIN']),
});

/**
 * Generate an access token (short-lived)
 * @param payload - Token payload
 * @param secret - JWT secret from environment
 * @param expiresIn - Token expiry (e.g., '15m', '1h', 3600) - REQUIRED
 * @param issuer - Token issuer (optional, from env config)
 * @param audience - Token audience (optional, from env config)
 * @returns Signed JWT token
 */
export function generateAccessToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string | number,
  issuer?: string,
  audience?: string
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as any, // Type assertion: jsonwebtoken accepts string formats like '15m', '1h'
    issuer,
    audience,
  });
}

/**
 * Generate a refresh token (long-lived)
 * @param payload - Token payload
 * @param secret - JWT refresh secret from environment
 * @param expiresIn - Token expiry (e.g., '7d', '30d', 604800) - REQUIRED
 * @param issuer - Token issuer (optional, from env config)
 * @param audience - Token audience (optional, from env config)
 * @returns Signed JWT token
 */
export function generateRefreshToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string | number,
  issuer?: string,
  audience?: string
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as any, // Type assertion: jsonwebtoken accepts string formats like '7d', '1h'
    issuer,
    audience,
  });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @param secret - JWT secret to verify against
 * @param issuer - Expected issuer (optional, from env config)
 * @param audience - Expected audience (optional, from env config)
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(
  token: string,
  secret: string,
  issuer?: string,
  audience?: string
): TokenPayload {
  const decoded = jwt.verify(token, secret, {
    issuer,
    audience,
  }) as JwtPayload;

  const result = tokenPayloadSchema.safeParse(decoded);
  if (!result.success) {
    throw new Error('Invalid token payload');
  }
  return result.data;
}

/**
 * Decode a token without verifying (useful for checking expiry)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null if invalid
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.decode(token) as JwtPayload | null;
    if (!decoded) return null;

    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as 'OWNER' | 'ADMIN',
    };
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value
 * @returns Extracted token or null
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1] || null;
}