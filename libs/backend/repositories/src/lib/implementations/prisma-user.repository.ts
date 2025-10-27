/**
 * Prisma User Repository Implementation
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Implements IUserRepository using Prisma ORM
 */

import type { PrismaClient } from '@prisma/client';
import type { IUserRepository, User, UserRole } from '../interfaces/index.js';

/**
 * Prisma implementation of User Repository
 */
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Update user's last login timestamp
   * Note: We store this in updatedAt for now
   * In future, add lastLoginAt field to User model
   */
  async updateLastLogin(id: string, timestamp: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { updatedAt: timestamp },
    });
  }

  /**
   * Update user's password hash
   */
  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  /**
   * Check if user is active
   * Returns true if user exists (no soft delete in current schema)
   */
  async isActive(id: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    return user !== null;
  }

  /**
   * Get user role
   */
  async getRole(id: string): Promise<UserRole | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });

    return user?.role ?? null;
  }
}
