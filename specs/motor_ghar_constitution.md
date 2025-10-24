# MotorGhar – Project Constitution (v1)

## 0. Purpose
This file defines non-negotiable rules for everyone and every AI agent working on MotorGhar. It travels with every task and PR.

## 1. Delivery Philosophy
- **Specification-Driven Development (SDD):** Every change is driven by a spec bundle (Requirements → Design/Rationale → Tasks).
- **Test-First:** Write or update tests before implementation. No feature is “done” without passing unit + integration tests; E2E where specified.
- **Small Batches:** Prefer thin vertical slices that ship behind flags if needed.
- **Minimal Context Principle:** Agents receive only the inputs required for the task at hand (no more, no less).
- **Single Source of Truth:** Product scope in PRD; solution/constraints in Solution Design; deviations require ADR.

## 2. Code Quality
- **SOLID + Clean Architecture:** Keep module boundaries explicit; do not reach across layers.
- **Types & Contracts:** TypeScript types and zod DTOs are canonical. OpenAPI snapshot tests prevent contract drift.
- **Observability-by-default:** Pino JSON logs with request ID; basic metrics counters on APIs touched.
- **Error Handling:** Explicit error types with stable error codes; never leak internals in messages.

## 3. Testing Requirements (per PR)
- **Unit:** New logic covered; ≥80% for touched core modules.
- **Integration:** API + DB via test containers when routes/data change.
- **E2E (Playwright):** Updated when user flows change.
- **Contract Tests:** Regenerate and diff OpenAPI on API changes.

## 4. Security & Data
- **Least Privilege:** Respect RBAC in code and tests.
- **PII Minimization:** Only fields approved in PRD/Design; redact in logs.
- **Secrets:** Env only; never in repo. Assume public repo threat model.
- **Docs & Uploads:** Enforce MIME/size checks; virus-scan hook points kept in place even if stubbed.

## 5. Performance & Resilience
- **SLO Awareness:** Keep hot-read p50 under target; prove with measurements.
- **Indexes before Code:** Add DB indexes with migrations when queries slow.
- **Caching Discipline:** Read-through with TTL; write-invalidate on mutations.
- **Backpressure:** Add rate limits and timeouts at edges.

## 6. UX & i18n
- **Accessible First:** Keyboard navigation, contrast checks on changed UI.
- **Bilingual:** All user-facing strings go through shared i18n packages.
- **Copy is Spec’d:** Text changes live in specs before code.

## 7. Agent Operating Rules
- **Input Contract:** Each task receives: (a) task brief, (b) exact file(s) to edit or create, (c) relevant spec sections only, (d) acceptance criteria.
- **Output Contract:** Agents must return (a) diffs or files, (b) test updates, (c) a brief rationale referencing the spec, (d) any ADR proposals if design is impacted.
- **No Spec Creep:** If required info is missing, produce a single “Spec Gap” note with precise questions.

## 8. Definition of Done (per task)
- Code + tests merged and green
- Lint/type checks pass
- Docs updated (README or feature docs)
- Observability + security checks in place
