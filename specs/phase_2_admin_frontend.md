# Phase 2: Admin Console - Frontend & UX

**Status:** Not Started
**Prerequisites:** Phase 1 complete
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md) § 3.3, 9
**UX Standards:** [UX Specs](./ux_specs.md)
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Objectives
- Build complete Admin Console React application
- Implement all admin workflows with bilingual support
- Ensure responsive, accessible UX per design standards
- Enable real-time KPI dashboard

---

## Deliverables

### 1. Admin Console App Setup
**Reference:** Design Doc § 9 (Frontend UX Notes), UX Specs § 5

**App:** `apps/admin-console` (React + Vite + TypeScript)

- [ ] Vite + React + TypeScript configuration
- [ ] TanStack Router setup with route definitions
- [ ] TanStack Query configuration (API caching)
- [ ] Tailwind CSS with theme from UX Specs § 5.1
- [ ] react-i18next integration (using `@motorghar/shared-i18n`)
- [ ] Layout component (sidebar nav + header + content area)
- [ ] Protected route wrapper (admin-only)

**Acceptance Criteria:**
- App builds and runs (`nx serve admin-console`)
- Routing works for all admin pages
- Theme colors match UX Specs § 5.1
- Language toggle switches between English/Nepali
- Unauthorized users redirected to login

---

### 2. Authentication & Session Management
**Reference:** Design Doc § 3.1, UX Specs § 5.4

**Pages:**
- [ ] Login page (`/login`)
- [ ] Session refresh logic (TanStack Query)
- [ ] Logout functionality

**Components:**
- [ ] Login form (email/password, react-hook-form + zod)
- [ ] Error states for invalid credentials
- [ ] Loading states during login
- [ ] JWT token storage (httpOnly cookie or localStorage)
- [ ] Auto-refresh token before expiry

**Acceptance Criteria:**
- Admin can log in with valid credentials
- Invalid credentials show error message (UX § 5.4.2)
- Token refresh happens automatically
- Logout clears session and redirects to login
- Form validation uses zod schema
- Keyboard navigation works (UX § 5.4.4)

---

### 3. Dashboard / KPIs Overview
**Reference:** Design Doc § 3.3 (Dashboard Overview)

**Page:** `/dashboard` (default landing)

**Components:**
- [ ] KPI card component (metric name, value, trend)
- [ ] Grid layout for KPI cards (responsive)
- [ ] Skeleton loaders while fetching (UX § 5.4.5)
- [ ] Auto-refresh every 60 seconds

**KPIs to Display:**
- Total users
- Total vehicles
- Active reminders
- Recent registrations (last 7/30 days)
- Top 10 makes chart

**Acceptance Criteria:**
- Dashboard loads within 2s (Design Doc § 3)
- All KPIs display correct values from API
- Responsive grid (mobile/tablet/desktop per UX § 5.3.7)
- Skeleton loaders show during fetch
- Auto-refresh works without flicker
- Accessibility: proper ARIA labels (UX § 5.4.4)

---

### 4. User Management
**Reference:** Design Doc § 3.3 (User Management)

**Page:** `/users`

**Components:**
- [ ] User list table (paginated, sortable)
- [ ] Filters: role (OWNER/ADMIN), status (active/inactive), last login
- [ ] User detail modal/page
- [ ] Activate/deactivate user action
- [ ] View user's vehicles (inline or modal)

**Acceptance Criteria:**
- Table shows users with pagination controls
- Filters work and update query params
- Activate/deactivate toggles status with confirmation
- Success/error toasts on actions (UX § 5.4.2)
- Keyboard accessible table navigation
- Mobile-friendly responsive table or cards

---

### 5. Vehicle Catalog Management
**Reference:** Design Doc § 3.3, Phase 1 (catalog endpoints)

**Pages:**
- [ ] `/catalog` - Catalog list/search
- [ ] `/catalog/new` - Add new catalog vehicle
- [ ] `/catalog/:id/edit` - Edit catalog vehicle

**Components:**
- [ ] Catalog search/filter (type, make, model, year)
- [ ] Catalog table/card view (responsive)
- [ ] Catalog form (react-hook-form + zod)
  - Fields: type, make, model, year, trim, engine, transmission, fuel, body_type, specs (JSONB)
- [ ] Default thumbnail upload component (presigned URL)
- [ ] Delete catalog entry (with confirmation modal)

