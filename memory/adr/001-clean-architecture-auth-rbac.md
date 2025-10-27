# ADR 001: Clean Architecture for Authentication & RBAC

**Status:** Accepted
**Date:** October 27, 2025
**Authors:** @srijan, AI Agent
**Related:** `specs/design_auth_rbac_architecture.md`, `specs/phase_1_admin_backend.md`

---

## Context

We need to implement a production-ready authentication and role-based access control (RBAC) system for the MotorGhar platform. The system must be:

1. **Reusable** - Work across all Fastify microservices in the monorepo
2. **Testable** - Each layer independently unit testable with high coverage (≥80%)
3. **Maintainable** - Clear separation of concerns, easy to understand and extend
4. **Configurable** - All behavior controlled via environment variables (Constitution § 10)
5. **Secure** - Follow security best practices (Constitution § 4)
6. **Future-proof** - Support future features (2FA, suspicious login detection, caching)

### Current State (Phase 0)

- Basic JWT authentication in `libs/backend/auth`
- JWT utils, password utils, session utils scattered
- No repository pattern - direct Prisma calls in services
- No session management
- No multi-device support
- Hardcoded values in code
- No structured RBAC system

### Problems with Current Approach

1. **Tight Coupling**: Services directly depend on Prisma, making testing difficult
2. **Poor Testability**: Cannot mock data layer easily
3. **Limited Reusability**: Auth logic tied to specific implementation
4. **No Session Management**: No refresh token rotation, device tracking, or session revocation
5. **Hardcoded Values**: Violates Constitution § 10
6. **Framework Lock-in**: Mixing Fastify concerns with business logic

---

## Decision

We will implement a **Clean Architecture** approach with three distinct layers:

### Layer 1: Repository Layer (`libs/backend/repositories`)
- **Purpose:** Abstract data access
- **Responsibilities:** CRUD operations, database queries
- **Dependencies:** Prisma/TypeORM, Redis
- **Pattern:** Interface-based repository pattern
- **Testing:** Mock Prisma client

**Interfaces:**
- `IUserRepository` - User data access
- `ISessionRepository` - Session persistence
- `ITokenBlacklistRepository` - Token revocation

**Implementations:**
- `PrismaUserRepository`
- `PrismaSessionRepository`
- `RedisTokenBlacklistRepository`

### Layer 2: Service Layer (`libs/backend/auth-service`, `libs/backend/rbac-service`)
- **Purpose:** Business logic and orchestration
- **Responsibilities:** Authentication flows, session management, RBAC checks
- **Dependencies:** Repository interfaces only (dependency inversion)
- **Pattern:** Service pattern with dependency injection
- **Testing:** Mock repository interfaces

**Services:**
- `AuthService` - Login, logout, token refresh, verification
- `SessionService` - Session creation, validation, revocation
- `RBACService` - Role checking, permission validation

### Layer 3: Plugin Layer (`libs/backend/fastify-plugins`)
- **Purpose:** Framework integration
- **Responsibilities:** HTTP request/response handling, Fastify decorators
- **Dependencies:** Services, Fastify types
- **Pattern:** Fastify plugin pattern
- **Testing:** Integration tests with real services

**Plugins:**
- `authPlugin` - Provides `authenticate` and `optionalAuth` decorators
- `rbacPlugin` - Provides `requireRole`, `requireAnyRole`, `requireAdmin` decorators

---

## Rationale

### Why Clean Architecture?

1. **Testability**: Each layer can be tested independently
   - Repositories: Mock Prisma
   - Services: Mock repositories
   - Plugins: Integration tests with real services

2. **Flexibility**: Easy to swap implementations
   - Switch from Prisma to TypeORM by implementing new repositories
   - Reuse services in Express, Koa, or CLI tools
   - Add new storage backends (MongoDB, DynamoDB) without touching services

3. **Maintainability**: Single Responsibility Principle
   - Repositories know about data
   - Services know about business rules
   - Plugins know about HTTP/Fastify

4. **Separation of Concerns**: Clear boundaries
   - No Fastify types in services
   - No business logic in repositories
   - No database queries in plugins

### Why Repository Pattern?

1. **Abstraction**: Hide database implementation details
2. **Testing**: Easy to create mock repositories
3. **Flexibility**: Swap databases without changing business logic
4. **Consistency**: Standard interface for data access
5. **Query Optimization**: Centralized place for database tuning

### Why Service Layer?

1. **Business Logic Centralization**: All auth rules in one place
2. **Reusability**: Use across any framework or CLI
3. **Transaction Management**: Handle multi-step operations
4. **Validation**: Enforce business rules before data access
5. **Orchestration**: Coordinate multiple repositories

### Why Fastify Plugins?

1. **Framework Integration**: Proper Fastify lifecycle management
2. **Dependency Injection**: Register services at app start
3. **Decorator Pattern**: Clean route handler syntax
4. **Plugin Ecosystem**: Compatible with other Fastify plugins
5. **Error Handling**: Fastify error handling conventions

---

## Configuration Strategy

All behavior is configurable via environment variables (Constitution § 10):

