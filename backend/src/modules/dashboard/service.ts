import { prisma } from '../../lib/prisma.js';
import { buildDemandMap } from '../../scheduling/demand/coverageDemand.js';
import type { Prisma } from '@prisma/client';

type BrandProcessWithRelations = Prisma.BrandProcessGetPayload<{
  include: {
    brand: true;
    process: true;
    operatingRule: true;
    coverageOverrides: true;
  };
}>;

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const daysCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  for (let day = 1; day <= daysCount; day++) {
    days.push(new Date(Date.UTC(year, month - 1, day)));
  }
  return days;
}

export async function getDashboardSummary(month: number, year: number, selectedDate?: string) {
  const totalEmployees = await prisma.employee.count({ where: { isActive: true } });
  const totalBrands = await prisma.brand.count({ where: { isActive: true } });
  const totalProcesses = await prisma.process.count();

  const roster = await prisma.roster.findFirst({
    where: {
      month,
      year,
      status: { not: 'ARCHIVED' },
    },
    orderBy: { version: 'desc' },
  });

  if (!roster) {
    return {
      totalEmployees,
      totalBrands,
      totalProcesses,
      openConflicts: 0,
      errorCount: 0,
      warningCount: 0,
      coverage: { covered: 0, uncovered: 0, offLeave: 0, percentage: 0 },
      todayOverview: null,
      brandCoverage: [],
      preview: [],
    };
  }

  const conflicts = await prisma.conflict.findMany({
    where: { rosterId: roster.id, resolvedAt: null },
    select: { severity: true },
  });

  const openConflicts = conflicts.length;
  const errorCount = conflicts.filter((c) => c.severity === 'ERROR').length;
  const warningCount = conflicts.filter((c) => c.severity === 'WARNING').length;

  const entries = await prisma.rosterEntry.findMany({
    where: { rosterId: roster.id },
    include: {
      employee: {
        include: {
          assignments: true,
          pod: { select: { name: true } },
        },
      },
    },
  });

  const brandProcesses = await prisma.brandProcess.findMany({
    include: {
      brand: true,
      process: true,
      operatingRule: true,
      coverageOverrides: true,
      assignments: { select: { employeeId: true, allocationPercent: true } },
    },
  });

  const holidays = await prisma.publicHoliday.findMany();

  const days = getDaysInMonth(year, month);
  const demandMap = buildDemandMap(
    days,
    brandProcesses.map((bp: BrandProcessWithRelations) => ({
      id: bp.id,
      brandId: bp.brandId,
      brandName: bp.brand.name,
      brandCode: bp.brand.code,
      processId: bp.processId,
      processName: bp.process.name,
      processCode: bp.process.code,
      operatingRule: {
        type: bp.operatingRule.type as 'ALL_365' | 'DAILY_EXCEPT_HOLIDAYS' | 'EXCEPT_SUNDAYS_AND_HOLIDAYS' | 'CUSTOM_WEEKDAYS',
        workingWeekdays: bp.operatingRule.workingWeekdays,
        worksOnHolidays: bp.operatingRule.worksOnHolidays,
      },
      shiftId: bp.shiftId || undefined,
      defaultMinCoverage: bp.defaultMinCoverage,
      coverageOverrides: bp.coverageOverrides.map((o) => ({
        date: o.date || undefined,
        weekday: o.weekday || undefined,
        minCoverage: o.minCoverage,
      })),
    })),
    holidays.map((h) => ({ date: h.date }))
  );

  let totalRequired = 0;
  let totalFilled = 0;
  let totalOffLeave = 0;

  const brandCoverageMap: Record<string, { required: number; filled: number; name: string }> = {};

  for (const bp of brandProcesses) {
    const assignedEmployeeIds = new Set(bp.assignments.map((a) => a.employeeId));
    brandCoverageMap[bp.brandId] = brandCoverageMap[bp.brandId] || { required: 0, filled: 0, name: bp.brand.name };

    for (const day of days) {
      const dateKey = day.toISOString().split('T')[0];
      const required = demandMap[bp.id]?.[dateKey] ?? 0;
      totalRequired += required;
      brandCoverageMap[bp.brandId].required += required;

      const dayEntries = entries.filter(
        (e) => e.date.toISOString().split('T')[0] === dateKey && assignedEmployeeIds.has(e.employeeId)
      );

      const workingCount = dayEntries.filter((e) => e.status === 'WORKING').length;
      const filled = Math.min(workingCount, required);
      totalFilled += filled;
      brandCoverageMap[bp.brandId].filled += filled;
    }
  }

  for (const entry of entries) {
    if (entry.status !== 'WORKING') {
      totalOffLeave++;
    }
  }

  const coverage = {
    covered: totalFilled,
    uncovered: Math.max(0, totalRequired - totalFilled),
    offLeave: totalOffLeave,
    percentage: totalRequired > 0 ? Math.round((totalFilled / totalRequired) * 100) : 100,
  };

  const brandCoverage = Object.values(brandCoverageMap)
    .map((b) => ({
      brandName: b.name,
      percentage: b.required > 0 ? Math.round((b.filled / b.required) * 100) : 100,
    }))
    .sort((a, b) => a.percentage - b.percentage);

  const todayDate = selectedDate
    ? new Date(selectedDate)
    : (new Date().getUTCMonth() + 1 === month && new Date().getUTCFullYear() === year
        ? new Date()
        : days[0]);

  const todayKey = todayDate.toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.date.toISOString().split('T')[0] === todayKey);

  const todayOverview = {
    date: todayKey,
    working: todayEntries.filter((e) => e.status === 'WORKING').length,
    onLeave: todayEntries.filter((e) => e.status === 'LEAVE').length,
    weeklyOff: todayEntries.filter((e) => e.status === 'WEEKLY_OFF').length,
    holiday: todayEntries.filter((e) => e.status === 'HOLIDAY').length,
    compOff: todayEntries.filter((e) => e.status === 'COMP_OFF').length,
    coverageGaps: 0,
  };

  const employeesForPreview = await prisma.employee.findMany({
    where: { id: { in: [...new Set(entries.map((e) => e.employeeId))] } },
    include: { pod: { select: { name: true } } },
    orderBy: [{ podId: 'asc' }, { name: 'asc' }],
    take: 6,
  });

  const preview = employeesForPreview.map((emp) => {
    const statuses: Record<number, string> = {};
    for (let day = 1; day <= 15; day++) {
      const dateKey = new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
      const entry = entries.find((e) => e.employeeId === emp.id && e.date.toISOString().split('T')[0] === dateKey);
      statuses[day] = entry?.status || 'WEEKLY_OFF';
    }
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      podName: emp.pod.name,
      statuses,
    };
  });

  return {
    totalEmployees,
    totalBrands,
    totalProcesses,
    openConflicts,
    errorCount,
    warningCount,
    coverage,
    todayOverview,
    brandCoverage,
    preview,
  };
}
