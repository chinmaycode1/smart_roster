# SmartRoster Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:
- Node.js 20 or higher: `node --version`
- npm: `npm --version`
- PostgreSQL 16+ OR Docker Desktop OR a Supabase account

## Setup Steps

### 1. Database Setup (Choose ONE option)

#### Option A: Docker (Easiest for local development)

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait 10 seconds for database to initialize
# Windows PowerShell:
Start-Sleep -Seconds 10
# macOS/Linux:
sleep 10
```

#### Option B: Supabase (For production or if Docker unavailable)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings > Database
4. Copy both connection strings:
   - **Pooled connection (Session mode, port 6543)** → Use as `DATABASE_URL`
   - **Direct connection** → Use as `DIRECT_URL`

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# If using Supabase: Edit .env and paste your connection strings
# If using Docker: The .env is already configured for local PostgreSQL

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
# OR for local dev:
npx prisma migrate dev

# Seed the database with sample data
npm run seed

# Verify setup
npm run typecheck
npm run test

# Start backend server
npm run dev
```

Backend should now be running at http://localhost:4000

Test it: Open http://localhost:4000/health in your browser. You should see `{"status":"ok"}`.

### 3. Frontend Setup (in a new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# VITE_API_URL should be http://localhost:4000 (already configured)

# Verify setup
npm run typecheck

# Start frontend dev server
npm run dev
```

Frontend should now be running at http://localhost:5173

### 4. Access the Application

Open your browser and go to: **http://localhost:5173**

You should see:
- Dashboard with stats (32 employees, 20 brands, 4 processes)
- Sidebar navigation
- Employees page with full list

## Troubleshooting

### "Can't reach database server"

**Using Docker:**
- Check if container is running: `docker ps`
- Check logs: `docker-compose logs postgres`
- Try restarting: `docker-compose restart postgres`

**Using Supabase:**
- Verify connection strings are correct in `backend/.env`
- Check if Supabase project is active
- Ensure you're using the pooled URL for DATABASE_URL

### "Port already in use"

Change the ports in:
- Backend: `backend/.env` → `PORT=4001`
- Frontend: `frontend/.env` → `VITE_API_URL=http://localhost:4001`

### "Module not found" errors

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database migration issues

```bash
cd backend

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset --force

# Re-seed
npm run seed
```

## Next Steps

After successful setup:

1. **Explore the Dashboard** - See overview stats and roster preview
2. **Check Employees page** - View all 32 seeded employees across 4 pods
3. **Review the data model** - Look at `backend/prisma/schema.prisma`
4. **Read the scheduling logic** - Explore `backend/src/scheduling/`
5. **Review the README** - See the "How I Think" section for design rationale

## Production Deployment

See the "Deployment" section in README.md for deploying to:
- Frontend: Vercel
- Backend: Render
- Database: Supabase

## Need Help?

- Check the full README.md for detailed documentation
- Review docs/approach.md for architecture decisions
- Inspect seed data in `backend/prisma/seed/` to understand the sample dataset
