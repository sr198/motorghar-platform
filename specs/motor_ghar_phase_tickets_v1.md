# MotorGhar Phase Execution Tickets (v1)

Each ticket is self-contained so it can be scheduled independently. Reference the cited specs for deeper context and update task tracking with outcomes, test evidence, and follow-up items.

---

## Ticket: Phase 0 – Platform Foundation Bootstrap

**Purpose**  
Establish a production-ready Nx monorepo baseline with tooling, CI scaffolding, and local infrastructure needed by later phases. Aligns with architecture and delivery principles in `specs/motor_ghar_mvp_solution_design_v_1.md:24` and `specs/motor_ghar_constitution.md:6`.

### Scope
- Harden Nx workspace configuration (`pnpm`, linting, formatting, tsconfig) per `specs/motor_ghar_mvp_solution_design_v_1.md:24`.
- Create Docker Compose stack for Postgres, Redis, MinIO, and supporting services `specs/motor_ghar_mvp_solution_design_v_1.md:200`.
- Wire baseline observability/logging hooks and health checks `specs/motor_ghar_mvp_solution_design_v_1.md:209`.
- Seed CI pipeline templates (GitHub/GitLab) with cache/migration steps `specs/motor_ghar_mvp_solution_design_v_1.md:217`.

### Setup & Prerequisites
- Install Node 20.x and `pnpm`.
- Copy `.env.example` → `.env` with local credentials for DB, Redis, MinIO if provided.
- Ensure Docker Desktop (or equivalent) is running.

### Tasks
1. Configure `pnpm` workspace scripts, shared `tsconfig`, lint/format rules, commit hooks.
2. Author Docker Compose files and helper scripts to start/stop local stack.
3. Implement Fastify gateway + backend health endpoints (`/healthz`) returning system status.
4. Introduce logging baseline (pino JSON) and metrics placeholders.
5. Add CI pipeline definitions covering install, lint, unit tests, and Docker image build scaffolds.
6. Document local startup (`pnpm install`, `pnpm nx graph`, `docker compose up`).

### Automated Tests
- `pnpm nx lint --all`
- `pnpm nx test --all`
- Smoke scripts for health endpoints (e.g., `pnpm nx run backend:e2e-smoke` if scaffolded).

### Manual QA
- Start Docker stack; verify Postgres/Redis/MinIO reachable.
- Hit gateway `/healthz` and backend `/healthz` manually (curl or browser) to confirm readiness.
- Launch frontend dev servers to confirm HMR works.

### Acceptance Criteria
- Repo installs cleanly and tooling commands succeed.
- Local infrastructure and services run via documented commands.
- CI pipeline definition exists with passing dry run.
- Observability/logging scaffolds emit baseline entries.

### References
- `specs/motor_ghar_mvp_solution_design_v_1.md:24`
- `specs/motor_ghar_mvp_solution_design_v_1.md:200`
- `specs/motor_ghar_mvp_solution_design_v_1.md:209`
- `specs/motor_ghar_constitution.md:6`

---

## Ticket: Phase 1 – Identity & Access Foundation

**Purpose**  
Deliver authentication, profile management, RBAC, and bilingual UI shell per `specs/motor_ghar_prd_v1.md:56` and backend design in `specs/motor_ghar_mvp_solution_design_v_1.md:11`.

### Scope
- Implement Auth & Profile modules (register, login, refresh, logout, profile CRUD) with JWT + refresh tokens `specs/motor_ghar_mvp_solution_design_v_1.md:31`.
- Apply Prisma migrations for `users` schema `specs/motor_ghar_mvp_solution_design_v_1.md:79`.
- Scaffold shared i18n package and string catalogs `specs/motor_ghar_mvp_solution_design_v_1.md:34`.
- Build owner/admin React shells with login/registration, profile, language toggle `specs/motor_ghar_prd_v1.md:56`.

