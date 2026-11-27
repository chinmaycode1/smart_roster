import { prisma } from '../../lib/prisma.js';
import { analyzeFairness } from '../../scheduling/fairness/fairnessAnalyzer.js';
import type { Prisma } from '@prisma/client';

type RosterEntryWithEmployee = Prisma.RosterEntryGetPayload<{
  include: { employee: true };
}>;

type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: {
    weeklyOffPattern: true;
    assignments: true;
    leaves: true;
    compOffs: true;
  };
}>;

export async function generateFairnessReport(rosterId: string) {
  const entries = await prisma.rosterEntry.findMany({
    where: { rosterId },
    include: { employee: true },
  });

  const employees = await prisma.employee.findMany({
    include: {
      weeklyOffPattern: true,
      assignments: true,
      leaves: true,
      compOffs: true,
    },
  });

  const holidays = await prisma.publicHoliday.findMany();

  const rosterEntries = entries.map((e: RosterEntryWithEmployee) => ({
    employeeId: e.employeeId,
    date: e.date,
    status: e.status as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF',
    source: e.source as 'GENERATED' | 'MANUAL',
    isLocked: e.isLocked,
    note: e.note || undefined,
  }));

  const employeeData = employees.map((emp: EmployeeWithRelations) => ({
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
    })),
    weeklyOffPattern: emp.weeklyOffPattern ? {
      preferredOffDays: emp.weeklyOffPattern.preferredOffDays,
      fixedOffDays: emp.weeklyOffPattern.fixedOffDays,
      isFixed: emp.weeklyOffPattern.isFixed,
    } : undefined,
    leaves: emp.leaves.map((l) => ({
      startDate: l.startDate,
      endDate: l.endDate,
      status: l.status as 'PENDING' | 'APPROVED' | 'REJECTED',
    })),
    compOffs: emp.compOffs.map((c) => ({
      earnedOn: c.earnedOn,
      redeemOn: c.redeemOn || undefined,
      status: c.status as 'EARNED' | 'REDEEMED' | 'EXPIRED',
    })),
  }));

  const holidayData = holidays.map((h) => ({ date: h.date }));

  return analyzeFairness(rosterEntries, employeeData, holidayData);
}

export async function generateCoverageReport(rosterId: string) {
  const entries = await prisma.rosterEntry.findMany({
    where: { rosterId },
    include: {
      employee: { include: { assignments: { include: { brandProcess: { include: { brand: true, process: true } } } } } },
    },
  });

  const brandProcessMap = new Map<string, { brand: string; process: string; dates: Map<string, number> }>();

  entries.forEach((entry) => {
    if (entry.status !== 'WORKING') return;
    entry.employee.assignments.forEach((assignment) => {
      const bp = assignment.brandProcess;
      const key = bp.id;
      if (!brandProcessMap.has(key)) {
        brandProcessMap.set(key, {
          brand: bp.brand.name,
          process: bp.process.name,
          dates: new Map(),
        });
      }
      const dateKey = entry.date.toISOString().split('T')[0];
      const current = brandProcessMap.get(key)!.dates.get(dateKey) || 0;
      brandProcessMap.get(key)!.dates.set(dateKey, current + 1);
    });
  });

  return Array.from(brandProcessMap.values()).map((item) => ({
    brand: item.brand,
    process: item.process,
    totalWorkingDays: item.dates.size,
    averageCoverage: Array.from(item.dates.values()).reduce((a, b) => a + b, 0) / item.dates.size,
  }));
}

export async function exportToCSV(rosterId: string) {
  const entries = await prisma.rosterEntry.findMany({
    where: { rosterId },
    include: { employee: { include: { pod: true } } },
    orderBy: [{ date: 'asc' }, { employee: { name: 'asc' } }],
  });

  const headers = ['Date', 'Employee Code', 'Employee Name', 'Pod', 'Status', 'Source', 'Locked', 'Note'];
  const rows = entries.map((e) => [
    e.date.toISOString().split('T')[0],
    e.employee.code,
    e.employee.name,
    e.employee.pod.name,
    e.status,
    e.source,
    e.isLocked ? 'Yes' : 'No',
    e.note || '',
  ]);

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
}
