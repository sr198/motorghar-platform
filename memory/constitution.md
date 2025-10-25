# MotorGhar – Project Constitution (v1.1)

**Last Updated:** October 25, 2025
**Location:** `/memory/constitution.md`
**Related:** See `/memory/zod-patterns.md` for Zod-specific patterns

## 0. Purpose
This file defines non-negotiable rules for everyone and every AI agent working on MotorGhar. It travels with every task and PR.

---

## 1. Delivery Philosophy
- **Specification-Driven Development (SDD):** Every change is driven by a spec bundle (Requirements → Design/Rationale → Tasks).
- **Test-First:** Write or update tests before implementation. No feature is "done" without passing unit + integration tests; E2E where specified.
- **Small Batches:** Prefer thin vertical slices that ship behind flags if needed.
- **Minimal Context Principle:** Agents receive only the inputs required for the task at hand (no more, no less).
- **Single Source of Truth:** Product scope in PRD; solution/constraints in Solution Design; deviations require ADR.

---

## 2. Code Quality
- **SOLID + Clean Architecture:** Keep module boundaries explicit; do not reach across layers.
- **Types & Contracts:** TypeScript types and zod DTOs are canonical. OpenAPI snapshot tests prevent contract drift.
- **Observability-by-default:** Pino JSON logs with request ID; basic metrics counters on APIs touched.
- **Error Handling:** Explicit error types with stable error codes; never leak internals in messages.

---

## 3. Testing Requirements (per PR)
- **Unit:** New logic covered; ≥80% for touched core modules.
- **Integration:** API + DB via test containers when routes/data change.
- **E2E (Playwright):** Updated when user flows change.
- **Contract Tests:** Regenerate and diff OpenAPI on API changes.
- **Test Shared Libraries Immediately:** All shared libraries (config, utils, types) must have unit tests added during implementation, not deferred.

---

## 4. Security & Data
- **Least Privilege:** Respect RBAC in code and tests.
- **PII Minimization:** Only fields approved in PRD/Design; redact in logs.
- **Secrets:** Env only; never in repo. Assume public repo threat model.
- **Docs & Uploads:** Enforce MIME/size checks; virus-scan hook points kept in place even if stubbed.

---

## 5. Performance & Resilience
- **SLO Awareness:** Keep hot-read p50 under target; prove with measurements.
- **Indexes before Code:** Add DB indexes with migrations when queries slow.
- **Caching Discipline:** Read-through with TTL; write-invalidate on mutations.
- **Backpressure:** Add rate limits and timeouts at edges.

---

## 6. UX & i18n
- **Accessible First:** Keyboard navigation, contrast checks on changed UI.
- **Bilingual:** All user-facing strings go through shared i18n packages.
- **Copy is Spec'd:** Text changes live in specs before code.

---

## 7. Agent Operating Rules
- **Input Contract:** Each task receives: (a) task brief, (b) exact file(s) to edit or create, (c) relevant spec sections only, (d) acceptance criteria.
- **Output Contract:** Agents must return (a) diffs or files, (b) test updates, (c) a brief rationale referencing the spec, (d) any ADR proposals if design is impacted.
- **No Spec Creep:** If required info is missing, produce a single "Spec Gap" note with precise questions.

---

## 8. Definition of Done (per task)
- Code + tests merged and green
- Lint/type checks pass
- Docs updated (README or feature docs)
- Observability + security checks in place

---

## 9. Monorepo Structure
- The code monorepo is managed by **Nx**
- All major apps and shared libs are created using Nx generators
- **pnpm** is the package manager
- Since we are using pnpm, to define dependency add explit dependency to internal library in the caller's package.json
- Use `nx` command to run build, test, serve and others
- Always use Nx generators (`nx generate`) to create new libraries/apps - never create manually

---

## 10. Configuration & Hardcoding Rules ⚠️ NEW

### 10.1 Zero Hardcoded Values Policy
**Rule:** Source code must NEVER contain hardcoded values that need to change based on environment, deployment, or business logic.

**Categories:**

#### CRITICAL - Security & Environment (Externalize Immediately)
- ❌ **NEVER** hardcode: Passwords, API keys, secrets, tokens, credentials
- ❌ **NEVER** hardcode: Database URLs, service endpoints, external URLs
- ❌ **NEVER** hardcode: Environment-specific values (dev vs prod)
- ✅ **ALWAYS** use: Environment variables with validation
- ✅ **ALWAYS** use: `.env.example` templates with documentation

#### HIGH - Business Logic (Make Configurable)
- ❌ **AVOID** hardcoding: Rate limits, timeout values, retry counts
- ❌ **AVOID** hardcoding: Validation constraints (password length, file size limits)
- ❌ **AVOID** hardcoding: Pagination limits, page sizes
- ❌ **AVOID** hardcoding: Port numbers, URLs, bucket names
- ✅ **PREFER**: Environment variables with validation
- ✅ **PREFER**: Configuration objects with type safety

#### MEDIUM - Constants (Extract & Document)
- ❌ **AVOID** hardcoding: Regex patterns, MIME type lists, validation rules
- ❌ **AVOID** hardcoding: Provider options, enum-like values
- ❌ **AVOID** hardcoding: Default values scattered across files
- ✅ **PREFER**: Shared constants library (`@motorghar-platform/constants`)
- ✅ **PREFER**: Well-named, exported constants with JSDoc

