# Authentication & RBAC Architecture Design

**Status:** Draft for Review
**Date:** October 27, 2025
**Author:** AI Agent
**Reviewers:** @srijan

---

## 1. Overview

Design a reusable, testable authentication and RBAC system following Clean Architecture principles:
- **Separation of Concerns:** Service layer, Repository layer, Framework layer
- **Dependency Inversion:** Services depend on repository interfaces, not implementations
- **Reusability:** Shared libraries work across all Fastify apps in the monorepo
- **Testability:** Easy to mock and test each layer independently

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│  Fastify Gateway (apps/fastify-gateway)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Fastify Plugins (framework layer)                     │  │
│  │ - @fastify-auth-plugin                                │  │
│  │ - @fastify-rbac-plugin                                │  │
│  │                                                        │  │
│  │ Decorators: authenticate, requireRole, requireAdmin   │  │
│  └───────────┬───────────────────────────────────────────┘  │
└──────────────┼──────────────────────────────────────────────┘
               │ depends on ↓
┌──────────────┼──────────────────────────────────────────────┐
│              ↓                                               │
│  Service Layer (libs/backend/auth-service)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ AuthService                                            │  │
│  │ - login(email, password)                               │  │
│  │ - refreshToken(refreshToken)                           │  │
│  │ - logout(userId, token)                                │  │
│  │ - verifyAndDecodeToken(token)                          │  │
│  │                                                        │  │
│  │ SessionService                                         │  │
│  │ - createSession(userId, deviceInfo)                    │  │
│  │ - validateSession(sessionId)                           │  │
│  │ - revokeSession(sessionId)                             │  │
│  │ - listUserSessions(userId)                             │  │
│  │                                                        │  │
│  │ RBACService                                            │  │
│  │ - hasRole(userId, role)                                │  │
│  │ - hasPermission(userId, permission)                    │  │
│  │ - grantRole(userId, role)                              │  │
│  │ - checkAccess(userId, resource, action)                │  │
│  └───────────┬───────────────────────────────────────────┘  │
└──────────────┼──────────────────────────────────────────────┘
               │ depends on ↓
┌──────────────┼──────────────────────────────────────────────┐
│              ↓                                               │
│  Repository Layer (libs/backend/repositories)               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ IUserRepository (interface)                            │  │
│  │ - findByEmail(email)                                   │  │
│  │ - findById(id)                                         │  │
│  │ - updateLastLogin(id)                                  │  │
│  │                                                        │  │
│  │ ISessionRepository (interface)                         │  │
│  │ - create(session)                                      │  │
│  │ - findByToken(token)                                   │  │
│  │ - revoke(sessionId)                                    │  │
│  │ - findActiveByUser(userId)                             │  │
│  │                                                        │  │
│  │ ITokenBlacklistRepository (interface)                  │  │
│  │ - add(token, ttl)                                      │  │
│  │ - isBlacklisted(token)                                 │  │
│  └───────────┬───────────────────────────────────────────┘  │
└──────────────┼──────────────────────────────────────────────┘
               │ implements ↓
┌──────────────┼──────────────────────────────────────────────┐
│              ↓                                               │
│  Implementation Layer (libs/backend/repositories)           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ PrismaUserRepository (implements IUserRepository)      │  │
│  │ PrismaSessionRepository (implements ISessionRepository)│  │
│  │ RedisTokenBlacklistRepository (implements IToken...)   │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Proposed Library Structure

### 3.1 New Libraries to Create

