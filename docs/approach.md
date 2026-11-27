# Approach

## Core Philosophy

SmartRoster treats roster generation as a constraint satisfaction problem with explicit conflict reporting rather than silent failure. The system optimizes for transparency and control over perfect automation.

## Scheduling Engine Design

The engine runs five sequential phases:

1. **Demand Calculation**: Scan operating rules and coverage overrides to build a date-keyed map of required headcount per brand-process
2. **Availability Marking**: Layer leaves, comp-offs, fixed weekly offs, and holidays onto employee calendars
3. **Weekly-Off Planning**: For each rolling 7-day window, assign one off per employee favoring preferred weekday when demand is lowest
4. **Working Day Assignment**: Match employees to assignments based on allocation percentage and brand-process demand
5. **Validation & Repair**: Run 9 validators (coverage, leave clashes, weekly-off violations, fairness), attempt local repairs via same-pod swaps

Each phase is pure logic with no database calls. Data loads once upfront then schedules run entirely in memory for speed and testability.

## Conflict-First Design

Insufficient coverage never hides behind "best effort" assignments. Every gap, overlap, or fairness issue emits a structured conflict with severity (ERROR blocks publish, WARNING is advisory), unique code, human message, and ranked suggestions.

The UI surfaces conflicts in a filterable drawer. Suggested actions include specific employee names, dates, and impact estimates. Operators choose which suggestions to apply; the system never forces automated changes without review.

## Single-Resource Brand Handling

The generator identifies sole owners by counting assignments. When a sole owner has approved leave overlapping operating days, validator emits SOLE_OWNER_UNAVAILABLE with backup suggestions ranked by pod proximity and skill overlap. Multi-employee brands allow staggered offs but validate total staffing meets minimum coverage.

## Why Not Optimization Solvers?

Linear programming or constraint programming would find global optima but sacrifice explainability. When conflicts arise, operators need to understand why and how to fix them. Rule-based generation with explicit conflict messages delivers better operator experience than black-box solutions that "fail to converge."

## Scaling Considerations

Current implementation handles 32 employees across 20 brands generating 1,920 entries in under 2 seconds. For 100+ employees:
- Virtualize roster grid rendering
- Add Redis caching for coverage demand maps
- Materialize weekly aggregate views
- Background job scheduling with progress tracking

Core algorithm remains linear; bottleneck shifts to database queries and UI rendering.
