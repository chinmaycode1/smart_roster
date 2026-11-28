# SmartRoster

A roster management system for operations teams managing Customer Support, Abandoned Cart Conversions, Retention, and NDR processes across multiple D2C brands. Built as a production-ready demonstration of scheduling logic, conflict detection, and clean architecture.

## Features

- **Intelligent Roster Generation**: Automated scheduling respecting leaves, weekly offs, and coverage requirements
- **Conflict Detection**: 7 validator rules detecting coverage gaps, leave clashes, and fairness violations
- **Local Repair**: Automated suggestions to resolve scheduling conflicts
- **Fairness Analysis**: Track weekend, holiday distribution across team
- **Multi-View Roster**: Employee, pod, brand, process, and company-wide views
- **Real-time Editing**: Click-to-edit cells with instant validation
- **CSV Export**: Export rosters for external analysis
- **Change Impact**: Preview what breaks before applying changes

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, Lucide Icons

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Zod validation, Vitest, Pino logging

**Database:** Supabase (hosted PostgreSQL) or local PostgreSQL via Docker

**DevOps:** Docker Compose, GitHub Actions CI

## Architecture

```mermaid
graph TB
    subgraph Frontend
        UI[React UI] --> Router[React Router]
        UI --> Query[TanStack Query]
        Query --> API[API Client]
    end

    subgraph Backend
        API --> Routes[Express Routes]
        Routes --> Controllers[Controllers]
        Controllers --> Services[Business Logic]
        Services --> Prisma[Prisma ORM]
        Services --> Engine[Scheduling Engine]
    end

    subgraph Scheduling Engine
        Engine --> Calendar[Operating & Employee Calendars]
        Engine --> Demand[Coverage Demand]
        Engine --> Generator[Roster Generator]
        Engine --> Validator[Conflict Validator]
        Engine --> Repair[Local Repair]
        Engine --> Fairness[Fairness Analyzer]
    end

    subgraph Database
        Prisma --> DB[(PostgreSQL)]
    end

    API -.HTTP.-> Routes
```

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local or Supabase)
- Docker and Docker Compose (optional, for local PostgreSQL)

### Quick Start with Docker Compose

```bash
# Clone and start database
git clone <repository-url>
cd smartroster
docker-compose up -d postgres

# Backend setup
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev

# Open http://localhost:5173
```

### Setup with Supabase

1. Create project at https://supabase.com
2. Get connection strings from Project Settings > Database
3. Configure backend/.env:
```env
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```
4. Run migrations and seed:
```bash
cd backend
npx prisma migrate deploy
npm run seed
npm run dev
```

## Running Tests

```bash
cd backend
npm run test
```

Currently 40 tests covering scheduling engine:
- Operating calendar rules (4 tests)
- Coverage demand with overrides (6 tests)
- Weekly-off planner (3 tests)
- Employee calendar (8 tests)
- Fairness analyzer (6 tests)
- Roster generator (7 tests)
- Validator rules (6 tests)

## Demo Scenarios

The seed data includes realistic scheduling challenges:

1. **Single-resource brand owner on leave**: EMP006 (Amit Joshi) has approved leave Dec 10-11, creating coverage gap
2. **Multi-employee brand**: PureTone Wellness requires min 2 employees on CS
3. **365-day process**: PureGlow Skincare operates all days including holidays
4. **Mixed calendars**: ActiveFit Gear has CS daily except holidays, ACC excludes Sundays
5. **Coverage overrides**: Higher minimum coverage on Fridays for ticket spikes

## API Endpoints

### Rosters
- `POST /api/rosters/generate` - Generate new roster
- `GET /api/rosters/:id` - Get roster details
- `GET /api/rosters/:id/entries` - Get roster entries
- `PUT /api/rosters/:id/entries/:entryId` - Update entry and re-validate
- `GET /api/rosters/:id/conflicts` - Get conflicts
- `POST /api/rosters/:id/repair` - Auto-repair conflicts
- `POST /api/rosters/:id/request-approval` - Request approval
- `POST /api/rosters/:id/approve` - Approve and publish
- `POST /api/rosters/:id/publish` - Publish roster
- `GET /api/rosters/:id/export/csv` - Export CSV

### Reports
- `GET /api/reports/fairness/:rosterId` - Fairness report
- `GET /api/reports/coverage/:rosterId` - Coverage report

### Availability
- `GET /api/leaves` - List leaves (filter by employeeId, status)
- `POST /api/leaves` - Create leave
- `PUT /api/leaves/:id` - Update leave (including status approval)
- `DELETE /api/leaves/:id` - Delete leave
- `GET /api/holidays` - List public holidays
- `POST /api/holidays` - Create holiday
- `DELETE /api/holidays/:id` - Delete holiday
- `GET /api/comp-offs` - List comp-offs (filter by employeeId)
- `POST /api/comp-offs` - Create comp-off
- `PUT /api/comp-offs/:id` - Update comp-off
- `DELETE /api/comp-offs/:id` - Delete comp-off