```
libs/
├── backend/
│   ├── auth-service/              # Auth business logic
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── session.service.ts
│   │   │   │   ├── device.service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── rbac-service/              # RBAC business logic
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── rbac.service.ts
│   │   │   │   ├── permission.service.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── repositories/              # Repository interfaces & implementations
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── interfaces/
│   │   │   │   │   ├── user.repository.interface.ts
│   │   │   │   │   ├── session.repository.interface.ts
│   │   │   │   │   ├── token-blacklist.repository.interface.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── implementations/
│   │   │   │   │   ├── prisma-user.repository.ts
│   │   │   │   │   ├── prisma-session.repository.ts
│   │   │   │   │   ├── redis-token-blacklist.repository.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── fastify-plugins/           # Fastify-specific integrations
│       ├── src/
│       │   ├── lib/
│       │   │   ├── auth.plugin.ts
│       │   │   ├── rbac.plugin.ts
│       │   │   ├── rate-limit.plugin.ts
│       │   │   └── index.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
```

### 3.2 Existing Libraries (Refactor)

```
libs/
├── backend/
│   ├── auth/                      # Keep JWT utils, password utils
│   │   ├── jwt.utils.ts           # Token generation/verification
│   │   ├── password.utils.ts      # Hashing/comparison
│   │   └── token.utils.ts         # Token extraction helpers
```

---

## 4. Detailed Design

### 4.1 Repository Layer

**Purpose:** Abstract data access, enable testing, allow swapping implementations

#### 4.1.1 User Repository Interface

```typescript
// libs/backend/repositories/src/lib/interfaces/user.repository.interface.ts

export interface IUserRepository {
  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Update user's last login timestamp
   */
  updateLastLogin(id: string, timestamp: Date): Promise<void>;

  /**
   * Update user's password hash
   */
  updatePassword(id: string, passwordHash: string): Promise<void>;

  /**
   * Check if user is active
   */
  isActive(id: string): Promise<boolean>;

  /**
   * Get user role
   */
  getRole(id: string): Promise<UserRole | null>;
}

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
}
```

#### 4.1.2 Session Repository Interface

```typescript
// libs/backend/repositories/src/lib/interfaces/session.repository.interface.ts

export interface ISessionRepository {
  /**
   * Create a new session
   */
  create(session: CreateSessionDTO): Promise<Session>;

  /**
   * Find session by refresh token
   */
  findByRefreshToken(token: string): Promise<Session | null>;

  /**
   * Find all active sessions for a user
   */
  findActiveByUser(userId: string): Promise<Session[]>;

  /**
   * Revoke a session
   */
  revoke(sessionId: string): Promise<void>;

  /**
   * Revoke all sessions for a user
   */
  revokeAllForUser(userId: string): Promise<void>;

  /**
   * Update session last activity
   */
  updateLastActivity(sessionId: string, timestamp: Date): Promise<void>;

  /**
   * Cleanup expired sessions
   */
  cleanupExpired(): Promise<number>; // Returns count of deleted sessions
}

export type Session = {
  id: string;
  userId: string;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  expiresAt: Date;
  lastActivityAt: Date;
  createdAt: Date;
  revokedAt: Date | null;
};

export type DeviceInfo = {
  userAgent: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  os?: string;
  browser?: string;
};

export type CreateSessionDTO = Omit<Session, 'id' | 'createdAt' | 'revokedAt'>;
```

#### 4.1.3 Token Blacklist Repository Interface

```typescript
// libs/backend/repositories/src/lib/interfaces/token-blacklist.repository.interface.ts

export interface ITokenBlacklistRepository {
  /**
   * Add token to blacklist with TTL
   */
  add(token: string, ttlSeconds: number): Promise<void>;

  /**
   * Check if token is blacklisted
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * Remove token from blacklist (manual cleanup)
   */
  remove(token: string): Promise<void>;
}
```

---

### 4.2 Service Layer

**Purpose:** Business logic, orchestration, validation

#### 4.2.1 Auth Service

