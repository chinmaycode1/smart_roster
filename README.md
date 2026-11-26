# SmartRoster

A roster management system for operations teams managing Customer Support, Abandoned Cart Conversions, Retention, and NDR processes across multiple D2C brands. Built as a production-ready demonstration of scheduling logic, conflict detection, and clean architecture.

## Tech Stack

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form, Zod, date-fns, lucide-react

**Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Zod validation, Vitest, pino logging

**Database:** Supabase (hosted PostgreSQL) or local PostgreSQL via Docker

**DevOps:** Docker Compose, GitHub Actions CI, Vercel (frontend), Render (backend)

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
        Engine --> Repair[Repair & Suggestions]
    end

    subgraph Database
        Prisma --> DB[(PostgreSQL)]
    end

    API -.HTTP.-> Routes
```

## Folder Structure

```
smartroster/
├── frontend/                # React application
│   ├── src/
│   │   ├── app/            # Router, layout components
│   │   ├── components/     # Reusable UI components
│   │   │   ├── ui/         # Button, Input, Badge, Table, Modal
│   │   │   └── brand/      # Logo
│   │   ├── features/       # Feature modules (dashboard, employees, roster)
│   │   ├── lib/            # API client, utilities
│   │   └── styles/         # Global CSS
│   └── public/             # Static assets
│
├── backend/                # Node.js API server
│   ├── src/
│   │   ├── config/         # Environment configuration
│   │   ├── middleware/     # Express middleware
│   │   ├── lib/            # Prisma, logger, utilities
│   │   ├── modules/        # Feature modules (employees, brands, roster)
│   │   │   └── [module]/
│   │   │       ├── routes.ts
│   │   │       ├── controller.ts
│   │   │       ├── service.ts
│   │   │       └── schema.ts
│   │   └── scheduling/     # Pure scheduling engine
│   │       ├── types.ts
│   │       ├── calendar/   # Operating & employee calendars
│   │       ├── demand/     # Coverage demand calculation
│   │       ├── generator/  # Roster generation
│   │       ├── validator/  # Conflict detection
│   │       └── __tests__/  # Unit tests
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       ├── migrations/     # Database migrations
│       └── seed/           # Seed data scripts
│
├── docs/                   # Documentation
│   └── approach.md
├── .github/workflows/      # CI/CD
│   └── ci.yml
└── docker-compose.yml      # Local development setup
```

## Local Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local or Supabase)
- Docker and Docker Compose (optional, for local PostgreSQL)

### Option 1: Using Docker Compose (Recommended for Development)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd smartroster
   ```

2. Start PostgreSQL:
   ```bash
   docker-compose up -d postgres
   ```

3. Backend setup:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # DATABASE_URL and DIRECT_URL are already set for local Docker Postgres
   npx prisma migrate dev
   npm run seed
   npm run dev
   ```

4. Frontend setup (in a new terminal):
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

5. Open http://localhost:5173

### Option 2: Using Supabase

1. Create a Supabase project at https://supabase.com

2. Get your connection strings:
   - **Pooled connection (for app runtime):** Project Settings > Database > Connection string (Session mode, port 6543)
   - **Direct connection (for migrations):** Project Settings > Database > Connection string (Direct connection)

3. Backend setup:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

4. Edit `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

5. Run migrations and seed:
   ```bash
   npx prisma migrate deploy
   npm run seed
   npm run dev
   ```

6. Frontend setup same as Option 1 step 4-5.

### Environment Variables

**Backend (`backend/.env`):**
```env
NODE_ENV=development
PORT=4000
DATABASE_URL=<pooled-connection-string>
DIRECT_URL=<direct-connection-string>
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:4000
```

## Running Tests

```bash
cd backend
npm run test
```

## Seeding the Database

The seed script creates:
- 32 employees across 4 pods
- 20 D2C brands (skincare, apparel, home, nutrition, accessories)
- 4 processes (CS, ACC, Retention, NDR)
- Brand-process assignments with various operating rules
- Sample leaves, comp-offs, and weekly-off patterns
- Public holidays for 2026 (India)

```bash
cd backend
npm run seed
```

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variable: `VITE_API_URL=<your-backend-url>`
4. Deploy

### Backend (Render)