### CRUD
- `/api/employees`, `/api/pods`, `/api/processes`, `/api/brands` - Standard CRUD with PUT and DELETE
- `/api/dashboard/summary` - Dashboard stats

## Assumptions

1. Weekly offs are soft during generation but hard once assigned
2. Approved leaves and comp-offs are immutable
3. Fixed weekly-off patterns are hard constraints
4. Brand-process is the unit of coverage
5. Working on holiday earns comp-off credit
6. Conflicts are never hidden
7. Roster versions are immutable once published
8. All dates in UTC, displayed in local context
9. Minimum coverage is per brand-process per day
10. Same-pod employees can substitute more easily

## Assessment Answers

### 1. Data Model

Employee → Pod (team structure). Brand + Process → BrandProcess (coverage unit). Assignment links employees to brand-processes with allocation percentage and primary/secondary roles. OperatingRule defines when coverage is needed (ALL_365, DAILY_EXCEPT_HOLIDAYS, EXCEPT_SUNDAYS_AND_HOLIDAYS, CUSTOM_WEEKDAYS). CoverageOverride adjusts minimum coverage for specific dates or weekdays. Leave, CompOff, PublicHoliday track availability. Roster contains entries (employee, date, status). Conflict stores validation results with severity, code, message, and suggested actions. This separates team structure from work assignments, keeps scheduling rules data-driven, and allows multi-brand employees without code changes.

### 2. Roster Generation and Constraint Verification

Generation: (1) Build demand map per date using operating rules and coverage overrides. (2) Build employee availability from leaves, comp-offs, fixed weekly offs. (3) Plan weekly offs: assign one off per rolling 7-day week, favoring preferred days. (4) Assign working days: match employees to assignments based on demand and allocation. (5) Run validator to detect conflicts. Validation runs 7 rules: insufficient coverage per brand-process-date, leave vs working clash, working beyond max consecutive days, weekly-off violation, sole owner unavailable, unbalanced fairness (future), duplicate assignments. Each conflict has severity (ERROR blocks publish, WARNING is advisory), code, affected entities, and ranked suggested actions. Conflicts are stored and displayed in UI. Manual edits re-run validation and persist fresh conflicts. This ensures constraints are always visible and roster correctness is explicit.

### 3. Single-Resource vs Multi-Employee Brands

Single-resource brands (one employee owns all processes) are identified during generation. The system prioritizes their availability when planning weekly offs to avoid coverage gaps. If unavailable on a required day, validator emits SOLE_OWNER_UNAVAILABLE with suggestions: assign backup from same pod, swap leave to non-operating day, or temporarily promote a secondary. Multi-employee brands distribute coverage across assignees. Validator checks total coverage vs minimum requirement and allows staggered weekly offs. If multiple employees are unavailable simultaneously and coverage drops below minimum, INSUFFICIENT_COVERAGE is raised with suggestions to adjust offs or add backups. The key difference: single-resource brands treat the owner as critical; multi-employee brands treat the aggregate capacity as the constraint.

### 4. Employee Unavailable on Required Day

If an employee owning all processes of a brand is unavailable on a required operating day, the validator emits a SOLE_OWNER_UNAVAILABLE conflict (severity ERROR). The UI displays the conflict with the brand, process, date, and ranked suggestions: (1) Assign a backup employee from the same pod (most feasible), (2) Swap the leave/off to a non-operating day if the brand has custom calendar, (3) Temporarily increase allocation of a secondary assignee on that brand. The roster cannot be published with ERROR conflicts. The manager must either manually assign a backup via the Assignments page or use the Auto Repair feature, which attempts local swaps if another employee is available. If no solution exists, the conflict surfaces the staffing gap explicitly rather than silently ignoring it.

### 5. Conflicting Requirements / Insufficient Staffing

When conflicting constraints exist (e.g., multiple employees on leave, minimum coverage not met, sole owner unavailable), the system does not hide the problem. The validator emits conflicts for each issue: INSUFFICIENT_COVERAGE if total assigned employees working < minimum, SOLE_OWNER_UNAVAILABLE if critical employee absent, LEAVE_CONFLICT if leave overlaps working assignment. Each conflict includes suggested actions ranked by feasibility: reassign weekly offs within the same week, promote secondary assignees, add new assignments, adjust operating calendar or coverage minimums. The UI shows all conflicts with severity badges. The Auto Repair feature attempts local swaps (e.g., swap weekly offs between employees on the same brand). If repair fails, the user must manually resolve via the Assignments or Availability pages. Conflicts are never suppressed. The roster stays in DRAFT until all ERROR conflicts are resolved or accepted as warnings by management override (not yet implemented).

### 6. Automated vs Human-Controlled

