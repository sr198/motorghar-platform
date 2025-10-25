# MotorGhar MVP - Implementation Roadmap

**Version:** 1.0
**Date:** 2025-10-25
**Status:** Planning Complete, Ready for Implementation
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md)
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Overview

This roadmap breaks down the MotorGhar MVP into **5 distinct phases**, with clear dependencies, deliverables, and timelines. Phases 0-4 constitute the **MVP scope**; Phase 5 is a **post-MVP stretch goal**.

---

## Phase Breakdown

| Phase | Name                               | Duration  | Prerequisites | Status      |
| ----- | ---------------------------------- | --------- | ------------- | ----------- |
| 0     | Infrastructure & Database          | 3-5 days  | None          | Not Started |
| 1     | Admin Console - Backend & APIs     | 7-10 days | Phase 0       | Not Started |
| 2     | Admin Console - Frontend & UX      | 10-14 days| Phase 1       | Not Started |
| 3     | My Garage - Backend & APIs         | 10-14 days| Phase 0       | Not Started |
| 4     | My Garage - Frontend & UX          | 12-16 days| Phase 3       | Not Started |
| 5     | Marketplace (Stretch Goal)         | 20-30 days| Phases 0-4    | Not Started |

**Total MVP Timeline (Phases 0-4):** ~42-59 days (6-8.5 weeks)
**With Marketplace (Phase 5):** ~62-89 days (9-13 weeks)

---

## Execution Strategy

### Parallel Workstreams
- **Phase 1 and Phase 3 can run in parallel** after Phase 0 completes (if backend resources available)
- **Phase 2 and Phase 4 can run in parallel** after their respective backend phases complete (if frontend resources available)

**Optimized Timeline (with parallelization):**
- Phase 0: 3-5 days
- Phases 1 & 3 (parallel): 10-14 days
- Phases 2 & 4 (parallel): 12-16 days
- **Total MVP: ~25-35 days (3.5-5 weeks)** with 2+ developers

---

## Phase Details

### [Phase 0: Infrastructure & Database Schema](./phase_0_infrastructure.md)
**Objective:** Establish technical foundation

**Key Deliverables:**
- Complete PostgreSQL schema with Prisma
- Docker Compose for local dev (PostgreSQL, Redis, MinIO, pgAdmin)
- Shared libraries: auth, types, i18n, config
- Observability foundation (Pino logging, health checks)
- Seed data (admin user, catalog, service centers)

**Success Criteria:**
- All services start via `docker compose up`
- Schema visible in pgAdmin with all tables, indexes, constraints
- Shared libraries build and pass tests
- Seed data loaded successfully

**Estimated Effort:** 3-5 days

---

### [Phase 1: Admin Console - Backend & APIs](./phase_1_admin_backend.md)
**Objective:** Build complete admin backend

**Key Deliverables:**
- Fastify API Gateway (auth, rate limiting, validation)
- Admin authentication & user management APIs
- Vehicle catalog management CRUD
- Service center management CRUD (with geocoding)
- News/events/recalls management CRUD
- Video management (per catalog vehicle)
- Admin dashboard KPIs
- Audit logging
- OpenAPI documentation

**Success Criteria:**
- All endpoints tested (unit + integration ≥80%)
- OpenAPI spec generated
- Performance targets met (P50 <200ms hot reads)
- Audit logging functional

**Estimated Effort:** 7-10 days

---

### [Phase 2: Admin Console - Frontend & UX](./phase_2_admin_frontend.md)
**Objective:** Build complete admin console UI

**Key Deliverables:**
- React app with TanStack Router/Query
- Authentication & session management
- Dashboard with KPIs
- User management UI
- Vehicle catalog management UI (with thumbnail upload)
- Service center management UI (with map integration)
- News/events/recalls management UI (with rich text editor)
- Video management UI
- Audit logs viewer
- Shared UI component library
- Bilingual support (English/Nepali)

**Success Criteria:**
- All E2E tests pass (Playwright)
- Accessibility audit passed (keyboard nav, WCAG AA)
- Responsive at 360px, 768px, 1280px
- Performance <2s initial load

**Estimated Effort:** 10-14 days

---

### [Phase 3: My Garage - Backend & APIs](./phase_3_garage_backend.md)
**Objective:** Build complete owner-facing backend