```typescript
// libs/backend/auth-service/src/lib/auth.service.ts

export interface AuthServiceConfig {
  jwtSecret: string;
  accessTokenExpiry: string;
  refreshTokenExpiry: string;
  maxSessionsPerUser: number;
}

export class AuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly sessionRepo: ISessionRepository,
    private readonly blacklistRepo: ITokenBlacklistRepository,
    private readonly config: AuthServiceConfig
  ) {}

  /**
   * Login with email and password
   * Returns access token and refresh token
   */
  async login(
    email: string,
    password: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<LoginResult>;

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<RefreshResult>;

  /**
   * Logout - revoke session and blacklist tokens
   */
  async logout(userId: string, accessToken: string, refreshToken: string): Promise<void>;

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<void>;

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload>;

  /**
   * Get active sessions for user
   */
  async getActiveSessions(userId: string): Promise<Session[]>;

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string): Promise<void>;
}

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
};

export type RefreshResult = {
  accessToken: string;
  expiresIn: number;
};

export type TokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
  sessionId?: string;
};
```

#### 4.2.2 RBAC Service

```typescript
// libs/backend/rbac-service/src/lib/rbac.service.ts

export class RBACService {
  constructor(private readonly userRepo: IUserRepository) {}

  /**
   * Check if user has a specific role
   */
  async hasRole(userId: string, role: UserRole): Promise<boolean>;

  /**
   * Check if user has ANY of the specified roles
   */
  async hasAnyRole(userId: string, roles: UserRole[]): Promise<boolean>;

  /**
   * Check if user has ALL of the specified roles
   */
  async hasAllRoles(userId: string, roles: UserRole[]): Promise<boolean>;

  /**
   * Get user's role
   */
  async getUserRole(userId: string): Promise<UserRole | null>;

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean>;

  /**
   * Check if user is active
   */
  async isUserActive(userId: string): Promise<boolean>;
}
```

#### 4.2.3 Session Service

```typescript
// libs/backend/auth-service/src/lib/session.service.ts

export class SessionService {
  constructor(
    private readonly sessionRepo: ISessionRepository,
    private readonly config: { maxSessionsPerUser: number; sessionTTL: number }
  ) {}

  /**
   * Create new session for user
   * Enforces max sessions limit
   */
  async createSession(
    userId: string,
    refreshToken: string,
    deviceInfo: DeviceInfo,
    ipAddress: string
  ): Promise<Session>;

  /**
   * Validate session by refresh token
   */
  async validateSession(refreshToken: string): Promise<Session | null>;

  /**
   * List all active sessions for user
   */
  async listUserSessions(userId: string): Promise<Session[]>;

  /**
   * Revoke specific session
   */
  async revokeSession(sessionId: string): Promise<void>;

  /**
   * Revoke all sessions for user
   */
  async revokeAllSessions(userId: string): Promise<void>;

  /**
   * Update session activity
   */
  async updateActivity(sessionId: string): Promise<void>;

  /**
   * Cleanup expired sessions (background job)
   */
  async cleanupExpiredSessions(): Promise<number>;
}
```

---

### 4.3 Fastify Plugin Layer

**Purpose:** Framework integration, request/response handling

#### 4.3.1 Auth Plugin

```typescript
// libs/backend/fastify-plugins/src/lib/auth.plugin.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { AuthService } from '@motorghar-platform/auth-service';
import { extractBearerToken } from '@motorghar-platform/auth';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    optionalAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface AuthPluginOptions {
  authService: AuthService;
}

async function authPlugin(fastify: FastifyInstance, options: AuthPluginOptions) {
  const { authService } = options;

  /**
   * Decorator: Require authentication
   * Attaches user to request.user
   */
  fastify.decorate('authenticate', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return reply.code(401).send({
        success: false,
        error: 'Missing or invalid authorization header',
      });
    }

    try {
      const payload = await authService.verifyAccessToken(token);
      request.user = payload;
    } catch (error) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  });

  /**
   * Decorator: Optional authentication
   * Attaches user if token is valid, otherwise continues
   */
  fastify.decorate('optionalAuth', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      return; // No token, continue without user
    }

    try {
      const payload = await authService.verifyAccessToken(token);
      request.user = payload;
    } catch (error) {
      // Invalid token, continue without user
      return;
    }
  });
}

export default fp(authPlugin, {
  name: '@motorghar/auth-plugin',
  dependencies: [],
});
```

