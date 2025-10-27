/**
 * Redis Token Blacklist Repository Implementation
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Implements ITokenBlacklistRepository using Redis with TTL
 */

import type { Redis } from 'ioredis';
import type { ITokenBlacklistRepository } from '../interfaces/index.js';

/**
 * Key prefix for blacklisted tokens in Redis
 */
const BLACKLIST_PREFIX = 'auth:blacklist:token:';

/**
 * Redis implementation of Token Blacklist Repository
 * Uses Redis SET with EX (expiry) for automatic cleanup
 */
export class RedisTokenBlacklistRepository implements ITokenBlacklistRepository {
  constructor(private readonly redis: Redis) {}

  /**
   * Add token to blacklist with TTL
   */
  async add(token: string, ttlSeconds: number): Promise<void> {
    const key = this.getKey(token);
    // Store "1" as value, we only care about key existence
    // EX sets expiry in seconds
    await this.redis.set(key, '1', 'EX', ttlSeconds);
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const key = this.getKey(token);
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  /**
   * Remove token from blacklist
   */
  async remove(token: string): Promise<void> {
    const key = this.getKey(token);
    await this.redis.del(key);
  }

  /**
   * Generate Redis key for token
   * Uses SHA256 hash of token for fixed-length keys
   */
  private getKey(token: string): string {
    // For now, use the token directly as key suffix
    // In production, consider hashing for privacy and fixed-length keys
    return `${BLACKLIST_PREFIX}${token}`;
  }
}