# Phase 3: My Garage (Owner Portal) - Backend & APIs

**Status:** Not Started
**Prerequisites:** Phase 0 complete (Phase 1-2 can run in parallel)
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md) § 3.2
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Objectives
- Implement complete owner-facing backend services
- Build REST APIs for vehicle management, service tracking, reminders
- Enable document storage and retrieval
- Support service center discovery and scheduling

---

## Deliverables

### 1. Owner Authentication & Profile
**Reference:** Design Doc § 3.1

**Endpoints:**
- [ ] `POST /auth/register` - Owner registration (email/password)
- [ ] `POST /auth/login` - Owner login
- [ ] `POST /auth/refresh` - Token refresh
- [ ] `POST /auth/logout` - Logout (blacklist token)
- [ ] `GET /profile` - Get current user profile
- [ ] `PUT /profile` - Update profile (name, phone, address, language)
- [ ] `PUT /profile/password` - Change password

**Service Layer:**
- [ ] `AuthService` (registration, login, password change)
- [ ] Email uniqueness validation
- [ ] Password strength validation (min 8 chars, complexity)
- [ ] Profile service (CRUD operations)

**Acceptance Criteria:**
- Registration creates new user with OWNER role
- Email uniqueness enforced (422 on duplicate)
- Login returns valid JWT (15m access, 7d refresh per § 7)
- Profile updates persist and return updated data
- Password change validates old password before update
- Integration tests cover all flows

---

### 2. Vehicle Management (User Garage)
**Reference:** Design Doc § 3.2, 5.1 (vehicles table)

**Endpoints:**
- [ ] `GET /vehicles` - List user's vehicles (paginated)
- [ ] `POST /vehicles` - Add vehicle to garage
- [ ] `GET /vehicles/:id` - Get vehicle details
- [ ] `PUT /vehicles/:id` - Update vehicle
- [ ] `DELETE /vehicles/:id` - Remove vehicle (cascade deletes)
- [ ] `GET /vehicles/:id/summary` - Vehicle summary (next service, reminders, recent news)

**Service Layer:**
- [ ] `VehicleService` (CRUD, ownership validation)
- [ ] Catalog lookup integration (link to `vehicle_catalog`)
- [ ] Registration number uniqueness check (partial index per § 5.3)
- [ ] Cache user vehicle list (Redis, 5-min TTL)
- [ ] Cache invalidation on mutations

**Acceptance Criteria:**
- Owners can only CRUD their own vehicles (RBAC enforced)
- Vehicle links to catalog entry correctly
- Registration number unique if provided
- Usage pattern, condition, notes stored correctly
- Vehicle deletion cascades to service records, documents, reminders
- Cache invalidation works on add/update/delete
- Integration tests + unit tests ≥80%

---

### 3. Service History Tracking
**Reference:** Design Doc § 3.2, 5.1 (service_records table)

**Endpoints:**
- [ ] `GET /vehicles/:id/services` - List service records (paginated)
- [ ] `POST /vehicles/:id/services` - Add service record
- [ ] `GET /services/:sid` - Get service record details
- [ ] `PUT /services/:sid` - Update service record
- [ ] `DELETE /services/:sid` - Delete service record

**Service Layer:**
- [ ] `ServiceRecordService` (CRUD, ownership validation)
- [ ] Odometer validation (must be >= previous record)
- [ ] Cost numeric validation
- [ ] Service center linkage (optional FK to service_centers)
- [ ] Rating validation (1-5 if provided)

**Acceptance Criteria:**
- Service records linked to vehicle correctly
- Odometer progression validated
- Service center association optional
- Rating and notes stored
- Owners can only access their vehicle's records
- Keyset pagination works (§ 6)
- Integration tests cover CRUD + validation

---

### 4. Reminders & Notifications
**Reference:** Design Doc § 3.2, 8 (Reminders & Notifications)

**Endpoints:**
- [ ] `GET /vehicles/:id/reminders` - List reminders for vehicle
- [ ] `POST /vehicles/:id/reminders` - Create reminder
- [ ] `PUT /reminders/:rid` - Update reminder
- [ ] `PUT /reminders/:rid/dismiss` - Dismiss reminder
- [ ] `DELETE /reminders/:rid` - Delete reminder

**Service Layer:**
- [ ] `ReminderService` (CRUD, ownership validation)
- [ ] Reminder types: SERVICE, INSURANCE, EMI, CUSTOM
- [ ] Status management: PENDING, SENT, DISMISSED
- [ ] Scheduler (cron job): scan reminders due within 7 days
- [ ] Email/SMS sending (stubbed for MVP with logging)

**Scheduler Implementation:**
- [ ] Hourly job (`ReminderScheduler.checkPendingReminders()`)
- [ ] Query: `status='PENDING' AND due_date <= now() + interval '7 days'`
- [ ] Send notification (email/SMS via `NotificationService`)
- [ ] Mark as SENT when delivered
- [ ] Log failures for retry

**Acceptance Criteria:**
- Reminders created with correct type and due_date
- Scheduler runs hourly and processes pending reminders
- Notification sends stubbed but logged
- Status updates to SENT after delivery
- Dismiss functionality works
- Integration tests + scheduler unit test