#### 4.3.2 RBAC Plugin

```typescript
// libs/backend/fastify-plugins/src/lib/rbac.plugin.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { RBACService } from '@motorghar-platform/rbac-service';
import { UserRole } from '@motorghar-platform/repositories';

declare module 'fastify' {
  interface FastifyInstance {
    requireRole: (role: UserRole) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    requireAnyRole: (roles: UserRole[]) => (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export interface RBACPluginOptions {
  rbacService: RBACService;
}

async function rbacPlugin(fastify: FastifyInstance, options: RBACPluginOptions) {
  const { rbacService } = options;

  /**
   * Decorator: Require specific role
   */
  fastify.decorate('requireRole', (role: UserRole) => {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }

      const hasRole = await rbacService.hasRole(request.user.userId, role);

      if (!hasRole) {
        return reply.code(403).send({
          success: false,
          error: `${role} role required`,
        });
      }
    };
  });

  /**
   * Decorator: Require any of the specified roles
   */
  fastify.decorate('requireAnyRole', (roles: UserRole[]) => {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: 'Authentication required',
        });
      }

      const hasAnyRole = await rbacService.hasAnyRole(request.user.userId, roles);

      if (!hasAnyRole) {
        return reply.code(403).send({
          success: false,
          error: `One of [${roles.join(', ')}] roles required`,
        });
      }
    };
  });

  /**
   * Decorator: Require admin role
   */
  fastify.decorate('requireAdmin', async function (
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    if (!request.user) {
      return reply.code(401).send({
        success: false,
        error: 'Authentication required',
      });
    }

    const isAdmin = await rbacService.isAdmin(request.user.userId);

    if (!isAdmin) {
      return reply.code(403).send({
        success: false,
        error: 'Admin access required',
      });
    }
  });
}

export default fp(rbacPlugin, {
  name: '@motorghar/rbac-plugin',
  dependencies: ['@motorghar/auth-plugin'],
});
```

---

### 4.4 Usage in Fastify Gateway

```typescript
// apps/fastify-gateway/src/app/app.ts

import { FastifyInstance } from 'fastify';
import AutoLoad from '@fastify/autoload';
import authPlugin from '@motorghar-platform/fastify-plugins/auth';
import rbacPlugin from '@motorghar-platform/fastify-plugins/rbac';
import { AuthService, SessionService } from '@motorghar-platform/auth-service';
import { RBACService } from '@motorghar-platform/rbac-service';
import {
  PrismaUserRepository,
  PrismaSessionRepository,
  RedisTokenBlacklistRepository,
} from '@motorghar-platform/repositories';
import { prisma, redis } from '@motorghar-platform/database';
import { getEnvConfig } from '@motorghar-platform/config';

export async function app(fastify: FastifyInstance) {
  const config = getEnvConfig();

  // Initialize repositories
  const userRepo = new PrismaUserRepository(prisma);
  const sessionRepo = new PrismaSessionRepository(prisma);
  const blacklistRepo = new RedisTokenBlacklistRepository(redis);

  // Initialize services
  const authService = new AuthService(userRepo, sessionRepo, blacklistRepo, {
    jwtSecret: config.JWT_SECRET,
    accessTokenExpiry: config.JWT_ACCESS_EXPIRY,
    refreshTokenExpiry: config.JWT_REFRESH_EXPIRY,
    maxSessionsPerUser: config.MAX_SESSIONS_PER_USER,
  });

  const rbacService = new RBACService(userRepo);

  // Register plugins
  await fastify.register(authPlugin, { authService });
  await fastify.register(rbacPlugin, { rbacService });

  // Load other plugins and routes
  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
  });

  await fastify.register(AutoLoad, {
    dir: path.join(__dirname, 'routes'),
  });
}
```

---

### 4.5 Example Route Usage