**Automated:** Initial roster generation (weekly-off planning, working day assignment), conflict detection (7 validators run on every edit), fairness analysis (weekend/holiday distribution), repair suggestions (ranked backups, swap candidates), comp-off accrual tracking. **Human-controlled:** Approving/rejecting leaves, locking roster entries to prevent auto-edits, choosing which suggested action to apply, publishing roster with remaining warnings, adjusting operating rules or coverage minimums mid-month, assigning employees to brand-processes. Automation handles repetitive constraint-checking and first-pass scheduling. Humans handle judgment calls that require business context: is this leave critical? Can we operate with 1 instead of 2 employees today? Should we override fairness for a critical launch week? This balance reflects trust boundaries: algorithms are consistent and tireless but lack nuanced judgment.

### 7. Scaling to Double Size

Doubling from 32 to 64 employees and 20 to 40 brands increases roster size from ~1,000 to ~4,000 entries. **Backend:** Core algorithm is O(n) in entries; no fundamental change. Add database indexes on (rosterId, employeeId, date), (rosterId, status), (brandProcessId, date). Use chunked inserts (already implemented). Consider materialized views for dashboard aggregates. **Frontend:** Virtualized scrolling for the 64×31 grid (react-window). Load roster entries with pagination or infinite scroll. Group conflicts by brand/week to avoid overwhelming UI. **Conflict volume:** Better grouping (collapse 15 consecutive coverage gaps into "CS shortage for Brand X, Dec 1-15"). **Generation time:** Profile bottlenecks; parallelize validator rules if needed. For 100+ employees, move generation to background job with progress API. The architecture already separates concerns (scheduling engine is pure functions, database layer is transactional), so scaling is about UI performance and query optimization, not redesign.

### 8. One More Week Improvements

(1) **Comprehensive validator tests:** Each of the 7 rules in separate test files with edge cases (e.g., sole owner on leave during holiday, cross-brand coverage conflicts). (2) **Full repair engine:** Extend local repair to try intra-week swaps, inter-employee swaps within pod, and cross-brand swaps for multi-assigned employees. Currently repair only does simple weekly-off swaps. (3) **Change impact analysis:** When approving a leave, show before/after conflict counts and new conflicts introduced, with one-click "Open Roster" to review. (4) **Fairness report UI:** Visualize weekend/holiday work distribution with charts, flag employees with >X weekends worked. (5) **Assignments management page:** Full CRUD for assignments, coverage overrides, and operating rules so managers can adjust without code changes. (6) **Multi-view roster tabs:** Implement pod, brand, process, employee views with per-view filtering and coverage summaries. (7) **E2E tests:** Playwright covering full flow from login → generate roster → edit entry → resolve conflict → publish. (8) **Keyboard navigation:** Arrow keys to navigate grid, Enter to edit, Esc to cancel, shortcuts for common status changes.

## Project Structure

```
smartroster/
├── frontend/
│   ├── src/
│   │   ├── app/              # Router, layout, Sidebar, Topbar
│   │   ├── components/ui/    # Button, Badge
│   │   ├── features/         # Dashboard, employees, roster, reports, pods, processes, brands, availability
│   │   └── lib/              # API client
│   └── public/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment
│   │   ├── middleware/       # Express middleware, error handler
│   │   ├── lib/              # Prisma, logger
│   │   ├── modules/          # API modules (employees, brands, rosters, reports, pods, processes, leaves, holidays, compoffs)
│   │   └── scheduling/       # Pure scheduling engine
│   │       ├── calendar/     # Operating & employee calendars
│   │       ├── demand/       # Coverage demand
│   │       ├── generator/    # Roster generation, weekly-off planner
│   │       ├── validator/    # 7 conflict rules
│   │       ├── repair/       # Local repair
│   │       ├── fairness/     # Fairness analyzer
│   │       ├── impact/       # Change impact
│   │       ├── suggester/    # Resolution suggester
│   │       └── __tests__/    # 7 test files, 40 tests
│   └── prisma/
│       ├── schema.prisma
│       ├── migrations/
│       └── seed/
└── docs/
```

## Development

```bash
# Backend
cd backend
npm run dev        # Start dev server
npm run build      # Build TypeScript
npm run test       # Run tests
npm run seed       # Seed database

# Frontend
cd frontend
npm run dev        # Start Vite dev server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Deployment

### Backend (Render)
1. Create Web Service on Render
2. Set Root Directory: `backend`
3. Build Command: `npm install --include=dev && npm run build`
4. Start Command: `npx prisma migrate deploy && npm start`
5. Environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
   Note: Use Supabase transaction pooler (port 6543, pgbouncer=true) for DATABASE_URL and session pooler (port 5432) for DIRECT_URL. Do not use the IPv6-only direct connection host.

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set Root Directory: `frontend`
3. Set Environment Variable:
   ```
   VITE_API_URL=https://your-backend.onrender.com
   ```
   Do not include trailing slash or `/api` suffix. The API client normalizes the base URL automatically.
4. Deploy

### Database (Supabase)
1. Create project at https://supabase.com
2. Get pooled connection string from Project Settings > Database > Connection Pooling (Transaction mode, port 6543)
3. Get session connection string from Project Settings > Database > Connection Pooling (Session mode, port 5432)
4. After first backend deploy, run migrations via Render shell: `npx prisma migrate deploy && npm run seed`