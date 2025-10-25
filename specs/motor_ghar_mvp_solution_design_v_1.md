# **MotorGhar MVP – Product Requirements Specification (v1.0)**

*Version:* 1.0
*Date:* 2025-10-24
*Prepared by:* Workalaya Solutions
*Scope:* MVP release for “My Garage” and Admin Console
*Reference:* v0.2 full specification (Nepal-Market-Validated)

---

## **0. Executive Summary**

MotorGhar is Nepal’s **Digital Garage** — a platform that allows vehicle owners to manage their vehicles, track services, discover trusted service centers, and stay updated with relevant news and recalls.

The **MVP (v1.0)** focuses on establishing the foundation for this ecosystem through:

1. **User & Profile Management (Owner Portal)**
2. **My Garage** – full vehicle lifecycle management
3. **Admin Console** – centralized catalog and content management

VIN-based lookup, marketplace, and inspection features will follow in future versions.

---

## **1. Goals and Non-Goals**

### **1.1 Goals**

* Enable users to digitally manage their vehicles (add, update, delete).
* Provide users with access to verified service centers and allow scheduling of services.
* Offer a simple way to record and view service history.
* Display curated news, events, and recalls per vehicle model.
* Establish an admin console for managing vehicles, news, and service centers.

### **1.2 Non-Goals**

* No marketplace, buyer, or seller workflows.
* No partner (service center) logins.
* No VIN-based auto-lookup or DoTM integration.
* No payment or subscription features.
* No predictive analytics, ML models, or advanced notifications.

---

## **2. Personas**

| Persona           | Description                                         | Primary Goals                                                                  |
| ----------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Vehicle Owner** | A registered user who manages one or more vehicles. | Maintain a digital record of vehicles, services, and reminders.                |
| **Administrator** | MotorGhar internal team.                            | Manage supported vehicles, service centers, and public content (news/recalls). |

---

## **3. Functional Scope**

### **3.1 User & Profile Management**

| Feature                | Description                                               | Acceptance Criteria                                                           |
| ---------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **User Registration**  | Email/password-based registration. OTP to be added later. | User can register with a valid email and password; email uniqueness enforced. |
| **Login/Logout**       | Session-based authentication using JWT.                   | Successful login returns token; logout invalidates session.                   |
| **Profile Management** | Update name, phone number, address, language preference.  | Profile data editable post-login.                                             |
| **Role-Based Access**  | Roles: OWNER, ADMIN.                                      | Access restricted per role.                                                   |
| **Localization**       | English and Nepali supported in all key UI strings.       | User can switch between languages.                                            |

---

### **3.2 My Garage (Owner Portal)**

| Feature                       | Description                                                              | Acceptance Criteria                                                        |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Vehicle Management**        | Add, update, delete vehicles manually using make, model, year, and trim. | CRUD operations must succeed; validation for duplicates (same reg number). |
| **Vehicle Details View**      | View detailed profile of each vehicle.                                   | Includes base info, documents, service history, reminders, and news.       |
| **Document Vault (Lite)**     | Upload and view documents (Bluebook, insurance, tax).                    | File size limit 10 MB; accepted formats: PDF/JPG/PNG.                      |
| **Service Center Discovery**  | Browse and save nearby service centers.                                  | Uses location data (Google Maps API or local dataset).                     |
| **Service Scheduling**        | Book and manage service appointments.                                    | Calendar view; reminders via email/SMS.                                    |
| **Service History Tracking**  | Log completed services with date, cost, notes.                           | Each record editable and deletable; cost numeric validation.               |
| **Reminders & Notifications** | Auto reminders for service dates and insurance expiry.                   | Configurable thresholds (default: 7 days before).                          |
| **News, Events & Recalls**    | Display vehicle-specific updates from Admin module.                      | Filtered by make/model/year; sorted by date.                               |
| **Notes**                     | Allow user to add personal notes per vehicle.                            | CRUD operations with timestamps.                                           |

---

### **3.3 Admin Console**

