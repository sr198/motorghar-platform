# Phase 1: Admin Console - Backend & APIs

**Status:** Not Started
**Prerequisites:** Phase 0 complete
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md) § 3.3, 6
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Objectives
- Implement all Admin Console backend services
- Build complete REST API for admin operations
- Establish API Gateway with authentication & rate limiting
- Enable admin KPI dashboard data

---

## Deliverables

### 1. API Gateway Setup
**Reference:** Design Doc § 2, 6 (Architecture, API Design)

- [ ] Fastify API Gateway application (`apps/api-gateway`)
- [ ] JWT authentication middleware (using `@motorghar-platform/auth`)
- [ ] RBAC enforcement (ADMIN role required)
- [ ] Request validation (zod schemas)
- [ ] Rate limiting (300 req/min per JWT)
- [ ] CORS configuration (env-based allowlist)
- [ ] Response compression (br/gzip)
- [ ] Request logging with pino & request ID
- [ ] Health check endpoint `/healthz`

**Acceptance Criteria:**
- Gateway proxies requests to backend services
- Unauthorized requests return 401
- Non-admin requests to `/admin/*` return 403
- Rate limits enforced and return 429
- All requests logged with structured JSON

---

### 2. Admin Authentication & User Management
**Reference:** Design Doc § 3.1, 3.3

**Endpoints:**
- [ ] `POST /auth/login` - Admin login (email/password → JWT)
- [ ] `POST /auth/refresh` - Token refresh
- [ ] `POST /auth/logout` - Invalidate tokens (blacklist)
- [ ] `GET /admin/users` - List all users (paginated, filterable by role/status)
- [ ] `GET /admin/users/:id` - Get user details
- [ ] `PUT /admin/users/:id/status` - Activate/deactivate user
- [ ] `GET /admin/users/:id/vehicles` - List user's vehicles

**Service Layer:**
- [ ] `UserService` (CRUD, search, status management)
- [ ] Password validation & hashing
- [ ] Session management with Redis

**Acceptance Criteria:**
- Admin can log in and receive valid JWT
- Token refresh works and rotates tokens
- Logout blacklists tokens in Redis
- User list supports keyset pagination (§ 6)
- Filters work (role, last login, status)
- Integration tests cover all endpoints

---

### 3. Vehicle Catalog Management
**Reference:** Design Doc § 3.3, 5.1 (vehicle_catalog table)

**Endpoints:**
- [ ] `GET /admin/catalog/makes` - List all makes
- [ ] `GET /admin/catalog/makes/:make/models` - Models by make
- [ ] `GET /admin/catalog/vehicles` - Full catalog search (paginated)
- [ ] `POST /admin/catalog/vehicles` - Add new catalog entry
- [ ] `PUT /admin/catalog/vehicles/:id` - Update catalog entry
- [ ] `DELETE /admin/catalog/vehicles/:id` - Remove catalog entry
- [ ] `POST /admin/catalog/vehicles/:id/thumbnail` - Upload default image (presigned)

**Service Layer:**
- [ ] `VehicleCatalogService` (CRUD, search, duplicate detection)
- [ ] Integration with MinIO for default thumbnails
- [ ] Cache invalidation on catalog changes

**Acceptance Criteria:**
- CRUD operations work with validation
- Duplicate detection (same make/model/year/trim) enforced
- Search supports filters (type, make, model, year range)
- Default thumbnails upload to MinIO `/defaults/vehicles/` path
- Redis cache invalidated on mutations
- Integration tests + unit tests ≥80%

---

### 4. Service Center Management
**Reference:** Design Doc § 3.3, 5.1 (service_centers table)

**Endpoints:**
- [ ] `GET /admin/service-centers` - List all centers (paginated)
- [ ] `GET /admin/service-centers/:id` - Get center details
- [ ] `POST /admin/service-centers` - Create center
- [ ] `PUT /admin/service-centers/:id` - Update center
- [ ] `DELETE /admin/service-centers/:id` - Delete center
- [ ] `POST /admin/service-centers/geocode` - Geocode address via Maps API

