# Phase 4: My Garage (Owner Portal) - Frontend & UX

**Status:** Not Started
**Prerequisites:** Phase 3 complete
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md) § 3.2, 9
**UX Standards:** [UX Specs](./ux_specs.md)
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Objectives
- Build complete Owner Portal React application ("My Garage")
- Implement vehicle lifecycle management with intuitive UX
- Enable document vault, service tracking, and reminders
- Ensure mobile-first, responsive, accessible design

---

## Deliverables

### 1. Owner Portal App Setup
**Reference:** Design Doc § 9 (Frontend UX Notes), UX Specs § 5

**App:** `apps/garage-portal` (React + Vite + TypeScript)

- [ ] Vite + React + TypeScript configuration
- [ ] TanStack Router setup with route definitions
- [ ] TanStack Query configuration (API caching)
- [ ] Tailwind CSS with theme from UX Specs § 5.1
- [ ] react-i18next integration (using `@motorghar/shared-i18n`)
- [ ] Layout component (header + nav + content)
- [ ] Protected route wrapper (owner-only)

**Acceptance Criteria:**
- App builds and runs (`nx serve garage-portal`)
- Routing works for all owner pages
- Theme colors match UX Specs § 5.1
- Language toggle switches between English/Nepali
- Unauthorized users redirected to login

---

### 2. Authentication & Registration
**Reference:** Design Doc § 3.1, UX Specs § 5.4

**Pages:**
- [ ] Registration page (`/register`)
- [ ] Login page (`/login`)
- [ ] Logout functionality

**Components:**
- [ ] Registration form (email, password, name, phone - react-hook-form + zod)
- [ ] Login form (email/password)
- [ ] Password strength indicator (registration)
- [ ] Error states for validation/auth failures
- [ ] Loading states during submission
- [ ] JWT token storage (httpOnly cookie or localStorage)
- [ ] Auto-refresh token before expiry

**Acceptance Criteria:**
- User can register with valid email/password
- Email uniqueness validated (backend error shown)
- Password strength indicator works
- Login succeeds with valid credentials
- Token refresh happens automatically
- Logout clears session and redirects
- Form validation uses zod schema
- Keyboard navigation works (UX § 5.4.4)
- Mobile-friendly forms (UX § 5.3.7)

---

### 3. User Profile Management
**Reference:** Design Doc § 3.1

**Page:** `/profile`

**Components:**
- [ ] Profile form (name, phone, address, language preference)
- [ ] Password change form (old password, new password, confirm)
- [ ] Avatar upload (optional - future enhancement)
- [ ] Success/error feedback toasts

**Acceptance Criteria:**
- Profile updates save and reflect immediately
- Password change validates old password
- Language preference changes i18n immediately
- Form validation prevents invalid data
- Mobile-responsive layout

---

### 4. My Garage Dashboard
**Reference:** Design Doc § 3.2, UX § 5.4

**Page:** `/garage` (default landing after login)

**Components:**
- [ ] Vehicle card grid (responsive, 4:3 or 16:9 aspect ratio per § 18.6)
- [ ] Vehicle thumbnail (fallback chain: primary user → any user → catalog default → type placeholder)
- [ ] Quick info overlay: next service date, active reminders count
- [ ] Add vehicle button (primary CTA per UX § 5.1)
- [ ] Empty state (no vehicles yet - helpful messaging per UX § 5.4.6)
- [ ] Skeleton loaders during fetch (UX § 5.4.5)

**Acceptance Criteria:**
- Grid responsive at 360px, 768px, 1280px
- Thumbnails load with blur-up placeholder
- Fallback chain works correctly
- Empty state prompts user to add first vehicle
- Add button navigates to add vehicle form
- Skeleton loaders prevent blank screen

---

### 5. Add/Edit Vehicle
**Reference:** Design Doc § 3.2, 5.1 (vehicles table)

**Pages:**
- [ ] `/garage/add` - Add new vehicle
- [ ] `/garage/:id/edit` - Edit vehicle

**Components:**
- [ ] Vehicle form (react-hook-form + zod):
  - Catalog search/select (make, model, year, trim)
  - Registration number (optional)
  - Color, nickname
  - Mileage (numeric)
  - Condition (select: Excellent/Good/Fair/Poor)
  - Usage pattern (select: DAILY/OCCASIONAL/RARE)
  - Notes (textarea)