```typescript
// apps/fastify-gateway/src/app/routes/admin/users.ts

import { FastifyInstance } from 'fastify';
import { UserRole } from '@motorghar-platform/repositories';

export default async function (fastify: FastifyInstance) {
  // Public route - no auth
  fastify.get('/health', async () => ({ status: 'ok' }));

  // Authenticated route - any logged-in user
  fastify.get(
    '/profile',
    {
      preHandler: fastify.authenticate,
    },
    async (request) => {
      return { user: request.user };
    }
  );

  // Admin-only route
  fastify.get(
    '/admin/users',
    {
      preHandler: [fastify.authenticate, fastify.requireAdmin],
    },
    async () => {
      return { users: [] };
    }
  );

  // Specific role required
  fastify.post(
    '/admin/broadcast',
    {
      preHandler: [fastify.authenticate, fastify.requireRole(UserRole.ADMIN)],
    },
    async () => {
      return { success: true };
    }
  );

  // Any of multiple roles
  fastify.get(
    '/admin/reports',
    {
      preHandler: [
        fastify.authenticate,
        fastify.requireAnyRole([UserRole.ADMIN, UserRole.OWNER]),
      ],
    },
    async () => {
      return { reports: [] };
    }
  );
}
```

---

## 5. Benefits of This Design

### 5.1 Separation of Concerns
- ✅ **Repository Layer:** Data access only
- ✅ **Service Layer:** Business logic, no framework dependencies
- ✅ **Plugin Layer:** Framework integration only

### 5.2 Testability
- ✅ **Unit Tests:** Mock repositories, test services in isolation
- ✅ **Integration Tests:** Test plugins with real services
- ✅ **E2E Tests:** Test entire flow with test containers

### 5.3 Reusability
- ✅ **Repositories:** Can be used in any service (Fastify, Express, CLI)
- ✅ **Services:** Framework-agnostic business logic
- ✅ **Plugins:** Fastify-specific, but services are reusable

### 5.4 Maintainability
- ✅ **Single Responsibility:** Each class has one job
- ✅ **Dependency Inversion:** Depend on interfaces, not implementations
- ✅ **Easy to Extend:** Add new repositories, services, or plugins independently

### 5.5 Flexibility
- ✅ **Swap Implementations:** Change from Prisma to TypeORM easily
- ✅ **Multiple Databases:** Use different repos for different data sources
- ✅ **Multiple Frameworks:** Reuse services in Express, Koa, etc.

---

## 6. Implementation Phases

### Phase 1: Repository Layer
1. Create `libs/backend/repositories` library
2. Define interfaces for User, Session, TokenBlacklist
3. Implement Prisma repositories
4. Write unit tests with mocked Prisma client

### Phase 2: Service Layer
1. Create `libs/backend/auth-service` library
2. Implement AuthService with full business logic
3. Create `libs/backend/rbac-service` library
4. Implement RBACService
5. Write comprehensive unit tests with mocked repositories

### Phase 3: Plugin Layer
1. Create `libs/backend/fastify-plugins` library
2. Implement auth plugin with decorators
3. Implement rbac plugin with decorators
4. Write integration tests

### Phase 4: Gateway Integration
1. Refactor `apps/fastify-gateway` to use new plugins
2. Remove old auth logic
3. Update routes to use new decorators
4. Run full integration tests

### Phase 5: Add Session Management Schema
1. Add `sessions` table to Prisma schema
2. Run migration
3. Update repository implementations

---

## 7. Database Schema Changes

### 7.1 New Table: `sessions`

```prisma
model Session {
  id              String    @id @default(uuid()) @db.Uuid
  userId          String    @map("user_id") @db.Uuid
  refreshToken    String    @unique @map("refresh_token")
  deviceInfo      Json      @map("device_info") @db.JsonB
  ipAddress       String    @map("ip_address")
  expiresAt       DateTime  @map("expires_at") @db.Timestamptz(6)
  lastActivityAt  DateTime  @map("last_activity_at") @db.Timestamptz(6)
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  revokedAt       DateTime? @map("revoked_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([refreshToken])
  @@index([expiresAt])
  @@map("sessions")
}
```