| Feature                        | Description                                             | Acceptance Criteria                                     |
| ------------------------------ | ------------------------------------------------------- | ------------------------------------------------------- |
| **Dashboard Overview**         | Display KPIs (total users, vehicles, active reminders). | Real-time counts from database.                         |
| **User Management**            | View and manage registered users.                       | Filter by role, last login; deactivate/reactivate.      |
| **Vehicle Catalog Management** | Add and maintain supported makes, models, and trims.    | CRUD functionality with uniqueness validation.          |
| **Service Center Management**  | Add/edit service center info with geo-coordinates.      | Must support address, contact, map pin.                 |
| **News & Recalls Management**  | Publish news/events linked to vehicle models.           | Rich text editor for content; publication date control. |
| **Audit Logs**                 | Track admin actions.                                    | All CRUD actions logged with timestamp and user ID.     |

---

# MotorGhar MVP – Solution Design (v1.0)
*Date:* 2025‑10‑24  
*Prepared by:* Workalaya Solutions  
*Scope:* Owner Portal (My Garage) + Admin Console  
*Non‑Goals:* Marketplace, inspections workflow, partner portals, VIN lookup, event bus/streaming

---

## 1) Architecture Overview
- **Frontend:** React + Vite + TypeScript (SPA), bilingual (English/Nepali).
- **Gateway:** Fastify API Gateway (JWT auth, request validation, rate limiting, CORS, gzip/br).  
- **Backend:** Node.js service (Fastify/Express) with modular services: Auth, User, Vehicle, ServiceRecord, Reminder, News, Document, Admin.  
- **DB:** PostgreSQL 16 (primary store).  
- **Cache:** Redis 7 (sessions, short‑TTL query cache, reminder schedules).  
- **Object Store:** MinIO (S3 compatible) for documents (Bluebook, insurance, tax).  
- **External:** Maps provider (Google Maps or open alternative) & Email/SMS provider for reminders.  
- **Infra:** Docker Compose for local; containerized deploy for staging/prod.  
- **Observability:** App logs (JSON), request metrics, tracing hooks (future), DB/Redis dashboards.

**Key Qualities:** performance (P50 < 2s page loads), security (RBAC, encrypted transit/at rest), maintainability (Nx monorepo, modular boundaries), reliability (graceful degradation when external services fail).

---

## 2) Technology Choices (confirmed)
- **Monorepo:** Nx + pnpm, Node 20.x.  
- **Frontend:** React + Vite + TanStack Router/Query, Tailwind, i18n (react‑i18next), form validation (react‑hook‑form + zod).  
- **Gateway/Backend:** Fastify, zod for DTO validation, Prisma ORM, pino logging.  
- **DB:** PostgreSQL 16 (UUID PKs), PG Partitions not required for MVP; strict foreign keys.  
- **Cache:** Redis 7 (ioredis), optional BullMQ later (not in MVP).  
- **Storage:** MinIO with server‑side encryption (SSE‑S3).  
- **Auth:** JWT (HS256) with refresh tokens; bcrypt for password hashing.  
- **Testing:** Vitest/Jest (unit), Supertest (API), Playwright (E2E).  
- **CI/CD:** Nx cache + GitHub/GitLab CI, Docker buildx + compose, DB migrations via Prisma.  
- **Localization:** English/Nepali key bundle from a central i18n catalog package.

---

## 3) Performance Strategy (MVP)
1. **DB First:**
   - Narrow tables, correct data types, essential composite indexes only.
   - Use **covering indexes** for hot reads; avoid premature FTS (pg_trgm optional later).
   - Bounded result sets with keyset pagination for large lists.
2. **API:**
   - Strict DTO validation (zod) at edges.
   - Response compression (br/gzip), ETag/Last‑Modified for GETs.
   - 95th percentile SLOs tracked (latency, error rate).  
3. **Cache:**
   - **Read‑through cache** for: vehicle details, user’s vehicle list, model catalog, news list. TTL 60–300s.  
   - **Write‑invalidate** on corresponding mutations.  
4. **Frontend:**
   - Vite code‑splitting, route‑based lazy loading, image/document prefetch where safe.  
   - TanStack Query caching & background refetch.
5. **Files:**
   - Presigned URLs for MinIO uploads/downloads; client uses chunked uploads for >5 MB (MVP cap 10 MB so single put ok).  
6. **Maps:**
   - Debounced geocode/search; server caches Places results for 10–30 min.

---

## 4) Search Design (No Full‑Text Yet)
**Use cases:**
- Owner: quick filter within **my vehicles** by make/model/year/registration.  
- Admin: search **supported catalog** (make/model/trim) and **service centers** (name/city).  
- News/Recalls: filter by make/model/year, sort by date; simple keyword contains.