- [ ] Catalog search with autocomplete/dropdown
- [ ] Form validation (registration uniqueness)
- [ ] Success/error feedback

**Acceptance Criteria:**
- Catalog search finds matching vehicles
- Form validates all fields correctly
- Registration uniqueness error shown if duplicate
- Save creates/updates vehicle successfully
- Mobile-friendly form layout
- Keyboard navigation works

---

### 6. Vehicle Details View
**Reference:** Design Doc § 3.2, 18.6

**Page:** `/garage/:id`

**Sections/Components:**
- [ ] Vehicle header (thumbnail, make/model/year, nickname)
- [ ] Tabbed interface or sections:
  - **Overview:** basic info, mileage, condition, notes
  - **Gallery:** image carousel/lightbox (max 5 images per § 18.6)
  - **Documents:** document list with download links
  - **Service History:** service records timeline
  - **Reminders:** upcoming reminders list
  - **News & Recalls:** vehicle-specific news feed
- [ ] Edit vehicle button
- [ ] Delete vehicle button (with confirmation)

**Acceptance Criteria:**
- All sections load data correctly
- Gallery carousel works (prev/next, mark primary)
- Documents downloadable via presigned URLs
- Service history sorted by date (newest first)
- Reminders show countdown or overdue indicator
- News filtered by vehicle make/model/year
- Delete confirmation prevents accidental deletion
- Responsive layout (mobile tabs collapse to accordion)

---

### 7. Vehicle Image Gallery
**Reference:** Design Doc § 18.6

**Integration:** Within vehicle details page

**Components:**
- [ ] Image upload (drag-and-drop or file picker)
- [ ] Upload progress indicator
- [ ] Image preview grid (max 5 images)
- [ ] Lightbox/modal for full-size view
- [ ] Mark as primary action
- [ ] Delete image (with confirmation)
- [ ] File size validation (≤5 MB per § 18.4)
- [ ] MIME type validation (JPG/PNG/WEBP)

**Acceptance Criteria:**
- Upload works with progress bar
- Grid shows thumbnails (responsive)
- Lightbox displays full-size images
- Primary image badge visible
- Delete removes image with feedback
- Validation errors shown for oversized/invalid files
- Keyboard navigation in lightbox

---

### 8. Document Vault
**Reference:** Design Doc § 3.2, 18.3

**Integration:** Within vehicle details page

**Components:**
- [ ] Document list table/cards
- [ ] Document type badges (BLUEBOOK/INSURANCE/TAX/OTHER)
- [ ] Upload button → presigned URL flow
- [ ] Upload progress indicator
- [ ] Download button (presigned URL)
- [ ] Delete document (with confirmation)
- [ ] File size validation (≤10 MB per § 3.2)
- [ ] MIME validation (PDF/JPG/PNG)

**Acceptance Criteria:**
- Upload works via presigned URL with progress
- Document types labeled clearly
- Download opens presigned URL in new tab
- Delete removes document with feedback
- Validation prevents oversized/invalid files
- Empty state shown when no documents
- Mobile-friendly list/card layout

---

### 9. Service History Tracking
**Reference:** Design Doc § 3.2

**Integration:** Within vehicle details page

**Components:**
- [ ] Service history timeline/list (sorted by date DESC)
- [ ] Add service record form (modal or page):
  - Date picker
  - Service center select (optional, searchable)
  - Odometer (numeric, validated >= last record)
  - Cost (numeric)
  - Notes (textarea)
  - Rating (1-5 stars, optional)
- [ ] Edit service record
- [ ] Delete service record (with confirmation)
- [ ] Empty state (no service records yet)

**Acceptance Criteria:**
- Timeline displays services chronologically
- Add form validates odometer progression
- Service center searchable/selectable
- Rating shown as stars
- Cost formatted as currency
- Edit/delete work with feedback
- Mobile-friendly form and list

---

### 10. Reminders & Notifications
**Reference:** Design Doc § 3.2, 8

**Integration:** Within vehicle details page + dashboard

**Components:**
- [ ] Reminders list (sorted by due_date ASC)
- [ ] Add reminder form (modal or page):
  - Type select (SERVICE/INSURANCE/EMI/CUSTOM)
  - Title (text)
  - Due date (date picker)
- [ ] Reminder status badge (PENDING/SENT/DISMISSED)
- [ ] Dismiss button (changes status to DISMISSED)
- [ ] Edit reminder
- [ ] Delete reminder (with confirmation)
- [ ] Dashboard reminder widget (upcoming reminders across all vehicles)
- [ ] Overdue indicator (visual cue for past due dates)