### Setup & Prerequisites
- Phase 0 ticket completed.
- `.env` includes `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, and i18n defaults.

### Tasks
1. Create Prisma models and migrate `users` table with role enum.
2. Implement Fastify routes for auth, profile, and refresh tokens (HS256, 15m/7d expiries).
3. Add RBAC guards for OWNER and ADMIN roles with integration tests.
4. Build shared i18n library (`@motorghar/i18n`) and load translations in both apps.
5. Implement login, registration, profile pages, and persistence of language preference.
6. Seed default admin user via script.
7. Update OpenAPI spec snapshots and contract tests.

### Automated Tests
- Unit: `pnpm nx test auth-service`
- Integration: `pnpm nx run backend:integration --target=auth` (testcontainers hitting Postgres/Redis)
- Playwright (auth flow): `pnpm nx e2e buyer-portal-auth`
- Contract snapshot diff for auth endpoints.

### Manual QA
- Register new owner; verify duplicate email blocked.
- Login/logout flows; refresh token rotation.
- Profile update and localization toggle persist across sessions.
- Verify admin-only routes reject OWNER role.

### Acceptance Criteria
- Auth/Profile endpoints implemented with validation and RBAC.
- Both frontends support bilingual auth flows.
- Automated tests green; contract snapshots updated.
- Manual QA sign-off recorded.

### References
- `specs/motor_ghar_prd_v1.md:56`
- `specs/motor_ghar_mvp_solution_design_v_1.md:11`
- `specs/motor_ghar_mvp_solution_design_v_1.md:31`
- `specs/motor_ghar_mvp_solution_design_v_1.md:79`

---

## Ticket: Phase 2 – Garage Core Data Enablement

**Purpose**  
Deliver vehicle catalog seeding, owner vehicle management, and garage overview experiences per `specs/motor_ghar_prd_v1.md:70` and data design in `specs/motor_ghar_mvp_solution_design_v_1.md:38`.

### Scope
- Seed initial catalog of makes/models/years `specs/motor_ghar_mvp_solution_design_v_1.md:225`.
- Implement vehicle CRUD APIs with duplicate registration validation and caching `specs/motor_ghar_mvp_solution_design_v_1.md:38`.
- Build owner garage list/detail UI including notes and metadata `specs/motor_ghar_prd_v1.md:70`.
- Enforce keyset pagination and baseline performance metrics.

### Setup & Prerequisites
- Phase 1 ticket completed.
- Vehicle catalog seed data prepared (CSV/JSON) and accessible.

### Tasks
1. Extend Prisma schema for vehicle catalog, vehicles, notes; run migrations.
2. Implement catalog seed script and verify idempotency.
3. Create vehicle CRUD endpoints with validation (make/model/year/trim, registration uniqueness).
4. Add Redis read-through cache with write-invalidate hooks for vehicle lists/details.
5. Implement owner UI for garage overview, detail view, and notes.
6. Update zod DTOs and OpenAPI definitions.
7. Add monitoring for vehicle list latency (Prometheus counters/histograms).

### Automated Tests
- Unit: `pnpm nx test vehicle-service`
- Integration: `pnpm nx run backend:integration --target=vehicle`
- Playwright: `pnpm nx e2e buyer-portal-garage`
- Contract diff for vehicle endpoints.

### Manual QA
- Add multiple vehicles; attempt duplicate registration number.
- Validate pagination cursor behavior with >20 vehicles.
- Confirm note CRUD and localization across languages.
- Observe latency metrics on dashboard for hot reads.

### Acceptance Criteria
- Vehicle catalog seeded; CRUD operations functional and cached.
- Owner UI shows garage data accurately with notes.
- Tests and contracts green; metrics available.
- Manual QA checklist signed.

### References
- `specs/motor_ghar_prd_v1.md:70`
- `specs/motor_ghar_prd_v1.md:97`
- `specs/motor_ghar_mvp_solution_design_v_1.md:38`
- `specs/motor_ghar_mvp_solution_design_v_1.md:225`

---

## Ticket: Phase 3 – Lifecycle Operations & Content

**Purpose**  
Enable service scheduling/history, reminders, and document management per `specs/motor_ghar_prd_v1.md:74` and MinIO/reminder design in `specs/motor_ghar_mvp_solution_design_v_1.md:184` and `specs/motor_ghar_mvp_solution_design_v_1.md:271`.

### Scope
- Implement service record APIs, scheduling UI, and reminder scheduler cron.
- Integrate email/SMS providers for reminder notifications.
- Deliver document vault with MinIO presigned uploads, validation, and gallery fallback chain.
- Expose lifecycle views in owner portal.

### Setup & Prerequisites
- Phase 2 ticket completed.
- Email/SMS sandbox credentials available.
- MinIO buckets created with credentials in `.env`.

### Tasks
1. Extend Prisma schema for service records, reminders, documents, gallery.
2. Implement service scheduling endpoints with calendar semantics and idempotency keys.
3. Build reminder scheduler worker (cron) with delivery logging and status transitions.
4. Integrate email/SMS provider clients (stub or sandbox).
5. Implement document upload presign/finalize APIs; enforce MIME/size checks and store metadata.
6. Build owner UI for service calendar, history timeline, reminder management, and document gallery.
7. Update observability (metrics for reminders sent, upload counts) and auditing.

### Automated Tests
- Unit: `pnpm nx test service-service` and `pnpm nx test reminder-service`
- Integration: `pnpm nx run backend:integration --target=service` (includes MinIO mock)
- Playwright: `pnpm nx e2e buyer-portal-lifecycle`
- Contract diffs for service, reminder, document endpoints.

### Manual QA
- Schedule service, edit, cancel; verify reminders fire (check sandbox mail/SMS).
- Upload supported file types; ensure invalid MIME/size rejected.
- Verify reminder snooze/dismiss flows reflect in DB.
- Check gallery fallback chain (user image → default image → placeholder).

### Acceptance Criteria
- Service scheduling, history, reminders, and document flows operational.
- Notifications dispatched and logged with retry handling.
- Automated suites green; uploads secured and validated.
- Manual QA evidence captured.

### References
- `specs/motor_ghar_prd_v1.md:74`
- `specs/motor_ghar_prd_v1.md:76`
- `specs/motor_ghar_mvp_solution_design_v_1.md:184`
- `specs/motor_ghar_mvp_solution_design_v_1.md:271`

---

## Ticket: Phase 4 – Discovery & Admin Console Readiness

**Purpose**  
Deliver discovery features (service centers, news/recalls) and full admin console per `specs/motor_ghar_prd_v1.md:75` and frontend guidance in `specs/motor_ghar_mvp_solution_design_v_1.md:191`.

### Scope
- Implement service center management with geocoding, caching, and discovery UI.
- Build news/recall ingestion, admin CRUD, and owner presentation.
- Construct admin dashboard (KPIs, catalog, users, audit logs) `specs/motor_ghar_prd_v1.md:84`.
- Introduce audit logging across admin mutations `specs/motor_ghar_prd_v1.md:93`.

### Setup & Prerequisites
- Phase 3 ticket completed.
- Maps provider keys configured; Redis TTL settings defined.
- News content source format agreed (manual entry or CSV).

### Tasks
1. Extend schema for service centers, addresses, news, audit logs.
2. Integrate geocoding service with Redis caching and fallback logic `specs/motor_ghar_mvp_solution_design_v_1.md:140`.
3. Build owner discovery UI (map/list, save center) with accessibility compliance.
4. Implement admin console sections: dashboard KPIs, user management, catalog CRUD, service center CRUD, news editor.
5. Add audit log persistence and admin-facing views.
6. Update internationalization coverage for admin flows.
7. Refresh OpenAPI specs and contract tests for new endpoints.

### Automated Tests
- Unit: `pnpm nx test service-center-service`, `pnpm nx test news-service`, admin UI component tests.
- Integration: `pnpm nx run backend:integration --target=discovery`.
- Playwright: `pnpm nx e2e admin-console-core`, `pnpm nx e2e buyer-portal-discovery`.
- Contract diffs for discovery/admin endpoints.

### Manual QA
- Add/edit service centers; validate map markers and cached results.
- Publish news/recall and confirm owner portal filtering by make/model/year.
- Verify audit logs for every admin mutation.
- Test localization toggles within admin console.

### Acceptance Criteria
- Discovery and admin features meet PRD acceptance criteria.
- Geocoding caches and fallbacks work; audit logging comprehensive.
- Automated suites pass; manual QA evidence logged.

### References
- `specs/motor_ghar_prd_v1.md:75`
- `specs/motor_ghar_prd_v1.md:84`
- `specs/motor_ghar_mvp_solution_design_v_1.md:140`
- `specs/motor_ghar_mvp_solution_design_v_1.md:191`

---

## Ticket: Phase 5 – Hardening, Launch & Rollout

**Purpose**  
Finalize observability, backups, E2E coverage, and release procedures to move from beta to public MVP per `specs/motor_ghar_prd_v1.md:165` and `specs/motor_ghar_mvp_solution_design_v_1.md:232`.

### Scope
- Implement Prometheus metrics endpoints, dashboards, and alerting `specs/motor_ghar_mvp_solution_design_v_1.md:209`.
- Configure backup routines for Postgres and MinIO `specs/motor_ghar_mvp_solution_design_v_1.md:205`.
- Harden rate limiting, security review, and logging per constitution `specs/motor_ghar_constitution.md:26`.
- Complete E2E regression suite and rollout playbook.

### Setup & Prerequisites
- Phases 0–4 tickets completed.
- Access to staging/prod infrastructure (or simulated environment) with secrets provisioned.

### Tasks
1. Enable Prometheus metrics, dashboards (Grafana), and alert rules for latency/error SLOs.
2. Configure nightly DB dumps, MinIO versioning, and restoration drill.
3. Audit RBAC, rate limits, secrets management; fix gaps.
4. Expand Playwright suite to cover full owner/admin flows; add load test scripts if budgeted.
5. Prepare rollout checklist (alpha → beta → MVP) with gating metrics and rollback plan `specs/motor_ghar_mvp_solution_design_v_1.md:232`.
6. Update documentation (runbooks, incident response, QA scripts).
7. Conduct security/privacy review and record approvals.

### Automated Tests
- `pnpm nx run-many --target=test --all`
- `pnpm nx run-many --target=lint --all`
- `pnpm nx run-many --target=e2e --all`
- Contract snapshots regenerated and diffed.
- Optional load testing script (k6/Artillery) executed against staging.

### Manual QA
- Validate dashboards show live metrics; simulate failure to test alerts.
- Execute backup restore test in isolated environment.
- Run full manual walkthrough of owner and admin critical journeys.
- Conduct release dry run using rollout checklist.

### Acceptance Criteria
- Observability, backups, and security controls meet Definition of Done.
- Full automated and manual regression suites completed with sign-off.
- Rollout checklist approved; alpha/beta gates satisfied.
- Documentation updated for operations and support.

### References
- `specs/motor_ghar_prd_v1.md:165`
- `specs/motor_ghar_mvp_solution_design_v_1.md:205`
- `specs/motor_ghar_mvp_solution_design_v_1.md:209`
- `specs/motor_ghar_mvp_solution_design_v_1.md:232`
- `specs/motor_ghar_constitution.md:19`