1. Create a Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install && npx prisma generate && npm run build`
4. Set start command: `cd backend && npm start`
5. Add environment variables:
   ```
   NODE_ENV=production
   DATABASE_URL=<supabase-pooled-url>
   DIRECT_URL=<supabase-direct-url>
   ```
6. Run migrations manually or via deploy hook:
   ```bash
   npx prisma migrate deploy
   ```

### Database (Supabase)

1. Create a Supabase project
2. Use connection strings as documented above
3. Configure backups and monitoring in Supabase dashboard

## Demo Scenario Walkthrough

The seed data includes a demonstration of core scheduling challenges:

1. **Single-resource brand owner on leave:** Employee EMP006 (Amit Joshi) has an approved leave on December 10-11. This creates a coverage gap for their assigned brand on required working days.

2. **Multi-employee brand with minimum coverage:** Brand "PureTone Wellness" requires minimum 2 employees on CS. If one employee is unavailable, the system validates whether the remaining coverage meets the requirement.

3. **365-day process handling:** Brand "PureGlow Skincare" operates all 365 days including holidays. The system ensures the sole owner (EMP002) gets exactly one weekly off per week, and suggests backups when that employee requests leave.

4. **Mixed operating calendars:** Brand "ActiveFit Gear" has CS running daily except holidays, while its ACC process excludes Sundays and holidays. The scheduler respects both calendars independently.

5. **Coverage overrides:** Some brands have higher minimum coverage on specific weekdays (e.g., Fridays or post-weekend Mondays) to handle ticket volume spikes.

## Assumptions

1. **Weekly offs are soft constraints during generation but hard once assigned.** The generator tries to honor preferred off days and fairness, but manual locks override all logic.

2. **Approved leaves and comp-offs are immutable hard constraints.** Regeneration never schedules work on these dates.

3. **Fixed weekly-off patterns (e.g., every Sunday) are hard constraints.** Non-fixed preferred days are soft.

4. **Brand-process is the unit of coverage.** An employee can be assigned to multiple brand-processes with allocation percentages.

5. **A "working on holiday" day earns a comp-off credit** if the employee's assigned process operates on holidays and the employee is not on leave.

6. **Conflicts are never hidden.** If the system cannot satisfy coverage, it emits an ERROR conflict with suggested actions rather than silently generating an invalid roster.

7. **Roster versions are immutable once published.** Edits create a new version with a parent reference.

8. **Local time zone is assumed.** All dates are stored as UTC in the database but displayed and scheduled in the user's local context.

9. **Minimum coverage is per brand-process per day.** There is no shift-overlap logic or hourly granularity in this version.

10. **Employees within a pod can substitute for each other more easily.** The resolution suggester ranks same-pod employees higher when suggesting backups.

## How I Think

### 1. How did you model employees, brands, processes, pods and their relationships?

I separated concerns into distinct entities: **Employee** belongs to one **Pod**, which is a stable team structure. **Brand** and **Process** are independent concepts that combine into **BrandProcess**, which is the actual unit that needs coverage. An **Assignment** links an employee to a brand-process with allocation percentage, start/end dates, and a primary flag. This design allows an employee to work on multiple brands, a brand to have multiple processes, and a process to be shared across brands. It also supports future expansion: adding a new process or brand requires no code change, just database entries.

The **OperatingRule** abstraction captures "when does this brand-process need coverage" as reusable rule types (ALL_365, DAILY_EXCEPT_HOLIDAYS, etc.) with weekday arrays and holiday behavior. This keeps scheduling logic pure and data-driven rather than hardcoded.

### 2. How does the system generate a roster and decide it satisfies the constraints?

Generation is deterministic and explainable. It proceeds in phases:

1. **Build demand map:** For every date and brand-process, calculate required headcount using the operating rule, holidays, and coverage overrides.

2. **Build base availability:** Mark each employee's unavailable dates (approved leaves, comp-offs, fixed weekly offs).

3. **Plan weekly offs:** Process employees in constraint order (most-constrained first: single-resource owners, employees with fewest available days). Assign one off per rolling 7-day week, favoring the preferred day and balancing load across the team.

4. **Assign working days:** For each employee, check their active assignments and determine which dates they should work based on demand and availability.

5. **Local repair:** Try swapping offs within or across employees to close small gaps.

6. **Validate:** Run all constraint checks. Emit conflicts with structured suggested actions.

The system never hides problems. If demand cannot be met, the conflict explicitly names the brand, process, date, and suggests backups or swaps with their downstream impact.

### 3. How are single-resource brands handled differently from multi-employee brands?

Single-resource brands are inherently fragile. The generator identifies them by checking assignment counts and treats the sole owner as high-priority during weekly-off planning. When that employee requests leave on a required day, the validator emits a SOLE_OWNER_UNAVAILABLE conflict with specific suggestions:

- Assign a backup from the same pod or brand.
- Swap the leave to a non-operating day if the brand's calendar allows.
- Temporarily increase allocation of a secondary assignee if one exists.

For multi-employee brands, the system validates total coverage across all assigned employees and allows staggered offs. If minimum coverage is 2 and both are unavailable, it's an INSUFFICIENT_COVERAGE conflict with ranked backup candidates.

### 4. What happens when an employee who manages all processes for a brand is unavailable on a required day?

This triggers a conflict. The system does not silently accept the gap. Instead:

1. It logs a **SOLE_OWNER_UNAVAILABLE** error conflict tied to the specific brand-process and date.

2. It queries for potential backups: employees in the same pod, employees assigned to the same brand on other processes, or employees with the same process skill across pods.

3. It ranks them by allocation capacity, skill match, and current load.

4. It presents these as **suggested actions** in the UI with one-click assign or swap options.

5. If the user approves a backup assignment, the system re-validates affected dates and shows the before/after diff.

The design assumes human judgment for critical gaps rather than auto-filling with suboptimal choices.

### 5. How are conflicting requirements or insufficient staffing handled?

Conflicts are first-class data. Each conflict has:

- **Severity:** ERROR (blocks publish) or WARNING (advisory).
- **Code:** Machine-readable identifier (e.g., INSUFFICIENT_COVERAGE, WEEKLY_OFF_VIOLATION).
- **Message:** Plain-English explanation.
- **Suggested actions:** Ranked list of fixes with impact preview.

Insufficient staffing scenarios:

- **No assigned employees:** System suggests adding an assignment or marking the brand-process inactive for that period.
- **Assigned but all unavailable:** System suggests backups, moving offs, or temporarily adjusting the operating calendar if business permits.
- **Below minimum coverage:** System shows current vs. required headcount and suggests promoting a secondary assignment to primary or adding a new assignee.

The UI shows conflicts in a filterable drawer with one-click drill-down to the affected dates and employees.

### 6. What is automated and what stays under human control, and why?

**Automated:**

- Initial weekly-off planning based on preferences and fairness.
- Working day assignment based on demand.
- Conflict detection and suggestion ranking.
- Comp-off credit accrual when working on holidays.

**Human-controlled:**

- Approving or rejecting leaves.
- Locking manual roster edits (which the generator then treats as immutable).
- Choosing which suggested action to apply.
- Deciding whether to publish a roster with warnings.
- Adjusting operating rules or coverage overrides mid-month.

This split reflects trust boundaries. The system is a decision-support tool, not an autopilot. Scheduling people's work and time off involves judgment, fairness perception, and local context that an algorithm cannot fully capture. The system makes the first 80% easy and transparent; humans handle the nuanced 20%.

### 7. What would change if the team and brand count doubled?

Doubling from 32 to 64 employees and 20 to 40 brands primarily affects:

1. **Weekly-off planning complexity:** The constraint-ordering heuristic (most-constrained first) would remain valid, but repair search space grows. I would add caching for slack calculations and limit repair iteration depth.

2. **UI performance:** The roster grid for 64 employees across a month is 1,920 cells. I would implement virtualized scrolling and paginated/filtered views (e.g., per-pod or per-brand tabs).

3. **Database query optimization:** More indexes on composite keys (rosterId + employeeId + date) and materialized views for dashboard aggregates.

4. **Conflict volume:** More employees and brands mean more potential gaps. The conflict drawer would need better grouping (e.g., collapse 10 related gaps into one "coverage shortage for Brand X, week of Dec 5" item).

The scheduling engine itself is linear in input size and already designed to run in a background job for large datasets. The core algorithm would not need a rewrite, but observability (progress tracking, partial results) would become essential.

### 8. What would be improved first with one more week?

1. **Full repair and swap logic:** The current repair placeholder needs a complete local search implementation that tries intra-week swaps, inter-employee swaps within a pod, and shift-compatible swaps across brands. This is algorithmically dense and benefits from property-based tests.

2. **Fairness tracking:** Count weekend work, holiday work, and preferred-day misses per employee. Surface this in a fairness report with visual distribution charts. Add a "rebalance next month" mode that prioritizes fairness in the next generation.

3. **Change impact preview:** When a user approves a leave or changes an operating rule, show the before/after roster diff in a modal with conflict deltas before committing. This requires a speculative validation run.

4. **Approval workflow:** Add a PENDING_APPROVAL status where pod leads review and comment on rosters before the operations manager publishes. Include email notifications and version comparison.

5. **CSV/Excel export:** Pragmatic ops teams need Excel. Export roster entries, pivot by brand or pod, with conflict annotations.

6. **Comprehensive validator rules:** Implement each rule in a separate file (no overlapping shifts, max consecutive days, mandatory offs in rolling windows) with structured tests for edge cases.

7. **UI polish:** Keyboard shortcuts for roster navigation, inline cell editing with instant conflict feedback, drag-to-swap weekly offs, and mobile-responsive roster grid.

8. **End-to-end tests:** Playwright tests covering the full flow: seed data → generate roster → approve leave → see conflict → apply suggestion → publish.