**Key Deliverables:**
- Owner authentication & registration
- Vehicle CRUD (user garage)
- Service history tracking CRUD
- Reminders CRUD + scheduler (hourly cron)
- Document vault (MinIO presigned URLs)
- Vehicle image gallery CRUD
- Service center discovery (geospatial search)
- Service scheduling (appointments)
- News filtering (by vehicle)
- Vehicle notes CRUD
- OpenAPI documentation

**Success Criteria:**
- All endpoints tested (unit + integration ≥80%)
- Reminder scheduler functional and tested
- MinIO integration working (presigned URLs)
- Performance targets met (P50 <150ms vehicle list)

**Estimated Effort:** 10-14 days

---

### [Phase 4: My Garage - Frontend & UX](./phase_4_garage_frontend.md)
**Objective:** Build complete owner portal UI

**Key Deliverables:**
- React app for garage portal
- Registration & login flows
- Profile management
- My Garage dashboard (vehicle grid with thumbnails)
- Add/edit vehicle forms (with catalog search)
- Vehicle details view (tabs: overview, gallery, documents, service, reminders, news)
- Image gallery (upload, carousel, mark primary)
- Document vault UI (upload/download)
- Service history timeline
- Reminders management
- Service center discovery (list + map)
- Service scheduling UI
- News feed (vehicle-specific + global)
- Vehicle notes UI
- Bilingual support

**Success Criteria:**
- All E2E tests pass (Playwright)
- Accessibility audit passed
- Responsive at 360px, 768px, 1280px
- Performance <2s initial load
- Mobile-first UX verified

**Estimated Effort:** 12-16 days

---

### [Phase 5: Marketplace (Stretch Goal)](./phase_5_marketplace.md)
**Objective:** Enable vehicle marketplace (post-MVP)

**Key Deliverables:**
- Marketplace listings backend (create, publish, search)
- Buyer-seller messaging system
- Inspection workflow (optional)
- Buyer portal frontend
- Seller workflows (integrated into garage portal)
- Advanced search & filtering
- Map view for listings

**Success Criteria:**
- All marketplace flows tested (E2E)
- Search performant (P50 <300ms)
- Anti-fraud measures in place
- Security review passed

**Estimated Effort:** 20-30 days

**Note:** Out of scope for MVP per Design Doc § 1.2

---

## Development Workflow

### Per-Phase Process
1. **Kickoff:** Review phase spec, clarify open questions
2. **Design:** Finalize schema changes (if any), API contracts
3. **Implementation:** Follow test-first approach (Constitution § 1)
   - Write/update tests before implementation
   - Maintain ≥80% coverage for core modules
4. **Code Review:** Peer review with focus on SOLID, security, performance
5. **Testing:** Unit → Integration → E2E (where applicable)
6. **Documentation:** Update README, API docs, ADRs (if needed)
7. **Demo:** Show working features to stakeholders
8. **Retrospective:** Capture learnings, update process

### Daily Workflow
- **Morning standup:** Progress, blockers, plan
- **Focus time:** Implementation + testing
- **End-of-day:** Commit progress, update todo lists, sync with team

---

## Quality Gates (Per Phase)

Before moving to next phase, ensure:
- [ ] All acceptance criteria met
- [ ] Tests pass (unit, integration, E2E as specified)
- [ ] Lint and type checks pass (`nx run-many --target=lint,typecheck`)
- [ ] Performance targets met (measured in staging)
- [ ] Security review passed (if applicable)
- [ ] Documentation updated
- [ ] Definition of Done checklist complete

---

## Risk Management

### Identified Risks

| Risk                                    | Impact | Mitigation                                              |
| --------------------------------------- | ------ | ------------------------------------------------------- |
| Schema changes mid-development          | High   | Lock schema in Phase 0; require ADR for changes         |
| Maps API quota exceeded                 | Medium | Implement aggressive caching; fallback to OSM           |
| Third-party dependencies (MinIO, Redis) | Medium | Use test containers; document fallback strategies       |
| Performance targets not met             | High   | Profile early; add indexes; optimize queries iteratively |
| Scope creep (features beyond MVP)       | High   | Strict adherence to PRD § 1.2 (Non-Goals); defer to backlog |
| Bilingual UX complexity                 | Low    | Centralize i18n in shared library; test both languages  |

---

## Success Metrics (MVP)