---

### 5. Document Vault (Lite)
**Reference:** Design Doc § 3.2, 18.3 (Storage Layout)

**Endpoints:**
- [ ] `GET /vehicles/:id/documents` - List documents for vehicle
- [ ] `POST /vehicles/:id/documents/presign` - Get presigned upload URL
- [ ] `POST /vehicles/:id/documents` - Finalize document upload
- [ ] `GET /documents/:docId/download` - Get presigned download URL
- [ ] `DELETE /documents/:docId` - Delete document

**Service Layer:**
- [ ] `DocumentService` (CRUD, MinIO integration)
- [ ] Presigned URL generation (PUT for upload, GET for download, 5-min expiry)
- [ ] Document types: BLUEBOOK, INSURANCE, TAX, OTHER
- [ ] File size validation (≤10 MB per § 3.2)
- [ ] MIME type validation (PDF, JPG, PNG)
- [ ] Idempotency-Key support for uploads

**MinIO Storage Path:**
- `/user/{user_id}/{vehicle_id}/documents/{uuid}.{ext}`

**Acceptance Criteria:**
- Presigned upload URL works (client can PUT directly)
- Finalize endpoint records document metadata
- Download presigned URL expires after 5 min
- MIME and size validation enforced
- Delete removes from MinIO and database
- Idempotency prevents duplicate uploads
- Integration tests with MinIO test container

---

### 6. Vehicle Image Gallery
**Reference:** Design Doc § 18 (Vehicle Images & Gallery Design)

**Endpoints:**
- [ ] `GET /vehicles/:id/gallery` - List gallery images (primary first)
- [ ] `POST /vehicles/:id/gallery/presign` - Get presigned upload URL
- [ ] `POST /vehicles/:id/gallery` - Finalize image upload
- [ ] `PUT /vehicles/:id/gallery/:gid/primary` - Set primary image
- [ ] `DELETE /vehicles/:id/gallery/:gid` - Delete image

**Service Layer:**
- [ ] `VehicleGalleryService` (CRUD, MinIO integration)
- [ ] Image size validation (≤5 MB per § 18.4)
- [ ] MIME validation (JPG, PNG, WEBP)
- [ ] Primary image uniqueness (partial unique index per § 18.4)
- [ ] EXIF stripping on upload (security per § 18.8)
- [ ] Thumbnail fallback chain logic (API helper)

**MinIO Storage Path:**
- `/user/{user_id}/{vehicle_id}/gallery/{uuid}.jpg`

**Acceptance Criteria:**
- Gallery images upload via presigned URL
- Primary image enforcement (only one per vehicle)
- Delete removes image from MinIO + DB
- Thumbnail resolution works (primary → any user → default → placeholder)
- EXIF data stripped on upload
- Integration tests cover upload + primary setting

---

### 7. Service Center Discovery
**Reference:** Design Doc § 3.2, 5.1 (service_centers table)

**Endpoints:**
- [ ] `GET /service-centers` - List service centers (paginated, filterable)
- [ ] `GET /service-centers/:id` - Get center details
- [ ] `GET /service-centers/nearby` - Find centers near location (lat/lon query params)
- [ ] `POST /service-centers/:id/save` - Save center to user favorites (optional table)

**Service Layer:**
- [ ] `ServiceCenterService` (public read operations)
- [ ] Geospatial query for nearby centers (PostGIS or simple distance calc)
- [ ] City/name filter support
- [ ] Certified filter
- [ ] Cache center list (Redis, 30-min TTL)

**Geospatial Query (Simple):**
```sql
-- Haversine formula or PostgreSQL earthdistance extension
SELECT *, earth_distance(ll_to_earth(lat, lon), ll_to_earth(:user_lat, :user_lon)) AS distance
FROM service_centers
WHERE earth_distance(...) < 10000 -- 10km radius
ORDER BY distance
LIMIT 20;
```

**Acceptance Criteria:**
- List returns all centers with filters
- Nearby search works within specified radius
- Distance calculation accurate (±1%)
- Cache reduces DB load
- Integration tests verify filtering + geospatial query

---

### 8. Service Scheduling (Basic)
**Reference:** Design Doc § 3.2

**Endpoints:**
- [ ] `POST /vehicles/:id/appointments` - Create service appointment
- [ ] `GET /vehicles/:id/appointments` - List appointments for vehicle
- [ ] `PUT /appointments/:aid` - Update appointment
- [ ] `DELETE /appointments/:aid` - Cancel appointment

**Schema Addition (migration required):**
```sql
-- service_appointments table
id UUID PK
vehicle_id UUID FK -> vehicles ON DELETE CASCADE
center_id UUID FK -> service_centers
scheduled_at TIMESTAMP NOT NULL
service_type TEXT NOT NULL
notes TEXT NULL
status ENUM('SCHEDULED','COMPLETED','CANCELLED') DEFAULT 'SCHEDULED'
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()

INDEX: (vehicle_id, scheduled_at DESC)
```