**Service Layer:**
- [ ] `ServiceCenterService` (CRUD, geocoding)
- [ ] Maps API integration (Google Maps or alternative)
- [ ] Geocode result caching (Redis, 24h TTL per § 6)

**Acceptance Criteria:**
- All CRUD operations work
- Geocoding resolves coordinates and caches results
- Search supports city/name filtering
- Certified flag toggleable
- Integration tests cover geocoding & cache behavior

---

### 5. News, Events & Recalls Management
**Reference:** Design Doc § 3.3, 5.1 (news_items table)

**Endpoints:**
- [ ] `GET /admin/news` - List all news/events/recalls (paginated)
- [ ] `GET /admin/news/:id` - Get news item details
- [ ] `POST /admin/news` - Create news item
- [ ] `PUT /admin/news/:id` - Update news item
- [ ] `DELETE /admin/news/:id` - Delete news item
- [ ] `PUT /admin/news/:id/publish` - Set publication date

**Service Layer:**
- [ ] `NewsService` (CRUD, filtering by make/model/year/type)
- [ ] Rich text content handling (sanitization)
- [ ] Cache invalidation for news lists

**Acceptance Criteria:**
- CRUD operations with validation
- Filters work (type, make, model, year range, published status)
- Publication date controls visibility (only `published_at <= now()` public)
- Content sanitization prevents XSS
- Integration tests verify filtering & publication logic

---

### 6. Video Management (Per Catalog Vehicle)
**Reference:** Design Doc § 18 (similar pattern to image gallery)

**Endpoints:**
- [ ] `GET /admin/catalog/vehicles/:id/videos` - List videos for catalog vehicle
- [ ] `POST /admin/catalog/vehicles/:id/videos` - Add video link (YouTube/Vimeo)
- [ ] `PUT /admin/catalog/vehicles/:id/videos/:vid` - Update video
- [ ] `DELETE /admin/catalog/vehicles/:id/videos/:vid` - Remove video

**Schema Addition (migration required):**
```sql
-- catalog_videos table
id UUID PK
catalog_vehicle_id UUID FK -> vehicle_catalog
title TEXT NOT NULL
video_url TEXT NOT NULL (YouTube/Vimeo embed)
thumbnail_url TEXT NULL
display_order INT DEFAULT 0
created_at TIMESTAMP
```

**Service Layer:**
- [ ] `VideoService` (CRUD, URL validation)
- [ ] Video URL extraction (YouTube/Vimeo ID)
- [ ] Thumbnail auto-fetch from video platform APIs

**Acceptance Criteria:**
- Videos stored with validated URLs
- Display order configurable
- Thumbnails auto-populated when possible
- Integration tests verify URL validation

---

### 7. Admin Dashboard KPIs
**Reference:** Design Doc § 3.3 (Dashboard Overview)

**Endpoints:**
- [ ] `GET /admin/metrics/overview` - Aggregate KPIs

**KPIs to compute:**
- Total registered users (count)
- Total vehicles in user garages (count)
- Active reminders (status='PENDING', count)
- Top 10 makes by vehicle count
- Recent user registrations (last 7/30 days)
- Service records created (last 7/30 days)

**Service Layer:**
- [ ] `MetricsService` (aggregation queries)
- [ ] Cache KPIs in Redis (5-minute TTL)
- [ ] Efficient aggregation queries with indexes

**Acceptance Criteria:**
- All KPIs return correct counts
- Queries optimized with proper indexes
- Redis caching reduces DB load
- Response time <200ms (hot cache)

---

### 8. Audit Logging
**Reference:** Design Doc § 3.3, 5.1 (audit_logs table)

**Implementation:**
- [ ] Audit middleware for all admin mutations
- [ ] Capture: actor_user_id, action, entity, entity_id, diff (JSONB)
- [ ] Endpoint: `GET /admin/audit-logs` (paginated, filterable)