---

## 8. Configuration Strategy ⚠️ CRITICAL

**Decision:** All behavior is configurable via environment variables (Constitution § 10)

### 8.1 Environment Variables Required

```env
# JWT Configuration
JWT_SECRET=                           # Min 32 chars (validated)
JWT_ACCESS_EXPIRY=15m                # Access token TTL
JWT_REFRESH_EXPIRY=7d                # Refresh token TTL
JWT_ISSUER=motorghar                 # Token issuer
JWT_AUDIENCE=motorghar-client        # Token audience

# Session Configuration
SESSION_MAX_PER_USER=5               # Max concurrent sessions per user (0 = unlimited)
SESSION_TRACK_DEVICES=true           # Track device info (true/false)
SESSION_REMEMBER_ME_ENABLED=false    # Enable remember-me (future)
SESSION_REMEMBER_ME_EXPIRY=30d       # Remember-me token TTL (future)
SESSION_SLIDING_ENABLED=false        # Extend session on activity (future)
SESSION_CLEANUP_INTERVAL=3600        # Cleanup job interval (seconds)

# Security Configuration
AUTH_IP_RATE_LIMIT_ENABLED=false     # IP-based rate limiting (future)
AUTH_DETECT_SUSPICIOUS_LOGIN=false   # Anomaly detection (future)
AUTH_2FA_ENABLED=false               # Two-factor auth (future)

# Performance Configuration
RBAC_CACHE_ENABLED=false             # Cache user roles in Redis (future)
RBAC_CACHE_TTL=300                   # Role cache TTL seconds (future)
SESSION_CACHE_ENABLED=false          # Cache session validation (future)
SESSION_CACHE_TTL=60                 # Session cache TTL seconds (future)
```

### 8.2 Configuration Schema (Zod)

```typescript
// libs/shared/config/src/lib/auth.config.ts

import { z } from 'zod';
import { MIN_JWT_SECRET_LENGTH } from '@motorghar-platform/constants';

export const authConfigSchema = z.object({
  // JWT
  JWT_SECRET: z.string().min(MIN_JWT_SECRET_LENGTH),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  JWT_ISSUER: z.string().default('motorghar'),
  JWT_AUDIENCE: z.string().default('motorghar-client'),

  // Session
  SESSION_MAX_PER_USER: z.string().default('5').transform(Number),
  SESSION_TRACK_DEVICES: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
  SESSION_REMEMBER_ME_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SESSION_REMEMBER_ME_EXPIRY: z.string().default('30d'),
  SESSION_SLIDING_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SESSION_CLEANUP_INTERVAL: z.string().default('3600').transform(Number),

  // Security (future)
  AUTH_IP_RATE_LIMIT_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  AUTH_DETECT_SUSPICIOUS_LOGIN: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  AUTH_2FA_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // Performance (future)
  RBAC_CACHE_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  RBAC_CACHE_TTL: z.string().default('300').transform(Number),
  SESSION_CACHE_ENABLED: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SESSION_CACHE_TTL: z.string().default('60').transform(Number),
});

export type AuthConfig = z.infer<typeof authConfigSchema>;
```

### 8.3 Future: Admin Panel Configuration

**Phase 3+:** Move these to database-backed admin settings:
- Session limits per user
- Token expiry times
- Feature toggles (2FA, suspicious login detection)
- Cache TTLs

**Migration Path:**
1. Phase 1: Environment variables (now)
2. Phase 2: Config file support (YAML/JSON)
3. Phase 3: Admin panel UI with database storage
4. Fallback: Always default to env vars if DB config not available

### 8.4 Future Considerations (Not in MVP)