**Acceptance Criteria:**
- Reminders sorted by due date
- Add form creates reminder successfully
- Status badges visible and accurate
- Dismiss updates status with feedback
- Dashboard widget shows cross-vehicle reminders
- Overdue reminders highlighted visually
- Mobile-friendly list and forms

---

### 11. Service Center Discovery
**Reference:** Design Doc § 3.2

**Page:** `/service-centers`

**Components:**
- [ ] Service center list/cards (paginated)
- [ ] Filters: city, certified
- [ ] Search by name
- [ ] Map view (Google Maps or alternative):
  - Display center markers
  - Click marker to view details
  - User location (if granted)
  - Nearby search (radius filter)
- [ ] Center detail modal/page (name, address, phone, website, hours)
- [ ] Save to favorites button (optional)

**Acceptance Criteria:**
- List shows all centers with filters
- Search works dynamically
- Map displays markers correctly
- Nearby search filters by radius (e.g., 5km, 10km)
- User location requested and used for nearby search
- Center details accessible from list/map
- Mobile-friendly map and list toggle

---

### 12. Service Scheduling
**Reference:** Design Doc § 3.2, Phase 3 (appointments)

**Integration:** Service center detail page + vehicle details

**Components:**
- [ ] Schedule appointment form (modal or page):
  - Service center select (or pre-filled from context)
  - Date/time picker
  - Service type (text or select)
  - Notes (textarea)
- [ ] Appointments list (upcoming/past)
- [ ] Appointment status badges (SCHEDULED/COMPLETED/CANCELLED)
- [ ] Cancel appointment (with confirmation)
- [ ] Complete appointment (updates status)

**Acceptance Criteria:**
- Schedule form validates date/time/center
- Appointments list sorted by scheduled_at
- Status updates work with feedback
- Cancel confirmation prevents accidental cancellation
- Integration with calendar (optional - add to Google Calendar)
- Mobile-friendly forms and list

---

### 13. News, Events & Recalls
**Reference:** Design Doc § 3.2

**Integration:** Vehicle details page + dedicated news page

**Pages:**
- [ ] `/garage/:id/news` - Vehicle-specific news (within vehicle details)
- [ ] `/news` - All news (global feed)

**Components:**
- [ ] News feed (cards or list)
- [ ] Type badges (NEWS/EVENT/RECALL)
- [ ] Date and source
- [ ] News detail modal/page (full content)
- [ ] Filter by type (NEWS/EVENT/RECALL)
- [ ] Empty state (no news yet)

**Acceptance Criteria:**
- Vehicle-specific news filtered by make/model/year
- Global feed shows all published news
- Type badges visually distinct (color-coded per type)
- Detail view shows full content (sanitized HTML)
- Filters update feed dynamically
- Mobile-friendly cards

---

### 14. Vehicle Notes
**Reference:** Design Doc § 3.2, Phase 3 (notes)

**Integration:** Within vehicle details page

**Components:**
- [ ] Notes list (sorted by created_at DESC)
- [ ] Add note form (textarea + save button)
- [ ] Edit note (inline or modal)
- [ ] Delete note (with confirmation)
- [ ] Timestamps displayed

**Acceptance Criteria:**
- Notes CRUD works with feedback
- Timestamps formatted clearly
- Empty state shown when no notes
- Mobile-friendly list and forms

---

### 15. Shared UI Components (Reuse from Phase 2)
**Library:** `@motorghar/shared-ui`

**Additional components for garage-portal:**
- [ ] Timeline component (for service history)
- [ ] Rating component (stars, 1-5)
- [ ] Date picker
- [ ] Map component wrapper (Google Maps or Leaflet)
- [ ] File upload with progress
- [ ] Image carousel/lightbox
- [ ] Badge (for document types, reminder status, news types)

**Acceptance Criteria:**
- All components follow UX Specs § 5
- Fully accessible (ARIA labels, keyboard nav)
- Theme colors from UX § 5.1
- TypeScript props fully typed

---

### 16. Accessibility & Responsive Design
**Reference:** UX Specs § 5.4, Constitution § 6