**Implementation:**
- SQL `ILIKE` on indexed columns for small cardinality (make, model).  
- Optional: `pg_trgm` extension + GIN index for **service center name** and **news title** if needed (toggle via migration flag).  
- Keyset pagination (`WHERE (created_at,id) < (?,?) ORDER BY created_at DESC, id DESC LIMIT n`).  
- Avoid wildcard prefix scans on unindexed fields; expose parametric filters from UI.

---

## 5) Data Model (Revised for MVP & Future Insights)

### 5.0 Design Philosophy
The MotorGhar platform’s long-term moat is **data** — rich, structured, and behavioral. Even in MVP, the schema is designed to capture detailed insights about users, vehicles, and their interactions. Every major entity includes metadata hooks (e.g., source, tags, notes) for later analytics and personalization models. (MVP)

### 5.1 Tables (core)
- **users**(id UUID PK, email UNIQUE, password_hash, name, phone, address, city, lang, role ENUM['OWNER','ADMIN'], preferences JSONB DEFAULT '{}', created_at, updated_at)
  - Captures optional preferences (language, notification opt-ins, service frequency expectations, etc.)

- **vehicle_catalog**(id UUID PK, type ENUM['CAR','BIKE'], make, model, year SMALLINT, trim, engine TEXT NULL, transmission TEXT NULL, fuel TEXT NULL, body_type TEXT NULL, specs JSONB DEFAULT '{}', created_at)
  - Represents a *generic vehicle definition* used for all instances.

- **vehicles**(id UUID PK, user_id FK->users, catalog_id FK->vehicle_catalog, registration_no TEXT NULL, color, nickname, mileage INTEGER NULL, condition TEXT NULL, usage_pattern ENUM['DAILY','OCCASIONAL','RARE'] NULL, notes TEXT NULL, created_at, updated_at)
  - Represents a *user-specific instance* of a vehicle, with personalized data like mileage, notes, and condition.

- **service_centers**(id UUID PK, name, address, city, lat DECIMAL(9,6), lon DECIMAL(9,6), phone, email, website, certified BOOLEAN DEFAULT false, created_at)

- **service_records**(id UUID PK, vehicle_id FK->vehicles, date DATE, center_id FK->service_centers NULL, odometer INTEGER NULL, cost NUMERIC(10,2) DEFAULT 0, notes TEXT, rating SMALLINT NULL, created_at)

- **reminders**(id UUID PK, vehicle_id FK->vehicles, type ENUM['SERVICE','INSURANCE','EMI','CUSTOM'], title TEXT, due_date DATE, status ENUM['PENDING','SENT','DISMISSED'] DEFAULT 'PENDING', created_at)

- **news_items**(id UUID PK, title, content TEXT, type ENUM['NEWS','EVENT','RECALL'], make, model, year_min SMALLINT NULL, year_max SMALLINT NULL, published_at TIMESTAMP, created_at)

- **documents**(id UUID PK, vehicle_id FK->vehicles, kind ENUM['BLUEBOOK','INSURANCE','TAX','OTHER'], object_key, mime, size_bytes INTEGER, created_at)

- **broadcast_messages**(id UUID PK, title, message TEXT, filters JSONB NULL, target ENUM['ALL','OWNERS','VEHICLES'], created_by FK->users, sent_at TIMESTAMP NULL, created_at)
  - Supports system- or admin-initiated announcements to users or specific vehicle cohorts (by make/model/year or region).

- **audit_logs**(id UUID PK, actor_user_id FK->users, action, entity, entity_id, diff JSONB, created_at)

### 5.2 Relationships and Design Notes
- Split between **vehicle_catalog** (generic) and **vehicles** (user-owned instance) ensures clean analytics and personalization later.
- Registration number is now **TEXT NULL** — not unique, as users may onboard without it.
- **Type** added to catalog to distinguish cars vs bikes.
- **Broadcast_messages** enables admin push or targeted notifications.
- Future personalization models can use `preferences` + `usage_pattern` + `mileage` trends to recommend service intervals, parts, or resale insights.

### 5.3 Indexing
- `users(email)` UNIQUE  
- `vehicles(user_id, created_at DESC)`  
- `vehicles(registration_no)` UNIQUE (partial index `WHERE registration_no IS NOT NULL`)  
- `service_records(vehicle_id, date DESC)`  
- `reminders(vehicle_id, due_date, status)`  
- `news_items(make, model, published_at DESC)`  
- Optional: `service_centers USING GIN (name gin_trgm_ops)`; `news_items USING GIN (title gin_trgm_ops)`