**Acceptance Criteria:**
- Search/filter updates results dynamically
- Form validation prevents duplicate entries
- Thumbnail upload shows progress bar
- Uploaded thumbnails display in table/cards
- CRUD operations show success/error feedback
- Minimum tap target 44px (UX § 5.3)
- Keyboard navigation works throughout

---

### 6. Service Center Management
**Reference:** Design Doc § 3.3 (Service Center Management)

**Pages:**
- [ ] `/service-centers` - Center list
- [ ] `/service-centers/new` - Add new center
- [ ] `/service-centers/:id/edit` - Edit center

**Components:**
- [ ] Service center list (with map view option)
- [ ] Service center form:
  - Fields: name, address, city, phone, email, website, certified
  - Geocode button (fetch lat/lon from address)
- [ ] Map integration (Google Maps or alternative)
  - Display center markers
  - Click marker to view details
- [ ] Delete center (with confirmation)

**Acceptance Criteria:**
- List shows all centers with filters (city, certified)
- Geocode button populates lat/lon fields
- Map displays markers for all centers
- Form validation enforces required fields
- CRUD actions show feedback toasts
- Map accessible with keyboard (fallback list view)

---

### 7. News, Events & Recalls Management
**Reference:** Design Doc § 3.3, Phase 1

**Pages:**
- [ ] `/news` - News list
- [ ] `/news/new` - Create news item
- [ ] `/news/:id/edit` - Edit news item

**Components:**
- [ ] News list table/cards (filter by type, make/model, published status)
- [ ] News form:
  - Fields: title, content (rich text editor), type, make, model, year_min, year_max, published_at
  - Rich text editor (TipTap or similar)
- [ ] Publish/unpublish toggle
- [ ] Delete news item (with confirmation)

**Acceptance Criteria:**
- Rich text editor supports formatting (bold, links, lists)
- Content sanitization prevents XSS
- Filters work (type, make/model, published)
- Publication date controls visibility
- CRUD feedback via toasts
- Responsive layout for editor (UX § 5.3.7)

---

### 8. Video Management (Per Catalog Vehicle)
**Reference:** Phase 1 (video endpoints)

**Integration:** Within catalog vehicle edit page

**Components:**
- [ ] Video list (under catalog vehicle details)
- [ ] Add video form (title, video_url, display_order)
- [ ] Video URL validation (YouTube/Vimeo)
- [ ] Thumbnail preview (auto-fetched)
- [ ] Reorder videos (drag-and-drop or up/down buttons)
- [ ] Delete video (with confirmation)

**Acceptance Criteria:**
- Videos listed in display order
- Add video validates URL format
- Thumbnails auto-populate
- Reorder updates display_order
- Delete removes video with feedback

---

### 9. Audit Logs Viewer
**Reference:** Design Doc § 3.3 (Audit Logs)

**Page:** `/audit-logs`

**Components:**
- [ ] Audit log table (paginated)
- [ ] Filters: entity type, user, date range, action (CREATE/UPDATE/DELETE)
- [ ] Expandable row for diff details (JSONB)
- [ ] Export logs (CSV download - optional)

**Acceptance Criteria:**
- Table shows all logged actions
- Filters work and paginate correctly
- Diff displays before/after state clearly
- Date range picker functional
- Keyboard navigation supported

---

### 10. Broadcast Messages (Optional for MVP)
**Reference:** Phase 1 (broadcast endpoints)

**Page:** `/broadcast`

**Components:**
- [ ] Create broadcast form (title, message, filters, target)
- [ ] Broadcast history list
- [ ] Send broadcast confirmation modal
- [ ] Status indicator (pending/sent)

**Acceptance Criteria:**
- Form allows JSONB filter editing (simple JSON input)
- Send button triggers confirmation
- History shows past broadcasts with status
- Feedback on send success/failure

---

### 11. Shared UI Components
**Library:** `@motorghar/shared-ui`

**Components to build:**
- [ ] Button (primary, secondary, danger variants per UX § 5.1)
- [ ] Input (text, email, password with validation states)
- [ ] Select (dropdown with search)
- [ ] Textarea
- [ ] Modal/Dialog
- [ ] Toast/Notification
- [ ] Table (sortable, paginated)
- [ ] Card
- [ ] Skeleton loader
- [ ] Spinner/Loading indicator
- [ ] Confirmation dialog
- [ ] Date picker
- [ ] File upload (with progress)

**Acceptance Criteria:**
- All components follow UX Specs § 5
- Fully accessible (ARIA labels, keyboard nav)
- Theme colors from UX § 5.1
- Storybook stories for each component (optional but recommended)
- TypeScript props fully typed