**Service Layer:**
- [ ] `AppointmentService` (CRUD, ownership validation)
- [ ] Email/SMS reminder 24h before (via scheduler)
- [ ] Status transitions (SCHEDULED → COMPLETED/CANCELLED)

**Acceptance Criteria:**
- Appointments created with valid center and time
- Status management works
- Email/SMS reminder stubbed but logged
- Only vehicle owner can manage appointments
- Integration tests verify CRUD + reminders

---

### 9. News, Events & Recalls (Owner View)
**Reference:** Design Doc § 3.2, 5.1 (news_items table)

**Endpoints:**
- [ ] `GET /vehicles/:id/news` - Get news/events/recalls for vehicle
- [ ] `GET /news/:nid` - Get news item details

**Service Layer:**
- [ ] `NewsService` (read-only for owners)
- [ ] Filter by vehicle's make/model/year
- [ ] Only show published items (`published_at <= now()`)
- [ ] Sort by `published_at DESC`
- [ ] Cache news lists (Redis, 15-min TTL)

**Acceptance Criteria:**
- News filtered correctly by vehicle attributes
- Only published items shown
- Sorted by date (newest first)
- Cache reduces DB load
- Integration tests verify filtering

---

### 10. Owner Notes (Per Vehicle)
**Reference:** Design Doc § 3.2

**Endpoints:**
- [ ] `GET /vehicles/:id/notes` - List notes for vehicle
- [ ] `POST /vehicles/:id/notes` - Add note
- [ ] `PUT /notes/:nid` - Update note
- [ ] `DELETE /notes/:nid` - Delete note

**Schema Addition (migration required):**
```sql
-- vehicle_notes table
id UUID PK
vehicle_id UUID FK -> vehicles ON DELETE CASCADE
user_id UUID FK -> users
content TEXT NOT NULL
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()

INDEX: (vehicle_id, created_at DESC)
```

**Service Layer:**
- [ ] `VehicleNoteService` (CRUD, ownership validation)

**Acceptance Criteria:**
- Notes CRUD works with timestamps
- Only owner can manage notes
- Integration tests verify CRUD

---

## Testing Requirements
**Reference:** Constitution § 3

- [ ] **Unit tests:** All services ≥80% coverage
- [ ] **Integration tests:** All endpoints with Supertest + test containers
- [ ] **Contract tests:** OpenAPI snapshot for owner API
- [ ] **E2E (deferred to Phase 4):** Owner flows tested via Playwright

---

## Performance Targets
**Reference:** Design Doc § 3

- [ ] Vehicle list (hot cache): P50 <150ms
- [ ] Service history load: P50 <200ms
- [ ] Document presigned URL generation: P95 <300ms
- [ ] News fetch: P50 <150ms (cached)
- [ ] All list endpoints: keyset pagination, max 50 items

---

## Task Breakdown

### T3.1: Owner Auth & Profile
- Registration, login, logout endpoints
- Profile CRUD
- Password change
- **Test:** Integration tests for auth flow

### T3.2: Vehicle CRUD
- All vehicle endpoints
- Catalog integration
- Cache implementation
- **Test:** CRUD + cache invalidation tests

### T3.3: Service History
- Service record CRUD
- Odometer validation
- Service center linkage
- **Test:** Integration tests + validation edge cases

### T3.4: Reminders & Scheduler
- Reminder CRUD
- Hourly scheduler implementation
- Notification service stub
- **Test:** Scheduler unit test + integration tests

### T3.5: Document Vault
- Migration for documents table (if not in Phase 0)
- MinIO presigned URLs
- Document CRUD
- **Test:** Integration tests with MinIO

### T3.6: Vehicle Gallery
- Migration for vehicle_gallery table
- Image upload/delete
- Primary image management
- EXIF stripping
- **Test:** Integration tests + primary uniqueness

### T3.7: Service Center Discovery
- Public center endpoints
- Geospatial nearby search
- Cache implementation
- **Test:** Geospatial query accuracy tests

### T3.8: Service Scheduling
- Migration for appointments table
- Appointment CRUD
- Reminder integration
- **Test:** Integration tests + reminder logic

### T3.9: News for Owners
- News filtering by vehicle
- Publication date logic
- Cache implementation
- **Test:** Filtering + caching tests

### T3.10: Vehicle Notes
- Migration for notes table
- Notes CRUD
- **Test:** Integration tests

### T3.11: OpenAPI Documentation
- Generate OpenAPI spec for owner API
- Update Swagger UI
- **Test:** Contract snapshot tests

---

## Definition of Done
- [ ] All endpoints implemented and tested (integration + unit)
- [ ] OpenAPI spec generated and versioned
- [ ] Scheduler running and tested
- [ ] Lint and type checks pass
- [ ] Performance targets met (measured in staging)
- [ ] README updated with owner API usage examples

---

## Open Questions
- Email/SMS provider selection for reminders?
- PostGIS extension for geospatial or simple distance calc?
- Save favorite service centers to separate table or user preferences JSONB?

---

## Estimated Effort
**10-14 days** (backend development + comprehensive testing + scheduler)
