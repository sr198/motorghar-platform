/**
 * User Repository Interface
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Reference: Design Doc § 4.1.1
 */

// Import and re-export UserRole from Prisma (both type and value)
// When importing an enum, you get both the type and runtime object
import { UserRole } from '@prisma/client';

// Re-export for consumers of this module
export { UserRole };

/**
 * User entity type
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Repository Interface
 * Abstracts data access for user operations
 */
export interface IUserRepository {
  /**
   * Find user by email
   * @param email - User email address
   * @returns User or null if not found
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID
   * @param id - User ID (UUID)
   * @returns User or null if not found
   */
  findById(id: string): Promise<User | null>;

  /**
   * Update user's last login timestamp
   * @param id - User ID
   * @param timestamp - Login timestamp
   */
  updateLastLogin(id: string, timestamp: Date): Promise<void>;

  /**
   * Update user's password hash
   * @param id - User ID
   * @param passwordHash - New password hash
   */
  updatePassword(id: string, passwordHash: string): Promise<void>;

  /**
   * Check if user is active (exists and not soft-deleted)
   * @param id - User ID
   * @returns true if user is active, false otherwise
   */
  isActive(id: string): Promise<boolean>;

  /**
   * Get user role
   * @param id - User ID
   * @returns User role or null if user not found
   */
  getRole(id: string): Promise<UserRole | null>;
}