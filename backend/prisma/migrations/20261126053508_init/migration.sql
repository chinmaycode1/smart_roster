-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'POD_LEAD');

-- CreateEnum
CREATE TYPE "OperatingRuleType" AS ENUM ('ALL_365', 'DAILY_EXCEPT_HOLIDAYS', 'EXCEPT_SUNDAYS_AND_HOLIDAYS', 'CUSTOM_WEEKDAYS');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('SICK', 'CASUAL', 'PLANNED', 'EMERGENCY');

-- CreateEnum
CREATE TYPE "CompOffStatus" AS ENUM ('EARNED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "RosterStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RosterEntryStatus" AS ENUM ('WORKING', 'WEEKLY_OFF', 'LEAVE', 'HOLIDAY', 'COMP_OFF');

-- CreateEnum
CREATE TYPE "RosterEntrySource" AS ENUM ('GENERATED', 'MANUAL');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('ERROR', 'WARNING');

-- CreateTable
CREATE TABLE "Pod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "leadEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "podId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxConsecutiveWorkDays" INTEGER NOT NULL DEFAULT 6,
    "joinedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Process" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Process_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OperatingRuleType" NOT NULL,
    "workingWeekdays" INTEGER[],
    "worksOnHolidays" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandProcess" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "processId" TEXT NOT NULL,
    "operatingRuleId" TEXT NOT NULL,
    "shiftId" TEXT,
    "defaultMinCoverage" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "brandProcessId" TEXT NOT NULL,
    "allocationPercent" INTEGER NOT NULL DEFAULT 100,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoverageOverride" (
    "id" TEXT NOT NULL,
    "brandProcessId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "weekday" INTEGER,
    "minCoverage" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoverageOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicHoliday" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'India',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicHoliday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyOffPattern" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "preferredOffDays" INTEGER[],
    "fixedOffDays" INTEGER[],
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeeklyOffPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "LeaveType" NOT NULL DEFAULT 'PLANNED',
    "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompOff" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "earnedOn" TIMESTAMP(3) NOT NULL,
    "redeemOn" TIMESTAMP(3),
    "status" "CompOffStatus" NOT NULL DEFAULT 'EARNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompOff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Preference" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Preference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roster" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" "RosterStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "parentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RosterEntry" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "RosterEntryStatus" NOT NULL,
    "source" "RosterEntrySource" NOT NULL DEFAULT 'GENERATED',
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RosterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conflict" (
    "id" TEXT NOT NULL,
    "rosterId" TEXT NOT NULL,
    "severity" "ConflictSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "brandProcessId" TEXT,
    "employeeId" TEXT,
    "date" TIMESTAMP(3),
    "message" TEXT NOT NULL,
    "suggestedActions" JSONB NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL DEFAULT 'SYSTEM',
    "actorId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pod_name_key" ON "Pod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pod_leadEmployeeId_key" ON "Pod"("leadEmployeeId");

-- CreateIndex
CREATE INDEX "Pod_name_idx" ON "Pod"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_code_key" ON "Employee"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_podId_idx" ON "Employee"("podId");

-- CreateIndex
CREATE INDEX "Employee_email_idx" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_code_idx" ON "Employee"("code");

-- CreateIndex
CREATE INDEX "Employee_isActive_idx" ON "Employee"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_code_key" ON "Brand"("code");

-- CreateIndex
CREATE INDEX "Brand_code_idx" ON "Brand"("code");

-- CreateIndex
CREATE INDEX "Brand_isActive_idx" ON "Brand"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Process_name_key" ON "Process"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Process_code_key" ON "Process"("code");

-- CreateIndex
CREATE INDEX "Process_code_idx" ON "Process"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Shift_name_key" ON "Shift"("name");

-- CreateIndex
CREATE INDEX "Shift_name_idx" ON "Shift"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingRule_name_key" ON "OperatingRule"("name");

-- CreateIndex
CREATE INDEX "OperatingRule_type_idx" ON "OperatingRule"("type");

-- CreateIndex
CREATE INDEX "BrandProcess_brandId_idx" ON "BrandProcess"("brandId");

-- CreateIndex
CREATE INDEX "BrandProcess_processId_idx" ON "BrandProcess"("processId");

-- CreateIndex
CREATE INDEX "BrandProcess_operatingRuleId_idx" ON "BrandProcess"("operatingRuleId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandProcess_brandId_processId_key" ON "BrandProcess"("brandId", "processId");

-- CreateIndex
CREATE INDEX "Assignment_employeeId_idx" ON "Assignment"("employeeId");

-- CreateIndex
CREATE INDEX "Assignment_brandProcessId_idx" ON "Assignment"("brandProcessId");

-- CreateIndex
CREATE INDEX "Assignment_startDate_idx" ON "Assignment"("startDate");

-- CreateIndex
CREATE INDEX "Assignment_endDate_idx" ON "Assignment"("endDate");

-- CreateIndex
CREATE INDEX "CoverageOverride_brandProcessId_idx" ON "CoverageOverride"("brandProcessId");

-- CreateIndex
CREATE INDEX "CoverageOverride_date_idx" ON "CoverageOverride"("date");

-- CreateIndex
CREATE UNIQUE INDEX "PublicHoliday_date_key" ON "PublicHoliday"("date");

-- CreateIndex
CREATE INDEX "PublicHoliday_date_idx" ON "PublicHoliday"("date");

-- CreateIndex
CREATE INDEX "PublicHoliday_region_idx" ON "PublicHoliday"("region");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyOffPattern_employeeId_key" ON "WeeklyOffPattern"("employeeId");

-- CreateIndex
CREATE INDEX "WeeklyOffPattern_employeeId_idx" ON "WeeklyOffPattern"("employeeId");

-- CreateIndex
CREATE INDEX "Leave_employeeId_idx" ON "Leave"("employeeId");

-- CreateIndex
CREATE INDEX "Leave_startDate_idx" ON "Leave"("startDate");

-- CreateIndex
CREATE INDEX "Leave_endDate_idx" ON "Leave"("endDate");

-- CreateIndex
CREATE INDEX "Leave_status_idx" ON "Leave"("status");

-- CreateIndex
CREATE INDEX "CompOff_employeeId_idx" ON "CompOff"("employeeId");

-- CreateIndex
CREATE INDEX "CompOff_earnedOn_idx" ON "CompOff"("earnedOn");

-- CreateIndex
CREATE INDEX "CompOff_redeemOn_idx" ON "CompOff"("redeemOn");

-- CreateIndex
CREATE INDEX "CompOff_status_idx" ON "CompOff"("status");

-- CreateIndex
CREATE INDEX "Preference_employeeId_idx" ON "Preference"("employeeId");

-- CreateIndex
CREATE INDEX "Preference_type_idx" ON "Preference"("type");

-- CreateIndex
CREATE INDEX "Roster_month_year_idx" ON "Roster"("month", "year");

-- CreateIndex
CREATE INDEX "Roster_status_idx" ON "Roster"("status");

-- CreateIndex
CREATE INDEX "Roster_parentVersionId_idx" ON "Roster"("parentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Roster_month_year_version_key" ON "Roster"("month", "year", "version");

-- CreateIndex
CREATE INDEX "RosterEntry_rosterId_idx" ON "RosterEntry"("rosterId");

-- CreateIndex
CREATE INDEX "RosterEntry_employeeId_idx" ON "RosterEntry"("employeeId");

-- CreateIndex
CREATE INDEX "RosterEntry_date_idx" ON "RosterEntry"("date");

-- CreateIndex
CREATE INDEX "RosterEntry_status_idx" ON "RosterEntry"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RosterEntry_rosterId_employeeId_date_key" ON "RosterEntry"("rosterId", "employeeId", "date");

-- CreateIndex
CREATE INDEX "Conflict_rosterId_idx" ON "Conflict"("rosterId");

-- CreateIndex
CREATE INDEX "Conflict_severity_idx" ON "Conflict"("severity");

-- CreateIndex
CREATE INDEX "Conflict_code_idx" ON "Conflict"("code");

-- CreateIndex
CREATE INDEX "Conflict_brandProcessId_idx" ON "Conflict"("brandProcessId");

-- CreateIndex
CREATE INDEX "Conflict_employeeId_idx" ON "Conflict"("employeeId");

-- CreateIndex
CREATE INDEX "Conflict_date_idx" ON "Conflict"("date");

-- CreateIndex
CREATE INDEX "Conflict_resolvedAt_idx" ON "Conflict"("resolvedAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "Pod" ADD CONSTRAINT "Pod_leadEmployeeId_fkey" FOREIGN KEY ("leadEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_podId_fkey" FOREIGN KEY ("podId") REFERENCES "Pod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProcess" ADD CONSTRAINT "BrandProcess_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProcess" ADD CONSTRAINT "BrandProcess_processId_fkey" FOREIGN KEY ("processId") REFERENCES "Process"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProcess" ADD CONSTRAINT "BrandProcess_operatingRuleId_fkey" FOREIGN KEY ("operatingRuleId") REFERENCES "OperatingRule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandProcess" ADD CONSTRAINT "BrandProcess_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_brandProcessId_fkey" FOREIGN KEY ("brandProcessId") REFERENCES "BrandProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoverageOverride" ADD CONSTRAINT "CoverageOverride_brandProcessId_fkey" FOREIGN KEY ("brandProcessId") REFERENCES "BrandProcess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeeklyOffPattern" ADD CONSTRAINT "WeeklyOffPattern_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompOff" ADD CONSTRAINT "CompOff_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Preference" ADD CONSTRAINT "Preference_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roster" ADD CONSTRAINT "Roster_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "Roster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RosterEntry" ADD CONSTRAINT "RosterEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conflict" ADD CONSTRAINT "Conflict_rosterId_fkey" FOREIGN KEY ("rosterId") REFERENCES "Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conflict" ADD CONSTRAINT "Conflict_brandProcessId_fkey" FOREIGN KEY ("brandProcessId") REFERENCES "BrandProcess"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "Roster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;