**Acceptance Criteria:**
- All admin CREATE/UPDATE/DELETE logged
- Diff captures before/after state
- Logs queryable by entity, user, date range
- Integration tests verify log creation

---

### 9. Broadcast Messages (Optional for MVP)
**Reference:** Design Doc § 5.1 (broadcast_messages table)

**Endpoints:**
- [ ] `POST /admin/broadcast` - Create broadcast message
- [ ] `GET /admin/broadcast` - List past broadcasts
- [ ] `POST /admin/broadcast/:id/send` - Trigger send

**Service Layer:**
- [ ] `BroadcastService` (create, filter targeting, send)
- [ ] Email/SMS integration (stubbed for MVP)

**Acceptance Criteria:**
- Broadcasts created with target filters (JSONB)
- Stubbed send function logs intent
- Ready for future email/SMS provider integration

---

## Testing Requirements
**Reference:** Constitution § 3

- [ ] **Unit tests:** All services ≥80% coverage
- [ ] **Integration tests:** All endpoints with Supertest + test containers
- [ ] **Contract tests:** OpenAPI snapshot generated and versioned
- [ ] **E2E (deferred to Phase 2):** Admin flows tested via Playwright

---

## API Documentation
- [ ] OpenAPI 3.0 spec generated (via Fastify plugins or manual)
- [ ] Swagger UI available at `/api/docs` (dev only)
- [ ] All DTOs documented with examples

---

## Performance Targets
**Reference:** Design Doc § 3, Constitution § 5

- [ ] Hot-path reads (KPIs, catalog lists): P50 <200ms
- [ ] Mutations: P95 <500ms
- [ ] All list endpoints: keyset pagination, max 50 items
- [ ] Rate limits enforced at gateway

---

## Task Breakdown

### T1.1: API Gateway Setup
- Fastify app scaffold
- Auth middleware integration
- Rate limiting, CORS, compression
- **Test:** Health check responds, auth blocks unauth requests

### T1.2: Admin Auth Endpoints
- Login, refresh, logout
- JWT generation/validation
- Redis token blacklist
- **Test:** Integration tests for auth flow

### T1.3: User Management Endpoints
- List, get, update status
- Keyset pagination
- **Test:** Filter & pagination work correctly

### T1.4: Vehicle Catalog CRUD
- All catalog endpoints
- Duplicate detection
- MinIO thumbnail integration
- **Test:** CRUD + search integration tests

### T1.5: Service Center CRUD
- All center endpoints
- Maps API geocoding
- Redis cache for geocode results
- **Test:** Geocoding & cache behavior verified

### T1.6: News/Events/Recalls CRUD
- All news endpoints
- Rich text sanitization
- Publication date logic
- **Test:** Filtering & publication tests

### T1.7: Video Management
- Migration for catalog_videos table
- CRUD endpoints
- URL validation & thumbnail fetch
- **Test:** Video CRUD integration tests

### T1.8: Admin Dashboard KPIs
- Metrics aggregation service
- Redis caching (5-min TTL)
- **Test:** KPI accuracy & performance

### T1.9: Audit Logging
- Middleware for mutation tracking
- Audit log query endpoint
- **Test:** All mutations logged correctly

### T1.10: OpenAPI Documentation
- Generate OpenAPI spec
- Swagger UI setup
- **Test:** API docs accessible and accurate

---

## Definition of Done
- [ ] All endpoints implemented and tested (integration + unit)
- [ ] OpenAPI spec generated and versioned
- [ ] Lint and type checks pass
- [ ] Performance targets met (measured in staging)
- [ ] Audit logging functional for all admin actions
- [ ] README updated with API usage examples

---

## Open Questions
- Preferred Maps API provider (Google vs OpenStreetMap/Mapbox)?
- Email/SMS provider for future broadcast feature?
- Should video thumbnails be mirrored to MinIO or hotlinked?

---

## Estimated Effort
**7-10 days** (backend development + comprehensive testing)
