# Phase 5: Marketplace (Stretch Goal)

**Status:** Not Started (Post-MVP)
**Prerequisites:** Phases 0-4 complete
**Reference:** [Solution Design v1.0](./motor_ghar_mvp_solution_design_v_1.md) § 1.2 (Non-Goals for MVP)
**Constitution:** [Project Constitution](./motor_ghar_constitution.md)

---

## Objectives
- Enable vehicle listings marketplace (buy/sell)
- Support buyer discovery and search
- Implement messaging between buyers and sellers
- Add inspection workflow (optional)

---

## Important Note
This phase is **out of scope for MVP** per Design Doc § 1.2. It is documented here as a future enhancement to guide architectural decisions that should remain marketplace-aware (e.g., vehicle ownership transfers, listing states, buyer personas).

---

## Deliverables (High-Level)

### 1. Data Model Additions

**New Tables (migrations required):**

```sql
-- marketplace_listings
id UUID PK
vehicle_id UUID FK -> vehicles ON DELETE CASCADE
seller_id UUID FK -> users
listing_type ENUM('SALE','LEASE') DEFAULT 'SALE'
price NUMERIC(12,2) NOT NULL
negotiable BOOLEAN DEFAULT true
description TEXT NOT NULL
mileage_at_listing INTEGER NOT NULL
condition_notes TEXT NULL
status ENUM('DRAFT','ACTIVE','SOLD','EXPIRED','REMOVED') DEFAULT 'DRAFT'
published_at TIMESTAMP NULL
expires_at TIMESTAMP NULL
view_count INTEGER DEFAULT 0
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()

INDEX: (status, published_at DESC)
INDEX: (seller_id, status)

-- listing_inquiries (buyer-seller messaging)
id UUID PK
listing_id UUID FK -> marketplace_listings
buyer_id UUID FK -> users
seller_id UUID FK -> users
message TEXT NOT NULL
status ENUM('OPEN','CLOSED') DEFAULT 'OPEN'
created_at TIMESTAMP DEFAULT now()

INDEX: (listing_id, created_at DESC)
INDEX: (buyer_id, created_at DESC)
INDEX: (seller_id, created_at DESC)

-- inspection_requests (optional workflow)
id UUID PK
listing_id UUID FK -> marketplace_listings
buyer_id UUID FK -> users
requested_date TIMESTAMP NOT NULL
status ENUM('PENDING','APPROVED','COMPLETED','CANCELLED') DEFAULT 'PENDING'
inspection_report JSONB NULL
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()
```

**Schema Additions to Existing Tables:**
- `users.role` → add `BUYER` and `SELLER` roles (or just BUYER; SELLER = OWNER who lists)
- `vehicles.ownership_history` JSONB → track ownership transfers (optional)

---

### 2. Backend APIs

**New Endpoints:**

**Seller Workflows:**
- `POST /marketplace/listings` - Create listing from owned vehicle
- `PUT /marketplace/listings/:id` - Update listing
- `PUT /marketplace/listings/:id/publish` - Publish listing (set published_at)
- `PUT /marketplace/listings/:id/expire` - Expire or remove listing
- `GET /marketplace/my-listings` - Seller's listings
- `GET /marketplace/listings/:id/inquiries` - View buyer inquiries

**Buyer Workflows:**
- `GET /marketplace/listings` - Search/browse active listings (paginated, filterable)
- `GET /marketplace/listings/:id` - View listing details (increments view_count)
- `POST /marketplace/listings/:id/inquire` - Send inquiry to seller
- `POST /marketplace/listings/:id/inspection` - Request inspection
- `GET /marketplace/my-inquiries` - Buyer's inquiries

**Messaging (basic):**
- `GET /marketplace/messages/:listing_id` - Thread between buyer/seller
- `POST /marketplace/messages/:listing_id` - Send message

**Search & Filters:**
- Filters: make, model, year range, price range, mileage, condition, location (city)
- Sorting: price ASC/DESC, date DESC, mileage ASC
- Full-text search: title/description (pg_trgm or Elasticsearch)

---

### 3. Frontend - Buyer Portal

**App:** `apps/buyer-portal` (React + Vite + TypeScript)

