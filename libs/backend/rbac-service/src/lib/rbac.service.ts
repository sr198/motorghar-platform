/**
 * RBACService
 * Reference: ADR 001 - Clean Architecture for Auth & RBAC
 * Reference: Design Doc § 4.2.2
 *
 * Business logic for Role-Based Access Control:
 * - Role checking
 * - User activity status
 * - Permission validation
 */

import type { IUserRepository, UserRole } from '@motorghar-platform/repositories';

/**
 * RBACService - Handles role-based access control business logic
 */
export class RBACService {
  constructor(private readonly userRepo: IUserRepository) {}

  /**
   * Check if user has a specific role
   *
   * @param userId - User ID
   * @param role - Role to check
   * @returns true if user has the role, false otherwise
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean> {
    const userRole = await this.userRepo.getRole(userId);
    return userRole === role;
  }

  /**
   * Check if user has ANY of the specified roles
   *
   * @param userId - User ID
   * @param roles - Array of roles to check
   * @returns true if user has any of the roles, false otherwise
   */
  async hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean> {
    const userRole = await this.userRepo.getRole(userId);
    if (!userRole) {
      return false;
    }
    return roles.includes(userRole);
  }

  /**
   * Check if user has ALL of the specified roles
   * Note: In current design, user can only have one role,
   * so this will only return true if roles array has exactly one element matching user's role
   *
   * @param userId - User ID
   * @param roles - Array of roles to check
   * @returns true if user has all roles, false otherwise
   */
  async hasAllRoles(userId: string, roles: UserRole[]): Promise<boolean> {
    const userRole = await this.userRepo.getRole(userId);
    if (!userRole) {
      return false;
    }
    // Since users have only one role, check if that role is in the array
    // and the array has only one element
    return roles.length === 1 && roles[0] === userRole;
  }

  /**
   * Get user's role
   *
   * @param userId - User ID
   * @returns User role or null if user not found
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    return this.userRepo.getRole(userId);
  }

  /**
   * Check if user is admin
   * Admin role has elevated privileges
   *
   * @param userId - User ID
   * @returns true if user has ADMIN role, false otherwise
   */
  async isAdmin(userId: string): Promise<boolean> {
    const userRole = await this.userRepo.getRole(userId);
    return userRole === 'ADMIN';
  }

  /**
   * Check if user is owner
   * Owner role has the highest privileges
   *
   * @param userId - User ID
   * @returns true if user has OWNER role, false otherwise
   */
  async isOwner(userId: string): Promise<boolean> {
    const userRole = await this.userRepo.getRole(userId);
    return userRole === 'OWNER';
  }

  /**
   * Check if user is active
   * Active users can access the system
   *
   * @param userId - User ID
   * @returns true if user is active, false otherwise
   */
  async isUserActive(userId: string): Promise<boolean> {
    return this.userRepo.isActive(userId);
  }
}

// Re-export types for convenience
export type { UserRole };