### 5.4 Address Model (International-Ready)
To support global scalability while remaining practical for Nepal, the address system follows a hybrid model:

- **addresses**(id UUID PK, user_id FK->users NULL, line1 TEXT, line2 TEXT NULL, city TEXT NULL, district TEXT NULL, province TEXT NULL, postal_code TEXT NULL, country_code CHAR(2) DEFAULT 'NP', lat DECIMAL(9,6) NULL, lon DECIMAL(9,6) NULL, created_at)
  - For Nepal: `province`, `district`, `municipality` or `ward` stored within line2 or city fields.
  - For global readiness: store ISO country codes and postal codes when available.
  - Designed to be flexible and normalized for future lookups.

**Integration Notes:**
- `service_centers` and `users` reference `addresses.id` instead of text fields when possible.
- Cache resolved coordinates in Redis; maintain consistent schema across future countries.

### 5.3 Referential Integrity
- `ON DELETE CASCADE` for vehicles → service_records, documents, reminders.  
- `ON DELETE SET NULL` for service_records.center_id.

---

## 6) API Design

### Maps & Geocoding Usage
- **Provider:** Google Maps API (or compatible open alternative).
- **Free Tier:** Google offers ~$200 monthly free credit (≈40,000 standard calls).
- **Optimization Strategy:**
  - Cache frequently requested coordinates or place lookups in Redis (TTL 24h) keyed by query.
  - Persist resolved lat/lon in DB (`addresses` or `service_centers`) to avoid repeat calls.
  - Use debounced search on frontend and rate-limited proxy server-side.
  - For MVP, prioritize read caching and preloading of known service center coordinates.
 (Conventions)
- **Base URL:** `/api`  
- **Auth:** Bearer JWT; refresh endpoint rotates tokens.  
- **Versioning:** Path based `/api/v1/...` (alias `/api`).  
- **Schema:** `{ success: boolean, data?: T, error?: { code, message, details? } }`  
- **Validation:** zod; return 422 on DTO errors with field map.  
- **Pagination:** Keyset params `cursor` (opaque), `limit` (<=50).  
- **Idempotency:** `Idempotency-Key` header supported for POST file/doc uploads and service record creation.  
- **Rate Limits:** 60 req/min per IP (public), 300 req/min per JWT (auth).  
- **CORS:** allowlist by env.

**Primary Endpoints (illustrative):**
- **Auth/Profile**: `/auth/register`, `/auth/login`, `/auth/refresh`, `/profile{GET|PUT}`
- **Vehicles**: `/vehicles{GET|POST}`, `/vehicles/:id{GET|PUT|DELETE}`
- **Service Records**: `/vehicles/:id/services{GET|POST}`, `/services/:sid{GET|PUT|DELETE}`
- **Reminders**: `/vehicles/:id/reminders{GET|POST}`, `/reminders/:rid{PUT:status}`
- **Service Centers**: `/service-centers{GET}`, admin CRUD under `/admin/service-centers`
- **News**: `/news?make=&model=&year=`, admin CRUD `/admin/news`
- **Documents**: `/vehicles/:id/documents{POST presign|GET list}`, `/documents/:docId{DELETE}`
- **Admin**: `/admin/users`, `/admin/catalog/makes`, `/admin/catalog/models`, `/admin/metrics`

---

## 7) Security & Compliance
- **Passwords:** bcrypt(12).  
- **JWT:** access 15m, refresh 7d; rotate on refresh; blacklist on logout.  
- **RBAC:** OWNER vs ADMIN guards at route level; finer policies added later.  
- **Transport:** HTTPS only; HSTS at gateway.  
- **Data at Rest:** MinIO SSE‑S3, DB volume encryption per environment.  
- **PII:** minimal collection; profile + docs confined to user/vehicle scope.  
- **Audit:** admin mutations logged to `audit_logs`.  
- **Uploads:** MIME + size validation; AV scan stubbed (hook ready for later ClamAV).  
- **Secrets:** injected via env, never in repo; support SOPS later.

---

