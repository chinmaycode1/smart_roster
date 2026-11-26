import { prisma } from '../../lib/prisma.js';
import { generateRoster as generateRosterEngine } from '../../scheduling/index.js';
import type { GenerationContext } from '../../scheduling/types.js';

export async function generateRoster(data: { month: number; year: number }) {
  const { month, year } = data;

  const employees = await prisma.employee.findMany({
    include: {
      assignments: true,
      weeklyOffPattern: true,
      leaves: { where: { status: 'APPROVED' } },
      compOffs: true,
    },
  });

  const brandProcesses = await prisma.brandProcess.findMany({
    include: {
      brand: true,
      process: true,
      operatingRule: true,
      coverageOverrides: true,
    },
  });

  const holidays = await prisma.publicHoliday.findMany();

  const context: GenerationContext = {
    month,
    year,
    employees: employees.map((emp) => ({
      id: emp.id,
      code: emp.code,
      name: emp.name,
      podId: emp.podId,
      maxConsecutiveWorkDays: emp.maxConsecutiveWorkDays,
      assignments: emp.assignments.map((a) => ({
        id: a.id,
        brandProcessId: a.brandProcessId,
        allocationPercent: a.allocationPercent,
        isPrimary: a.isPrimary,
        startDate: a.startDate || undefined,
        endDate: a.endDate || undefined,
      })),
      weeklyOffPattern: emp.weeklyOffPattern ? {
        preferredOffDays: emp.weeklyOffPattern.preferredOffDays,
        fixedOffDays: emp.weeklyOffPattern.fixedOffDays,
        isFixed: emp.weeklyOffPattern.isFixed,
      } : undefined,
      leaves: emp.leaves.map((l) => ({
        startDate: l.startDate,
        endDate: l.endDate,
        status: l.status as 'APPROVED',
      })),
      compOffs: emp.compOffs.map((c) => ({
        earnedOn: c.earnedOn,
        redeemOn: c.redeemOn || undefined,
        status: c.status as 'EARNED' | 'REDEEMED' | 'EXPIRED',
      })),
    })),
    brandProcesses: brandProcesses.map((bp) => ({
      id: bp.id,
      brandId: bp.brandId,
      brandName: bp.brand.name,
      brandCode: bp.brand.code,
      processId: bp.processId,
      processName: bp.process.name,
      processCode: bp.process.code,
      operatingRule: {
        type: bp.operatingRule.type as any,
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
    holidays: holidays.map((h) => ({ date: h.date })),
    lockedEntries: [],
  };

  const result = generateRosterEngine(context);

  const roster = await prisma.roster.create({
    data: {
      month,
      year,
      status: 'DRAFT',
      generatedAt: new Date(),
    },
  });

  await prisma.rosterEntry.createMany({
    data: result.entries.map((entry) => ({
      rosterId: roster.id,
      employeeId: entry.employeeId,
      date: entry.date,
      status: entry.status,
      source: entry.source,
      isLocked: entry.isLocked,
      note: entry.note,
    })),
  });

  const conflictsData = result.conflicts.map((c) => ({
    rosterId: roster.id,
    severity: c.severity,
    code: c.code,
    brandProcessId: c.brandProcessId,
    employeeId: c.employeeId,
    date: c.date,
    message: c.message,
    suggestedActions: JSON.stringify(c.suggestedActions),
  }));

  if (conflictsData.length > 0) {
    await prisma.conflict.createMany({ data: conflictsData });
  }

  return { roster, conflicts: result.conflicts };
}

export async function getRosterById(id: string) {
  return prisma.roster.findUnique({
    where: { id },
    include: {
      _count: {
        select: { entries: true, conflicts: true },
      },
    },
  });
}

export async function getRosterEntries(rosterId: string) {
  return prisma.rosterEntry.findMany({
    where: { rosterId },
    include: {
      employee: {
        select: {
          id: true,
          code: true,
          name: true,
          pod: { select: { name: true } },
        },
      },
    },
    orderBy: [{ date: 'asc' }, { employee: { name: 'asc' } }],
  });
}

export async function updateEntry(entryId: string, data: { status: string; isLocked?: boolean; note?: string }) {
  return prisma.rosterEntry.update({
    where: { id: entryId },
    data: {
      status: data.status as any,
      isLocked: data.isLocked,
      note: data.note,
      source: 'MANUAL',
    },
  });
}

export async function analyzeChangeImpact(_rosterId: string, _change: any) {
  return { affectedDates: [], newConflicts: [], conflictDelta: 0 };
}

export async function repairRoster(_rosterId: string) {
  return { applied: false, reason: 'Not implemented' };
}

export async function getRosterConflicts(rosterId: string) {
  return prisma.conflict.findMany({
    where: { rosterId },
    orderBy: { severity: 'desc' },
  });
}

export async function publishRoster(rosterId: string) {
  return prisma.roster.update({
    where: { id: rosterId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
}