---

### 12. Accessibility & Responsive Design
**Reference:** UX Specs § 5.4, Constitution § 6

**Requirements:**
- [ ] All pages tested at 360px, 768px, 1280px (UX § 5.3.7)
- [ ] Keyboard navigation works throughout
- [ ] Color contrast meets WCAG AA (UX § 5.4.4)
- [ ] Semantic HTML used
- [ ] Focus indicators visible
- [ ] Screen reader tested (basic flows)
- [ ] ARIA labels on interactive elements

**Acceptance Criteria:**
- All critical flows navigable via keyboard
- No color-only information conveyance
- Focus states visible and logical
- Mobile-first responsive layouts work

---

### 13. Error Handling & Loading States
**Reference:** UX Specs § 5.4.5, 5.4.6

**Requirements:**
- [ ] Skeleton loaders for all data fetching
- [ ] Error boundaries for React components
- [ ] Network error handling (retry option)
- [ ] 404 page for unknown routes
- [ ] Empty states for lists (no data)
- [ ] Form validation errors inline

**Acceptance Criteria:**
- Loading states prevent blank screens
- Errors show actionable messages + retry
- Empty states have helpful messaging
- Form errors appear next to fields

---

## Testing Requirements
**Reference:** Constitution § 3

- [ ] **Unit tests:** Component logic ≥80% coverage
- [ ] **E2E tests (Playwright):** Critical admin flows:
  - Login → Dashboard → Add catalog vehicle → Upload thumbnail
  - Login → Add service center → Geocode → Save
  - Login → Create news item → Publish
  - Login → View audit logs → Filter

---

## Performance Targets
**Reference:** Design Doc § 3, UX § 5.4.5

- [ ] Initial page load <2s (Design Doc § 4)
- [ ] Route transitions <500ms
- [ ] Vite code-splitting for routes
- [ ] Image lazy loading
- [ ] TanStack Query caching reduces API calls

---

## Task Breakdown

### T2.1: App Setup & Layout
- Vite + React + TypeScript scaffold
- TanStack Router + Query setup
- Tailwind + theme configuration
- Layout component with nav
- **Test:** App runs, routing works

### T2.2: Shared UI Component Library
- Build all components in `@motorghar/shared-ui`
- Accessibility & theming
- **Test:** Component unit tests, visual regression (optional)

### T2.3: Authentication Pages
- Login page + form
- Session management
- **Test:** E2E login flow

### T2.4: Dashboard KPIs
- KPI cards + grid layout
- API integration with TanStack Query
- **Test:** Dashboard E2E, responsive layout

### T2.5: User Management
- User list + filters
- User detail + status actions
- **Test:** E2E user management flow

### T2.6: Catalog Management
- Catalog list/search
- Catalog form + CRUD
- Thumbnail upload
- **Test:** E2E catalog CRUD + upload

### T2.7: Service Center Management
- Center list + map view
- Center form + geocoding
- **Test:** E2E center CRUD + map interaction

### T2.8: News Management
- News list + filters
- News form with rich text editor
- Publish/unpublish
- **Test:** E2E news CRUD + publish

### T2.9: Video Management
- Video list within catalog edit
- Add/reorder/delete videos
- **Test:** E2E video management

### T2.10: Audit Logs Viewer
- Audit log table + filters
- Diff display
- **Test:** E2E audit log viewing

### T2.11: Broadcast Messages (Optional)
- Broadcast form + history
- **Test:** E2E broadcast creation

### T2.12: Accessibility & Responsive Testing
- Test at all breakpoints
- Keyboard navigation audit
- Screen reader basic test
- **Test:** Accessibility audit passes

### T2.13: E2E Test Suite
- Playwright tests for all critical flows
- **Test:** All E2E tests pass

---

## Definition of Done
- [ ] All pages implemented and functional
- [ ] All E2E tests pass
- [ ] Accessibility audit passed (keyboard nav, contrast, ARIA)
- [ ] Responsive at 360px, 768px, 1280px
- [ ] Bilingual support verified (English/Nepali)
- [ ] Performance targets met (load <2s, transitions <500ms)
- [ ] README updated with admin console usage guide

---

## Open Questions
- Preferred rich text editor library (TipTap vs Quill vs Lexical)?
- Map provider confirmation (Google Maps vs Mapbox vs Leaflet)?
- CSV export for audit logs required in MVP?

---

## Estimated Effort
**10-14 days** (frontend development + comprehensive E2E testing)