## 8) Reminders & Notifications (MVP)
- Scheduler runs every hour to scan `reminders` where `status='PENDING' AND due_date <= now()+interval '7 days'`.  
- Sends email/SMS via NotificationClient and marks `SENT` when delivered.  
- Users can snooze/dismiss in UI.

---

## 9) Frontend UX Notes
- **Apps:** `buyer-portal` (owner UI) and `admin-console` as separate React apps in Nx.  
- **Shared UI lib:** `@motorghar/shared-ui` for components; `@motorghar/shared-i18n` for strings.  
- **State:** TanStack Query for server cache; URL‑driven filters; optimistic updates for notes/service logs.  
- **Accessibility:** keyboard‑first flows, semantic HTML, color‑contrast checks.  
- **Map View:** cluster markers for centers; “save center” persisted per user.

---

## 10) Deployment & Environments
- **Docker Compose (local):** postgres, redis, minio (+mc init), backend, gateway, admin-console, buyer-portal, pgAdmin (optional).  
- **Staging/Prod:** container images; separate managed Postgres/Redis if available; MinIO or S3.  
- **Config via ENV:** `DATABASE_URL`, `REDIS_URL`, `MINIO_*`, `JWT_SECRET`, `EMAIL_*`, `MAPS_*`.  
- **DB Migrations:** Prisma migrate in CI; gated with approval in prod.  
- **Backups:** nightly DB dump; MinIO versioning enabled.

---

## 11) Observability
- **Logging:** pino JSON with request id;  
- **Metrics (MVP):** basic Prometheus endpoints (latency, RPS, error rate).  
- **Healthchecks:** `/healthz` (app), DB/Redis pings; compose `healthcheck` for infra.  
- **Tracing:** OpenTelemetry hooks scaffolded (disabled by default).

---

## 12) Testing Strategy
- **Unit:** services and utils (coverage ≥80% for core).  
- **Integration:** API + DB using test containers.  
- **E2E:** Playwright for critical flows: register → add vehicle → add service → set reminder → view news → upload document.  
- **Contract:** OpenAPI snapshot tests for regression.

---

## 13) Initial Seed & Admin
- Seed catalog for common makes/models/years (Nepal market), 50–100 popular entries.  
- Seed 20 service centers (Kathmandu Valley) with coordinates.  
- Bootstrap `admin@motorghar.com` with ADMIN role.

---

## 14) Rollout Plan
1. **Alpha:** internal users; validate CRUD & docs; measure P50 latency and cold cache performance.  
2. **Beta (closed):** 50–100 owners; enable reminders + maps; collect feedback.  
3. **MVP:** open beta; expand catalog/service centers; start SEO for news/recalls pages.

---

## 15) ADRs (Architecture Decision Records)
1. **ADR‑001:** No event bus in MVP; cron‑based reminders acceptable.  
2. **ADR‑002:** No full‑text search; rely on indexed filters and optional pg_trgm for selective fields.  
3. **ADR‑003:** Single core backend service (modular) behind Fastify gateway to reduce operational complexity.  
4. **ADR‑004:** MinIO for document storage with presigned URLs; max 10 MB per file in MVP.  
5. **ADR‑005:** Keyset pagination as default for scalable lists.  
6. **ADR‑006:** Nx monorepo with separate apps for owner/admin; shared libs for UI, types, i18n.

---

## 16) Open Questions
- Address standardization roadmap: confirm how we evolve from Nepal-centric structure to ISO-compliant global model.
- Map caching & quota management: verify optimal Redis TTL and fallback to OpenStreetMap if quota exhausted.

- Do we require city/municipality taxonomy for better center discovery at MVP, or rely on free‑text + coordinates?  
- Which SMS/email provider do we standardize on for Nepal deliverability?  
- Do we allow multiple owners per vehicle (family scenario) in MVP or later?  
- Is offline upload (mobile spotty networks) a requirement for early users?

---

## 17) Definition of Done (MVP)
- All endpoints implemented with validation, RBAC, tests.  
- Frontend owner/admin flows complete with i18n.  
- Seed data loaded; maps working; reminders deliver.  
- Observability dashboards show latency < 200ms p50 for hot reads (staging).  
- Security review passed; secrets rotated; backups enabled.



---

## 18) Vehicle Images & Gallery Design (MVP)

### 18.1 Goals
- Ensure every vehicle has a pleasant **default thumbnail** even if the owner hasn’t uploaded photos.
- Support a simple, fast **gallery** per vehicle with a clear fallback chain.
- Keep storage/layout consistent for future CDN and AI-generated images.