#### List of Values (LOV) - Database-Driven
- ❌ **NEVER** hardcode: Vehicle makes/models, service centers, locations
- ❌ **NEVER** hardcode: User-manageable data, catalog items
- ❌ **NEVER** hardcode: Dynamic business data in seed files
- ✅ **ALWAYS** use: Database tables with admin CRUD
- ✅ **ACCEPTABLE** for MVP: Seed data in JSON files (not TypeScript)

### 10.2 Constants Library Pattern
When extracting hardcoded values:

```typescript
// ✅ GOOD - Centralized, named, documented
// libs/shared/constants/src/lib/validation.constants.ts
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 100;
export const PAGINATION_DEFAULT = 20;
export const PAGINATION_MAX = 50;

// ❌ BAD - Scattered magic numbers
password: z.string().min(8).max(100)
limit: z.number().max(50).default(20)
```

### 10.3 Environment Variable Pattern
```typescript
// ✅ GOOD - Validated, typed, with defaults
export const envSchema = z.object({
  PORT: z.string().default('3000').transform(Number),
  RATE_LIMIT: z.string().default('60').transform(Number),
});

// ❌ BAD - Direct process.env access without validation
const port = process.env.PORT || 3000;
```

### 10.4 Seed Data Pattern
```typescript
// ✅ GOOD - External JSON file
import vehicles from '../seed-data/vehicles.json';
const vehicleCatalog = vehicles;

// ❌ BAD - Hardcoded in TypeScript
const vehicleCatalog = [
  { make: "Toyota", model: "Corolla", ... },
  // ... 100 more entries
];
```

### 10.5 Docker Compose Pattern
```yaml
# ✅ GOOD - Environment variable substitution
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-changeme}

ports:
  - "${POSTGRES_PORT:-5432}:5432"

# ❌ BAD - Hardcoded credentials
environment:
  POSTGRES_PASSWORD: my_secret_password
```

### 10.6 Code Review Checklist for Hardcoding
Before any commit, verify:
- [ ] No passwords, tokens, or credentials in code
- [ ] No environment-specific URLs or endpoints
- [ ] All validation limits are constants or config
- [ ] All regex patterns are named and exported
- [ ] No magic numbers without clear purpose
- [ ] Seed data in JSON files, not TypeScript
- [ ] Docker credentials use env var substitution
- [ ] New file types/providers can be added via config

### 10.7 When Hardcoding is Acceptable
- Standard constants (HTTP status codes, standard ports)
- Framework conventions (NODE_ENV values)
- Mathematical constants (Math.PI)
- Type definitions and interfaces
- Enum values that are truly immutable system values (not business data)

---

## 11. Why We Made Mistakes (Lessons Learned)

### Issue: Hardcoded Values in Phase 0
**What happened:**
- Docker passwords hardcoded in docker-compose.yml
- Validation limits scattered across schemas
- Vehicle catalog hardcoded in seed.ts
- No tests written during implementation

**Root Causes:**
1. **Speed over Correctness:** Rushed to "make it work" without following constitution
2. **MVP Mindset Misapplied:** Confused "MVP" with "skip best practices"
3. **Not Applying Test-First:** Violated Section 3 - deferred testing
4. **Constitution Not Consulted:** Constitution existed but wasn't referenced during work

**Prevention:**
- **Before any implementation:** Read relevant constitution sections
- **During implementation:** Stop and ask "is this configurable?"
- **Before committing:** Run through hardcoding checklist
- **Memory files:** Document patterns as we learn them

### Issue: No Tests for Shared Libraries
**What happened:**
- Created config, utils, types libraries without tests
- Violated "Test-First" principle in Section 3

**Root Causes:**
1. **Deferred Testing:** Thought "we'll add tests later"
2. **Not Following Constitution:** Section 3 clearly requires tests immediately
3. **Misunderstanding Shared Libraries:** These are critical infrastructure, not optional

**Prevention:**
- Shared libraries MUST have tests before marking task complete
- If using Nx generator, add `--unitTestRunner=jest` flag
- Create test files immediately after creating source files
- Mark task "in_progress" until tests are added

---

## 12. Memory System

All project knowledge and patterns are documented in `/memory/`:

- **constitution.md** (this file) - Project rules and principles
- **zod-patterns.md** - Zod-specific patterns and gotchas
- **adr/** (future) - Architecture Decision Records
- **lessons-learned/** (future) - Retrospectives and improvements

**Rules for Memory:**
1. Update constitution when new rules are established
2. Document patterns immediately when discovered
3. Reference memory files in code reviews
4. Keep memory files updated with versions/dates

---

## 13. How to Use This Constitution

### For Developers
1. Read this file before starting any task
2. Reference relevant sections during implementation
3. Use as checklist during code review
4. Update when you discover new patterns

### For AI Agents
1. Load this file at task start
2. Check compliance before generating code
3. Reference sections in explanations
4. Propose constitution updates when gaps found

### For Code Reviews
1. Check each section is satisfied
2. Verify no hardcoded values
3. Confirm tests are present
4. Ensure memory files are updated

---

**End of Constitution v1.1**

Remember: These rules exist because we learned from mistakes. Follow them strictly, and update them when you discover better patterns.