**Documented for future phases:**
- ✅ Permission-based access control (beyond roles)
- ✅ Resource-level permissions (e.g., "can edit vehicle X")
- ✅ Role hierarchies
- ✅ IP-based rate limiting per user
- ✅ Suspicious login pattern detection
- ✅ 2FA support
- ✅ Redis caching for roles/sessions
- ✅ Sliding session windows
- ✅ Remember-me functionality

---

## 9. Implementation Checklist

**Status:** ✅ Design Approved - Ready for Implementation

### Phase 1: Foundation
- [ ] Create ADR document for architecture decision
- [ ] Update `.env.example` with all new auth config vars
- [ ] Add new env vars to config schema validation
- [ ] Add Prisma migration for `sessions` table

### Phase 2: Repository Layer
- [ ] Generate `libs/backend/repositories` using Nx
- [ ] Define repository interfaces (User, Session, TokenBlacklist)
- [ ] Implement PrismaUserRepository
- [ ] Implement PrismaSessionRepository
- [ ] Implement RedisTokenBlacklistRepository
- [ ] Write unit tests for all repositories (≥80% coverage)

### Phase 3: Service Layer
- [ ] Generate `libs/backend/auth-service` using Nx
- [ ] Implement AuthService with all methods
- [ ] Implement SessionService with all methods
- [ ] Generate `libs/backend/rbac-service` using Nx
- [ ] Implement RBACService with all methods
- [ ] Write unit tests for all services (≥80% coverage)

### Phase 4: Plugin Layer
- [ ] Generate `libs/backend/fastify-plugins` using Nx
- [ ] Implement auth plugin with decorators
- [ ] Implement rbac plugin with decorators
- [ ] Write integration tests for plugins

### Phase 5: Gateway Integration
- [ ] Refactor `apps/fastify-gateway/src/app/app.ts` to use new architecture
- [ ] Initialize repositories in app bootstrap
- [ ] Initialize services with config
- [ ] Register plugins
- [ ] Remove old auth plugin code
- [ ] Update all routes to use new decorators
- [ ] Run full integration test suite

### Phase 6: Documentation & Testing
- [ ] Update API documentation
- [ ] Update README with new auth flow
- [ ] Verify all acceptance criteria met
- [ ] Run performance tests
- [ ] Update constitution if needed

---

## 10. Required Context for Implementation Agent

**When starting implementation, provide the agent with:**

1. **This design document** - `specs/design_auth_rbac_architecture.md`
2. **Constitution** - `memory/constitution.md`
3. **Zod patterns** - `memory/zod-patterns.md` (if exists)
4. **Phase 1 spec** - `specs/phase_1_admin_backend.md`
5. **Implementation phase** - Specify which phase (1-6) to implement

**Example prompt for next session:**
```
Please implement Phase 2 (Repository Layer) from the auth architecture design.

Context files:
- @specs/design_auth_rbac_architecture.md
- @memory/constitution.md
- @specs/phase_1_admin_backend.md

Requirements:
1. Follow the repository interfaces exactly as specified
2. Use Nx generators to create the library
3. Write comprehensive unit tests (≥80% coverage)
4. No hardcoded values (Constitution § 10)
5. All dependencies must be in root package.json (Constitution § 9.2)
```

---

## 11. Dependencies to Add

**Root `package.json` additions needed:**
```json
{
  "dependencies": {
    "ua-parser-js": "^1.0.37"  // For device info parsing (SESSION_TRACK_DEVICES)
  }
}
```

---

## 12. Success Criteria

**Implementation is complete when:**
- ✅ All 6 phases completed
- ✅ All unit tests passing (≥80% coverage)
- ✅ All integration tests passing
- ✅ No hardcoded values in code
- ✅ All config externalized to env vars
- ✅ TypeScript compilation successful
- ✅ Lint checks passing
- ✅ Gateway acceptance criteria met (Phase 1 spec § 1)
- ✅ Login/refresh/logout flow working end-to-end
- ✅ Session management working (list, revoke)
- ✅ RBAC decorators working on routes
- ✅ Documentation updated

---

**Design finalized and approved: October 27, 2025**
