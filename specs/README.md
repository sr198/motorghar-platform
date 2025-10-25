# MotorGhar Specifications

This directory contains product and technical specifications for the MotorGhar platform.

## Directory Structure

- **Product Requirements:** `motor_ghar_mvp_solution_design_v_1.md`
- **Phase Implementation Plans:**
  - `phase_0_infrastructure.md` - Database, Docker, shared libraries
  - `phase_1_admin_backend.md` - Admin API implementation
  - `phase_2_admin_frontend.md` - Admin console UI
  - `phase_3_garage_backend.md` - Owner portal backend
  - `phase_4_garage_frontend.md` - Owner portal UI
  - `phase_5_marketplace.md` - Marketplace features
- **Implementation Roadmap:** `implementation_roadmap.md`
- **UX Specifications:** `ux_specs.md`

## Important References

### Project Rules & Memory
All project rules, patterns, and lessons learned are now in the `/memory/` directory:

- **`/memory/constitution.md`** ⭐ - **READ THIS FIRST**
  - Non-negotiable project rules
  - Code quality standards
  - Testing requirements
  - Configuration guidelines
  - Hardcoding policies

- **`/memory/zod-patterns.md`** - Zod validation patterns and gotchas
- **`/memory/`** - All project knowledge base

**Rule:** Before implementing ANY spec, read `/memory/constitution.md` sections 1-10.

## How to Use These Specs

### For Developers
1. **Read the constitution first:** `/memory/constitution.md`
2. **Choose your phase:** Start with phase_0, then move sequentially
3. **Review the design:** Understand the solution design document
4. **Implement according to rules:** Follow constitution sections 1-10
5. **Update memory:** Document new patterns in `/memory/`

### For AI Agents
1. **Load constitution:** Read `/memory/constitution.md` at task start
2. **Load relevant spec:** Only the phase currently being worked on
3. **Check compliance:** Verify against constitution rules
4. **Update documentation:** Create or update files in `/docs/` when done
5. **Update memory:** Add patterns to `/memory/` when discovered

### For Code Reviews
- Verify implementation matches spec
- Check constitution compliance (especially sections 3, 4, 10)
- Ensure tests are present
- Confirm no hardcoded values
- Validate memory files are updated

## Specification Status

| Phase | Status | Documentation |
|-------|--------|---------------|
| Phase 0: Infrastructure | ✅ Complete | `/docs/PHASE_0_IMPLEMENTATION.md` |
| Phase 1: Admin Backend | 📋 Planned | `phase_1_admin_backend.md` |
| Phase 2: Admin Frontend | 📋 Planned | `phase_2_admin_frontend.md` |
| Phase 3: Garage Backend | 📋 Planned | `phase_3_garage_backend.md` |
| Phase 4: Garage Frontend | 📋 Planned | `phase_4_garage_frontend.md` |
| Phase 5: Marketplace | 📋 Planned | `phase_5_marketplace.md` |

## Key Principles (from Constitution)

1. **Specification-Driven Development** - Every change is driven by specs
2. **Test-First** - Write tests during implementation, not after
3. **Zero Hardcoding** - No magic values in source code
4. **Configuration over Code** - Environment variables for everything changeable
5. **Memory System** - Document patterns as you learn them

## Getting Help

- **Technical patterns:** Check `/memory/`
- **Implementation status:** Check `/docs/`
- **Project setup:** See `/docs/PHASE_0_IMPLEMENTATION.md`
- **Code questions:** Review the relevant phase spec

---

**Remember:** The constitution in `/memory/constitution.md` is the source of truth for how we work. Read it before every task.