**Pages:**
- `/marketplace` - Listing search/browse with filters and map view
- `/marketplace/:id` - Listing details with image gallery, seller info, inquiry form
- `/my-inquiries` - Buyer's inquiry history
- `/inspections` - Buyer's inspection requests

**Components:**
- Listing card grid (responsive)
- Advanced search/filter sidebar
- Map view with listing markers
- Listing detail with image carousel
- Inquiry form (modal or inline)
- Inspection request form
- Messaging thread UI (buyer-seller)

---

### 4. Frontend - Seller Workflows (Garage Portal Extension)

**Integration:** Extend `apps/garage-portal`

**Pages:**
- `/garage/:id/list` - Create listing for owned vehicle
- `/garage/:id/listing` - Manage active listing
- `/my-listings` - All seller's listings

**Components:**
- Create listing form (price, description, photos, expiry)
- Listing status management (publish, expire, remove)
- Inquiry inbox (view/respond to buyer messages)
- Inspection approval workflow

---

### 5. Search & Discovery Enhancements

**Implementation Options:**
- **PostgreSQL pg_trgm:** For moderate scale, trigram search on description/title
- **Elasticsearch:** For advanced search (fuzzy matching, faceted filters, geo-radius)

**Search Features:**
- Autocomplete on make/model
- Faceted filters (price ranges, mileage buckets, year ranges)
- Saved searches (email alerts for new listings)
- Geo-radius search (find listings near user location)

---

### 6. Messaging System

**Architecture:**
- Simple RESTful messaging for MVP
- Future: WebSocket or SSE for real-time updates

**Features:**
- Thread-based messaging per listing
- Unread message count
- Email notifications for new inquiries (seller)
- Spam/abuse reporting

---

### 7. Inspection Workflow (Optional)

**Process:**
1. Buyer requests inspection for a listing
2. Seller approves/denies request
3. If approved, inspection scheduled (3rd party or self-inspection)
4. Inspection report uploaded (JSONB or PDF)
5. Buyer reviews report before purchase decision

**Integration:**
- 3rd-party inspection service API (future)
- Internal inspection checklist tool (basic form)

---

### 8. Payment & Escrow (Out of Scope for Phase 5, Future Enhancement)

**Considerations:**
- Partner with payment gateway (e.g., eSewa, Khalti for Nepal)
- Escrow service for secure transactions
- Commission model for MotorGhar (future monetization)

---

## Testing Requirements
- **Unit tests:** All marketplace services ≥80% coverage
- **Integration tests:** All endpoints with test containers
- **E2E tests:** Critical marketplace flows:
  - Seller: Create listing → Publish → Receive inquiry → Respond
  - Buyer: Search listings → View details → Send inquiry → Request inspection

---

## Performance Targets
- Listing search: P50 <300ms (with indexes/caching)
- Listing detail load: P50 <200ms
- Map view with markers: <1s for 100 listings
- Search with filters: keyset pagination, max 50 results

---

## Open Questions
- Full-text search provider (PostgreSQL vs Elasticsearch)?
- Real-time messaging architecture (WebSocket vs polling)?
- Inspection partner integration requirements?
- Payment gateway and escrow provider selection?
- Listing approval/moderation workflow (admin review before publish)?
- Vehicle ownership transfer mechanism (tie to DoTM integration)?

---

## Estimated Effort
**20-30 days** (backend + buyer portal + seller workflows + testing + search optimization)

---

## Notes
- This phase requires careful planning around data privacy (seller contact info)
- Anti-fraud measures needed (duplicate listings, spam detection)
- Moderation tools for flagged listings
- Analytics for listing performance (view count, inquiry count, conversion rate)
- SEO optimization for listing pages (meta tags, sitemaps)

---

## Definition of Done (when implemented)
- [ ] All marketplace endpoints functional and tested
- [ ] Buyer portal app built and deployed
- [ ] Seller workflows integrated into garage portal
- [ ] Search and filtering performant
- [ ] Messaging system operational
- [ ] E2E tests pass for critical marketplace flows
- [ ] Performance targets met
- [ ] Security review passed (PII protection, anti-spam)
- [ ] README updated with marketplace feature guide