### 18.2 Default Image Sources (MVP approach)
1. **Curated stock/royalty‑free images** for Top‑100 Nepal market models (cars + bikes).  
2. Store as read‑only defaults; allow Admin overwrite per model/year.  
3. Defer VIN‑specific imagery and OEM licensing to later phases.

> Roadmap: add AI‑generated renders (SDXL/ControlNet) to fill gaps with a consistent MotorGhar style; community voting later for best default per model.

### 18.3 Storage Layout (MinIO)
```
/defaults/vehicles/{make}/{model}/{year}/thumbnail.jpg
/user/{user_id}/{vehicle_id}/gallery/{uuid}.jpg
/placeholders/vehicle_car_placeholder.jpg
/placeholders/vehicle_bike_placeholder.jpg
```
- Defaults are **public-read** (served via CDN/proxy).  
- User uploads via **presigned PUT**; objects private by default.

### 18.4 Database Schema Additions
- `vehicles.default_image_key TEXT NULL` — optional override key to a default image.  
- New table `vehicle_gallery`:
  - `id UUID PK`
  - `vehicle_id UUID FK -> vehicles ON DELETE CASCADE`
  - `user_id UUID FK -> users`
  - `object_key TEXT NOT NULL`
  - `mime TEXT NOT NULL`
  - `size_bytes INT NOT NULL CHECK (size_bytes <= 5*1024*1024)`
  - `is_primary BOOLEAN NOT NULL DEFAULT false`
  - `created_at TIMESTAMP NOT NULL DEFAULT now()`

**Indexes**  
- `vehicle_gallery(vehicle_id, created_at DESC)`  
- Partial unique on `(vehicle_id)` where `is_primary = true` to ensure a single primary image.

### 18.5 API Endpoints
- `GET   /vehicles/:id/gallery` → list gallery (primary first)
- `POST  /vehicles/:id/gallery/presign` → returns presigned PUT URL (valid 5 min, expects `mime`, `size`)
- `POST  /vehicles/:id/gallery` → finalize after upload `{object_key, mime, size_bytes}`
- `PUT   /vehicles/:id/gallery/:gid/primary` → set primary (enforces uniqueness)
- `DELETE /vehicles/:id/gallery/:gid` → remove image (and primary reflow)
- **Admin:** `POST /admin/catalog/:make/:model/:year/thumbnail` → upload/replace default

**Conventions**: presign response includes `fields` (if using POST form) or direct PUT URL; require `Idempotency-Key` header.

### 18.6 Frontend Behavior & UX
- **Thumbnail fallback chain**: `primary user image → any user image → vehicle default → brand placeholder`.
- **Garage list**: 4:3 or 16:9 responsive card; blur‑up placeholder; show next service date overlay.  
- **Vehicle detail**: carousel/lightbox; limit 5 images @ ≤5 MB; drag‑drop upload with progress; mark primary.  
- **Admin console**: preview/replace default thumbnail; validate license note.

### 18.7 Performance & Caching
- Serve defaults via CDN or image proxy; set `Cache-Control: public, max-age=3600`.  
- Redis cache: thumbnail URL resolution (vehicle → object_key) TTL 10–30 min.  
- Generate responsive sizes on the fly via proxy (roadmap) or store 3 renditions at upload (S, M, L).

### 18.8 Security, Licensing & Moderation
- Validate MIME/size; run file signature check; strip EXIF on upload.  
- TOS disallows copyrighted uploads without rights; admin flag to quarantine images.  
- Record `source ENUM['DEFAULT','USER','AI']` in `vehicle_gallery` (optional column) for provenance.

### 18.9 AI‑Generated Defaults (Roadmap)
- Prompt template: *"studio photo, {year} {make} {model}, three‑quarter side view, plain background, neutral lighting"*.  
- Batch job fills missing defaults; human review required before publish.  
- Store under `/ai-generated/...`; watermark subtly if policy requires.

### 18.10 Testing & DoD
- E2E: upload → list → set primary → delete → fallback verified.  
- Accessibility: keyboard navigation in carousel, alt text = `{year} {make} {model}`.  
- Load test: 95th percentile image fetch under 150 ms from CDN; API list under 150 ms hot‑cache.  
- Backups/versioning enabled for MinIO; accidental delete recoverable.

