# Phase 0: Infrastructure & Database Schema

**Status:** Not Started
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md) § 2, 5, 10
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Objectives
- Set up complete PostgreSQL schema with migrations
- Configure Docker Compose for local development
- Establish shared authentication/authorization libraries
- Configure observability foundation (logging, health checks)

---

## Deliverables

### 1. Database Schema & Migrations
**Reference:** Design Doc § 5 (Data Model)

- [ ] Prisma schema defining all tables (§ 5.1):
  - `users`, `vehicle_catalog`, `vehicles`, `service_centers`
  - `service_records`, `reminders`, `news_items`, `documents`
  - `broadcast_messages`, `audit_logs`, `addresses`, `vehicle_gallery`
- [ ] All indexes specified (§ 5.3)
- [ ] Referential integrity constraints (§ 5.3)
- [ ] Initial migration generated
- [ ] Seed data script:
  - Bootstrap admin user (`admin@motorghar.com`)
  - 50-100 popular Nepal market vehicle catalog entries
  - 20 service centers (Kathmandu Valley with coordinates)

**Acceptance Criteria:**
- Prisma migrate succeeds with no errors
- All foreign keys, indexes, and constraints present
- Seed data loads successfully
- Schema visible in pgAdmin

---

### 2. Docker Compose Setup
**Reference:** Design Doc § 10 (Deployment)

Services to configure:
- [ ] PostgreSQL 16 (with volume persistence)
- [ ] pgAdmin (UI for schema verification)
- [ ] Redis 7 (for sessions & caching)
- [ ] MinIO (with mc init for bucket creation)
- [ ] Health checks for all services

**Acceptance Criteria:**
- `docker compose up` starts all services
- Services accessible on documented ports
- pgAdmin can connect and show schema
- MinIO console accessible with buckets created

---

### 3. Shared Libraries Foundation
**Reference:** Design Doc § 6 (API Design), § 7 (Security)

Create/configure NX libraries:
- [ ] `@motorghar/shared-auth`
  - JWT token generation/validation (HS256, 15m access, 7d refresh)
  - bcrypt password hashing (cost 12)
  - RBAC guards (OWNER, ADMIN roles)
  - Token blacklist (Redis-backed)
- [ ] `@motorghar/shared-types`
  - Common TypeScript interfaces
  - Zod schemas for DTOs
  - Error code enums
- [ ] `@motorghar/shared-i18n`
  - English/Nepali key bundles
  - i18next configuration
- [ ] `@motorghar/shared-config`
  - Environment variable schema & validation
  - Shared constants (rate limits, pagination defaults)

**Acceptance Criteria:**
- All libraries build successfully (`nx build shared-*`)
- Unit tests pass for auth utilities
- Type definitions exported correctly
- NX dependency graph shows proper relationships

---

### 4. Observability Foundation
**Reference:** Design Doc § 11 (Observability)

- [ ] Pino logger configuration (JSON format, request ID injection)
- [ ] Health check endpoint scaffolding (`/healthz`)
- [ ] Prometheus metrics endpoint structure (basic latency/RPS counters)
- [ ] Database connection health check
- [ ] Redis connection health check

**Acceptance Criteria:**
- Structured JSON logs output to console
- Health endpoints return 200 when services healthy
- Request IDs propagate through log entries

---

## Task Breakdown

### T0.1: Prisma Schema Definition
- Define all tables per § 5.1
- Add all indexes per § 5.3
- Configure referential integrity
- **Test:** `npx prisma validate`

### T0.2: Initial Migration
- Generate migration: `npx prisma migrate dev --name init`
- Verify migration SQL
- **Test:** Apply to fresh DB, no errors

### T0.3: Seed Data Script
- Create `prisma/seed.ts`
- Add admin user, vehicle catalog, service centers
- **Test:** `npx prisma db seed` succeeds

### T0.4: Docker Compose Configuration
- Define all services with health checks
- Configure volumes for persistence
- Add pgAdmin service
- **Test:** `docker compose up` runs all services

### T0.5: Shared Auth Library
- Implement JWT utilities
- Implement bcrypt helpers
- Create RBAC middleware
- **Test:** Unit tests ≥80% coverage

### T0.6: Shared Types & Config
- Define common interfaces
- Create zod validation schemas
- Environment variable schema
- **Test:** Type checking passes, builds successfully

### T0.7: Shared i18n Library
- Set up react-i18next
- Create English/Nepali key structure
- Export configuration
- **Test:** Keys resolve in both languages

### T0.8: Observability Setup
- Configure Pino with request ID
- Create health check utilities
- Scaffold metrics endpoint
- **Test:** Logs output JSON, health checks respond

---

## Definition of Done
- [ ] All Docker services start and are healthy
- [ ] Database schema matches design doc § 5
- [ ] pgAdmin shows all tables, indexes, constraints
- [ ] Seed data present in database
- [ ] All shared libraries build and pass tests
- [ ] Lint and type checks pass (`nx run-many --target=lint,typecheck`)
- [ ] Documentation updated (README with setup instructions)

---

## Open Questions
- MinIO bucket naming convention finalized? - suggest one that aligns with our overall vision
- Default admin password strategy (env var vs first-run setup)? - Answer: env var
- Redis persistence mode (RDB vs AOF) for local dev? - RDB I think

---

## Estimated Effort
**3-5 days** (assuming NX workspace already configured)
