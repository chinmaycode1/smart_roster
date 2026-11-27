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
- Operating calendar rules
- Coverage demand with overrides
- Weekly-off planner
- Employee calendar
- Roster generator
- Fairness analyzer
- 7 validator rules

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
- `PUT /api/rosters/:id/entries/:entryId` - Update entry
- `GET /api/rosters/:id/conflicts` - Get conflicts
- `POST /api/rosters/:id/publish` - Publish roster

### Reports
- `GET /api/reports/fairness/:rosterId` - Fairness report
- `GET /api/reports/coverage/:rosterId` - Coverage report
- `GET /api/reports/export/:rosterId` - Export CSV

### CRUD
- `/api/employees`, `/api/pods`, `/api/processes`, `/api/brands` - Standard CRUD
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

## How I Think

### 1. Data Model

I separated concerns: **Employee** → **Pod** (team structure), **Brand** + **Process** → **BrandProcess** (coverage unit), **Assignment** (employee-brand-process link with allocation). This allows multi-brand employees, shared processes, and future expansion without code changes.

**OperatingRule** captures "when does coverage need" as reusable types (ALL_365, DAILY_EXCEPT_HOLIDAYS) keeping scheduling logic data-driven.

### 2. Roster Generation

Deterministic and explainable phases:
1. **Build demand map**: Calculate required headcount per date using operating rules and overrides
2. **Build availability**: Mark leaves, comp-offs, fixed weekly offs
3. **Plan weekly offs**: Assign one off per rolling 7-day week, favoring preferred day
4. **Assign working days**: Match employees to assignments based on demand
5. **Local repair**: Try swapping offs to close gaps
6. **Validate**: Run all constraint checks, emit structured conflicts

The system never hides problems. Conflicts explicitly name brand, process, date, and suggest ranked backups.

### 3. Single-Resource Brands

The generator identifies sole owners by assignment counts and treats them high-priority during weekly-off planning. When unavailable on required day, validator emits SOLE_OWNER_UNAVAILABLE with specific suggestions:
- Assign backup from same pod or brand
- Swap leave to non-operating day
- Temporarily increase secondary assignee allocation

Multi-employee brands validate total coverage and allow staggered offs.

### 4. Conflict Handling

Conflicts are first-class data with severity (ERROR blocks publish, WARNING is advisory), code, message, and suggested actions. Insufficient staffing scenarios:
- **No assigned**: Suggest adding assignment or marking inactive
- **All unavailable**: Suggest backups, moving offs, adjusting calendar
- **Below minimum**: Show current vs required, suggest promoting secondary or adding assignee

UI shows filterable conflicts with one-click drill-down.

### 5. Automation vs Control

**Automated**: Initial weekly-off planning, working day assignment, conflict detection, suggestion ranking, comp-off accrual

**Human-controlled**: Approving leaves, locking edits, choosing suggested actions, publishing with warnings, adjusting rules mid-month

This reflects trust boundaries. Scheduling involves judgment and local context algorithms can't fully capture. System makes first 80% easy; humans handle nuanced 20%.

### 6. Scaling

Doubling from 32 to 64 employees and 20 to 40 brands affects:
- **Weekly-off planning**: Constraint-ordering heuristic remains valid, add caching for slack calculations
- **UI performance**: Implement virtualized scrolling for 1,920-cell grid
- **Database**: More indexes on composite keys, materialized views for aggregates
- **Conflict volume**: Better grouping (collapse 10 gaps into one "coverage shortage for Brand X, week of Dec 5")

Core algorithm is linear in input size. For large datasets, background job with progress tracking becomes essential.

### 7. Next Improvements

With one more week:
1. **Full repair**: Complete local search with intra-week, inter-employee, cross-brand swaps
2. **Fairness tracking**: Count weekend/holiday work, surface in report with distribution charts
3. **Change impact**: Show before/after diff when approving leave
4. **Approval workflow**: PENDING_APPROVAL status with multi-stage review
5. **CSV export**: Enhanced with pivot by brand/pod
6. **Comprehensive validators**: Each rule in separate file with edge case tests
7. **UI polish**: Keyboard shortcuts, inline editing, drag-to-swap
8. **E2E tests**: Playwright covering full flow

## Project Structure

```
smartroster/
├── frontend/
│   ├── src/
│   │   ├── app/              # Router, layout
│   │   ├── components/ui/    # Button, Badge
│   │   ├── features/         # Dashboard, employees, roster, reports, pods, processes
│   │   └── lib/              # API client
│   └── public/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment
│   │   ├── middleware/       # Express middleware
│   │   ├── lib/              # Prisma, logger
│   │   ├── modules/          # API modules (employees, brands, rosters, reports, pods, processes)
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
    └── approach.md
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

### Frontend (Vercel)
1. Connect GitHub repo to Vercel
2. Set `VITE_API_URL=<backend-url>`
3. Deploy

### Backend (Render)
1. Create Web Service on Render
2. Build: `cd backend && npm install && npx prisma generate && npm run build`
3. Start: `cd backend && npm start`
4. Environment:
   ```
   NODE_ENV=production
   DATABASE_URL=<supabase-pooled-url>
   DIRECT_URL=<supabase-direct-url>
   ```
5. Run migrations: `npx prisma migrate deploy`