### JWT Configuration
- `JWT_SECRET` - Signing key (min 32 chars, validated)
- `JWT_ACCESS_EXPIRY` - Access token TTL (default: 15m)
- `JWT_REFRESH_EXPIRY` - Refresh token TTL (default: 7d)
- `JWT_ISSUER` - Token issuer (default: motorghar)
- `JWT_AUDIENCE` - Token audience (default: motorghar-client)

### Session Configuration
- `SESSION_MAX_PER_USER` - Max concurrent sessions (default: 5, 0=unlimited)
- `SESSION_TRACK_DEVICES` - Track device info (default: true)
- `SESSION_CLEANUP_INTERVAL` - Cleanup job interval in seconds (default: 3600)

### Future Features (toggles)
- `SESSION_REMEMBER_ME_ENABLED` - Remember-me tokens (default: false)
- `SESSION_SLIDING_ENABLED` - Extend session on activity (default: false)
- `AUTH_2FA_ENABLED` - Two-factor authentication (default: false)
- `AUTH_DETECT_SUSPICIOUS_LOGIN` - Anomaly detection (default: false)
- `RBAC_CACHE_ENABLED` - Cache roles in Redis (default: false)

**Migration Path:**
1. Phase 1: Environment variables (now)
2. Phase 2: Config file support (YAML/JSON)
3. Phase 3: Admin panel UI with database storage
4. Fallback: Always default to env vars if DB config not available

---

## Implementation Phases

### Phase 1: Foundation
- Create ADR (this document)
- Update `.env.example` with all auth config vars
- Add config schema validation with Zod
- Add Prisma migration for `sessions` table

### Phase 2: Repository Layer
- Generate `libs/backend/repositories` using Nx
- Define repository interfaces
- Implement Prisma repositories
- Write unit tests (≥80% coverage)

### Phase 3: Service Layer
- Generate `libs/backend/auth-service` using Nx
- Implement AuthService and SessionService
- Generate `libs/backend/rbac-service` using Nx
- Implement RBACService
- Write unit tests (≥80% coverage)

### Phase 4: Plugin Layer
- Generate `libs/backend/fastify-plugins` using Nx
- Implement auth and rbac plugins
- Write integration tests

### Phase 5: Gateway Integration
- Refactor `apps/fastify-gateway` to use new architecture
- Remove old auth code
- Update all routes to use new decorators
- Run full integration tests

### Phase 6: Documentation & Testing
- Update API documentation
- Update README
- Verify acceptance criteria
- Performance testing

---

## Consequences

### Positive

✅ **High Testability**: Mock any layer independently
✅ **Framework Agnostic**: Reuse services in any Node.js app
✅ **Easy to Extend**: Add new repositories or services without breaking existing code
✅ **Clear Boundaries**: Each layer has single responsibility
✅ **Type Safety**: Full TypeScript support across layers
✅ **Configuration Driven**: All behavior externalized (Constitution § 10)
✅ **Future-Proof**: Toggle features via environment variables

### Negative

⚠️ **More Files**: More abstractions means more files to maintain
⚠️ **Initial Complexity**: Steeper learning curve for new developers
⚠️ **Boilerplate**: Repository interfaces require implementation code
⚠️ **Over-Engineering Risk**: Simple CRUD might not need this complexity

### Mitigations

- **Documentation**: Comprehensive docs and examples
- **Generators**: Nx generators to scaffold new repositories/services
- **Templates**: Standardized patterns for common operations
- **Training**: Onboarding docs for new team members

---

## Alternatives Considered

### Alternative 1: Direct Prisma Usage in Services
**Pros:** Simpler, fewer abstractions
**Cons:** Tight coupling, hard to test, hard to swap databases
**Why Rejected:** Violates testability and flexibility requirements

### Alternative 2: Active Record Pattern
**Pros:** Less boilerplate, ORM handles everything
**Cons:** Business logic mixed with data layer, hard to test
**Why Rejected:** Poor separation of concerns

### Alternative 3: CQRS + Event Sourcing
**Pros:** Highly scalable, audit trail built-in
**Cons:** Over-engineering for current needs, high complexity
**Why Rejected:** Too complex for MVP, can add later if needed

### Alternative 4: Monolithic Auth Library
**Pros:** All-in-one package, simple to use
**Cons:** Framework lock-in, hard to customize
**Why Rejected:** Need full control and customization

---

## References

- [Clean Architecture (Robert C. Martin)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Repository Pattern (Martin Fowler)](https://martinfowler.com/eaaCatalog/repository.html)
- [Fastify Plugin Guide](https://fastify.dev/docs/latest/Reference/Plugins/)
- Constitution § 10 (Configuration & Hardcoding Rules)
- Constitution § 4 (Security & Data)
- Constitution § 2 (Code Quality - SOLID)

---

## Success Criteria

Implementation is complete when:

- ✅ All 6 phases completed
- ✅ All unit tests passing (≥80% coverage)
- ✅ All integration tests passing
- ✅ No hardcoded values in code
- ✅ All config externalized to env vars
- ✅ TypeScript compilation successful
- ✅ Lint checks passing
- ✅ Login/refresh/logout flow working end-to-end
- ✅ Session management working (list, revoke)
- ✅ RBAC decorators working on routes
- ✅ Documentation updated

---

**Decision finalized and approved: October 27, 2025**