**Requirements:**
- [ ] All pages tested at 360px, 768px, 1280px (UX § 5.3.7)
- [ ] Keyboard navigation works throughout
- [ ] Color contrast meets WCAG AA (UX § 5.4.4)
- [ ] Semantic HTML used
- [ ] Focus indicators visible
- [ ] Screen reader tested (basic flows)
- [ ] ARIA labels on interactive elements
- [ ] Touch targets ≥44px (UX § 5.3)

**Acceptance Criteria:**
- All critical flows navigable via keyboard
- No color-only information conveyance
- Focus states visible and logical
- Mobile-first responsive layouts work
- Touch-friendly on mobile devices

---

### 17. Error Handling & Loading States
**Reference:** UX Specs § 5.4.5, 5.4.6

**Requirements:**
- [ ] Skeleton loaders for all data fetching
- [ ] Error boundaries for React components
- [ ] Network error handling (retry option)
- [ ] 404 page for unknown routes
- [ ] Empty states for lists (no data)
- [ ] Form validation errors inline
- [ ] Offline indicator (optional)

**Acceptance Criteria:**
- Loading states prevent blank screens
- Errors show actionable messages + retry
- Empty states have helpful messaging
- Form errors appear next to fields
- 404 page guides user back to garage

---

## Testing Requirements
**Reference:** Constitution § 3

- [ ] **Unit tests:** Component logic ≥80% coverage
- [ ] **E2E tests (Playwright):** Critical owner flows:
  - Register → Login → Add vehicle → Upload document → Add service record
  - Login → Add reminder → View dashboard
  - Login → Upload vehicle image → Set primary
  - Login → Search service centers → Schedule appointment
  - Login → View news for vehicle

---

## Performance Targets
**Reference:** Design Doc § 3, UX § 5.4.5

- [ ] Initial page load <2s (Design Doc § 4)
- [ ] Route transitions <500ms
- [ ] Vite code-splitting for routes
- [ ] Image lazy loading
- [ ] Document/image upload progress indicators
- [ ] TanStack Query caching reduces API calls
- [ ] Optimistic updates for notes/service records

---

## Task Breakdown

### T4.1: App Setup & Layout
- Vite + React + TypeScript scaffold
- TanStack Router + Query setup
- Tailwind + theme configuration
- Layout component with nav
- **Test:** App runs, routing works

### T4.2: Authentication & Registration
- Registration + login pages
- Session management
- **Test:** E2E registration and login flow

### T4.3: Profile Management
- Profile form + password change
- **Test:** E2E profile update

### T4.4: My Garage Dashboard
- Vehicle card grid + thumbnails
- Empty state
- **Test:** E2E dashboard load, responsive layout

### T4.5: Add/Edit Vehicle
- Vehicle form with catalog search
- **Test:** E2E add/edit vehicle flow

### T4.6: Vehicle Details View
- Details page with tabs/sections
- Overview, gallery, documents, service, reminders, news
- **Test:** E2E vehicle details load

### T4.7: Vehicle Gallery
- Image upload + carousel/lightbox
- Mark primary, delete
- **Test:** E2E image upload + primary setting

### T4.8: Document Vault
- Document upload + download + delete
- **Test:** E2E document upload and download

### T4.9: Service History
- Service timeline/list + CRUD forms
- **Test:** E2E add/edit service record

### T4.10: Reminders
- Reminder list + CRUD forms
- Dashboard reminder widget
- **Test:** E2E add/dismiss reminder

### T4.11: Service Center Discovery
- Center list/map view
- Search + filters + nearby
- **Test:** E2E service center search and map

### T4.12: Service Scheduling
- Schedule appointment form + list
- **Test:** E2E schedule appointment

### T4.13: News Feed
- Vehicle-specific + global news
- **Test:** E2E news filtering

### T4.14: Vehicle Notes
- Notes CRUD
- **Test:** E2E add/edit/delete note

### T4.15: Shared UI Components
- Build additional components (timeline, rating, date picker, map, carousel)
- **Test:** Component unit tests

### T4.16: Accessibility & Responsive Testing
- Test at all breakpoints
- Keyboard navigation audit
- Screen reader basic test
- **Test:** Accessibility audit passes

### T4.17: E2E Test Suite
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
- [ ] README updated with garage portal usage guide

---

## Open Questions
- Preferred map library (Google Maps vs Mapbox vs Leaflet + OSM)?
- Calendar integration for appointments (Google Calendar API)?
- Offline mode support for MVP or future?

---

## Estimated Effort
**12-16 days** (frontend development + comprehensive E2E testing)