### Technical Metrics
- **Code Coverage:** ≥80% for core services
- **Performance (P50):**
  - Hot reads: <200ms
  - Page loads: <2s
  - Mutations: <500ms (P95)
- **Uptime:** 99% (staging)
- **Security:** No critical/high vulnerabilities (Snyk/npm audit)

### Product Metrics (Post-Launch)
- **User Registrations:** 100 users in first month (beta)
- **Vehicles Added:** 200+ vehicles
- **Service Records Logged:** 50+ records
- **Active Reminders:** 100+ reminders set
- **News Engagement:** 500+ news views

---

## Open Questions (To Resolve in Phase 0)

1. **Maps API Provider:** Google Maps vs Mapbox vs Leaflet + OSM?
2. **Email/SMS Provider:** Which provider for Nepal deliverability?
3. **Rich Text Editor:** TipTap vs Quill vs Lexical?
4. **Default Admin Password:** Env var vs first-run setup wizard?
5. **Redis Persistence:** RDB vs AOF for local dev?
6. **Video Thumbnails:** Mirror to MinIO or hotlink from YouTube/Vimeo?
7. **Search Strategy:** PostgreSQL pg_trgm vs Elasticsearch for Phase 5?

**Action:** Schedule decision-making session before Phase 0 kickoff

---

## Rollout Plan (Post-Phase 4)

### Alpha (Internal Testing)
- **Audience:** MotorGhar team (5-10 users)
- **Duration:** 1 week
- **Focus:** Validate CRUD flows, measure performance, catch critical bugs
- **Success Criteria:** All critical flows work; no showstopper bugs

### Beta (Closed)
- **Audience:** 50-100 invited vehicle owners
- **Duration:** 2-4 weeks
- **Focus:** Real-world usage, feedback on UX, reminder delivery, maps integration
- **Success Criteria:** Positive feedback; <5% critical bug rate; 80%+ feature adoption

### MVP Launch (Open Beta)
- **Audience:** Public (Nepal market)
- **Duration:** Ongoing
- **Focus:** User acquisition, SEO for news pages, expand catalog/service centers
- **Success Criteria:** 100+ registrations in first month; stable performance; user retention >60%

---

## Resource Requirements

### Development Team (Recommended)
- **Backend Developer(s):** 1-2 (Phases 1, 3)
- **Frontend Developer(s):** 1-2 (Phases 2, 4)
- **Full-Stack Developer(s):** 1+ (can work across phases)
- **DevOps/Infrastructure:** 0.5 FTE (Phase 0, CI/CD setup)
- **QA/Testing:** 0.5 FTE (E2E tests, manual testing during beta)
- **Product/Design:** 0.5 FTE (UX review, feedback incorporation)

### Infrastructure
- **Local Dev:** Docker Compose (all developers)
- **Staging:** 1 VPS or cloud instance (2-4 GB RAM, 2 vCPU)
- **Production (MVP):** 1-2 instances (4-8 GB RAM, 2-4 vCPU)
- **Database:** PostgreSQL (managed service or self-hosted with backups)
- **Cache:** Redis (managed service or self-hosted)
- **Storage:** MinIO (self-hosted) or S3-compatible cloud storage
- **Monitoring:** Basic (Prometheus + Grafana or cloud provider dashboards)

---

## Next Steps

1. **Review this roadmap** with stakeholders
2. **Resolve open questions** (see Open Questions section)
3. **Assign team members** to phases
4. **Set up project management** (Jira, GitHub Projects, or similar)
5. **Kickoff Phase 0** with detailed task breakdown
6. **Establish communication cadence** (standups, demos, retros)

---

## References

- [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md)
- [Project Constitution](./motor_ghar_constitution.md)
- [UX Specs](./ux_specs.md)
- [Phase 0: Infrastructure](./phase_0_infrastructure.md)
- [Phase 1: Admin Backend](./phase_1_admin_backend.md)
- [Phase 2: Admin Frontend](./phase_2_admin_frontend.md)
- [Phase 3: Garage Backend](./phase_3_garage_backend.md)
- [Phase 4: Garage Frontend](./phase_4_garage_frontend.md)
- [Phase 5: Marketplace](./phase_5_marketplace.md)

---

**Document Status:** ✅ Ready for Review
**Last Updated:** 2025-10-25
