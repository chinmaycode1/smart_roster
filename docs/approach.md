# Approach

SmartRoster is built as a production-ready demonstration of roster management for operations teams. The core challenge is scheduling employees across multiple D2C brands and processes while respecting hard constraints (leaves, fixed offs, minimum coverage) and optimizing for soft preferences (preferred off days, fairness, load balancing).

## Architecture Decisions

**Separation of concerns:** The scheduling engine lives in `backend/src/scheduling/` as pure functions over plain data types. It has no Express or Prisma imports. This makes it unit-testable, explainable, and reusable. The API layer translates database entities to engine types and back.

**Constraint classification:** Hard constraints (approved leaves, fixed offs, minimum coverage, max consecutive days) produce ERROR conflicts that block publishing. Soft constraints (preferred off days, fairness imbalance) produce WARNINGS. This distinction keeps the UI clear: red for blockers, yellow for advisories.

**Conflict-first design:** Conflicts are structured data with severity, code, message, and suggested actions. They are never hidden. The validator emits them explicitly, the suggester ranks fixes, and the UI presents them as actionable items. This builds trust: users see what's broken and why.

**Demand vs. availability:** Operating calendars answer "when must this brand-process be covered?" Employee calendars answer "when can this person work?" Keeping these separate prevents logic bugs where holiday closures or leave dates leak into demand calculations.

**Data-driven rules:** Operating rules, coverage overrides, and weekly-off patterns are database entities. Adding a new brand, process, or rule type requires no code deployment. This makes the system configurable by operations managers, not just engineers.

**Versioning and immutability:** Published rosters are immutable. Edits create a new version with a parent reference. This provides audit trails and rollback capability. Manual edits are marked with `isLocked=true`, which the generator respects as immutable anchors.

## Trade-offs

**Determinism over optimality:** The generator uses a greedy heuristic (most-constrained first) rather than constraint programming or simulated annealing. It runs in seconds and produces the same output for the same input. This is more debuggable and explainable than a black-box optimizer, though it may not find the globally optimal schedule.

**Conflict resolution is semi-automated:** The system suggests fixes but requires human approval. Full automation would risk silently making bad choices (e.g., overloading one employee because they're technically available). Operations teams know their people and context; the system makes the first 80% easy and transparent.

**Repair is local:** The current repair logic tries swaps within a constrained scope (same week, same pod). A global repair algorithm could find better solutions but would be harder to explain and slower to run.

**Monthly granularity:** The roster operates on calendar months. Some edge cases (e.g., a weekly-off cadence that spans month boundaries) are simplified. A rolling 28-day or 4-week model would handle this better but complicates the UI and reporting.

## Key Implementation Details

**Weekly-off planning:** Group dates into calendar weeks (Monday to Sunday). For each employee, assign one off per week. Prefer the employee's preferred day if slack allows (i.e., demand can be met by other assignees). Process employees in constraint order: single-resource brand owners first, then employees with fewest feasible days.

**Coverage demand:** For each brand-process and date, check the operating rule to see if it's a working day. If yes, start with `defaultMinCoverage`. Check coverage overrides: date-specific first, then weekday overrides. This produces a demand map keyed by `brandProcessId` and `dateKey`.

**Validation:** Each rule is a function: `(entries, context) => Conflict[]`. Rules check duplicate entries, missing coverage, weekly-off violations, leave clashes, and fairness imbalances. The validator composes them and deduplicates conflicts by key.

**Change impact:** When a user adds or approves a leave, the system runs a speculative validation on the modified roster without committing. It returns the new conflicts and a diff of affected dates. The UI shows this as a preview modal: "Approving this leave will create 2 coverage gaps. Apply suggested fix?"

## Testing Strategy

**Scheduling engine:** Unit tests with Vitest for pure functions. Test edge cases: single-resource brand on leave, minimum coverage of 2 with 2 employees, max consecutive days violation, preferred off day unavailable, overlapping assignments.

**API integration:** Test roster generation and manual edit endpoints with a seeded database. Assert that conflicts are returned with correct severity and suggested actions.

**Frontend:** Manual testing for MVP, Playwright E2E for production. Test flows: generate roster, approve leave, see conflict, apply suggestion, publish roster.

## Future Enhancements

- **Shift-level scheduling:** Add shift start/end times and enforce no overlaps for the same employee.
- **Fairness optimization:** Track and minimize variance in weekend/holiday work and preferred-day misses across the team.
- **Global repair:** Exhaustive search within a time budget for multi-step swaps that resolve clusters of conflicts.
- **Approval workflow:** Multi-stage review (pod lead → operations manager) with comments and notifications.
- **Real-time collaboration:** WebSocket updates when another user edits the roster, preventing overwrite conflicts.
