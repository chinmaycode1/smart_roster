import { prisma } from '../../lib/prisma.js';
import { generateRoster as generateRosterEngine } from '../../scheduling/index.js';
import { validateRoster } from '../../scheduling/validator/validateRoster.js';
import { attemptLocalRepair } from '../../scheduling/repair/localRepair.js';
import type { GenerationContext, RosterEntryData } from '../../scheduling/types.js';
import type { Prisma } from '@prisma/client';

type EmployeeWithRelations = Prisma.EmployeeGetPayload<{
  include: {
    assignments: true;
    weeklyOffPattern: true;
    leaves: true;
    compOffs: true;
  };
}>;

type BrandProcessWithRelations = Prisma.BrandProcessGetPayload<{
  include: {
    brand: true;
    process: true;
    operatingRule: true;
    coverageOverrides: true;
  };
}>;

async function loadGenerationContext(month: number, year: number): Promise<GenerationContext> {
  const [employees, brandProcesses, holidays] = await Promise.all([
    prisma.employee.findMany({
      include: {
        assignments: true,
        weeklyOffPattern: true,
        leaves: { where: { status: 'APPROVED' } },
        compOffs: true,
      },
    }),
    prisma.brandProcess.findMany({
      include: {
        brand: true,
        process: true,
        operatingRule: true,
        coverageOverrides: true,
      },
    }),
    prisma.publicHoliday.findMany(),
  ]);

  return {
    month,
    year,
    employees: employees.map((emp: EmployeeWithRelations) => ({
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
        status: 'APPROVED' as const,
      })),
      compOffs: emp.compOffs.map((c) => ({
        earnedOn: c.earnedOn,
        redeemOn: c.redeemOn || undefined,
        status: c.status as 'EARNED' | 'REDEEMED' | 'EXPIRED',
      })),
    })),
    brandProcesses: brandProcesses.map((bp: BrandProcessWithRelations) => ({
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
    holidays: holidays.map((h) => ({ date: h.date })),
    lockedEntries: [],
  };
}

async function saveEntriesChunked(rosterId: string, entries: RosterEntryData[], chunkSize = 500, client: Prisma.TransactionClient | typeof prisma = prisma) {
  for (let i = 0; i < entries.length; i += chunkSize) {
    const chunk = entries.slice(i, i + chunkSize);
    await client.rosterEntry.createMany({
      data: chunk.map((entry) => ({
        rosterId,
        employeeId: entry.employeeId,
        date: entry.date,
        status: entry.status,
        source: entry.source,
        isLocked: entry.isLocked,
        note: entry.note,
      })),
    });
  }
}

export async function generateRoster(data: { month: number; year: number; parentVersionId?: string }) {
  const { month, year, parentVersionId } = data;

  const context = await loadGenerationContext(month, year);
  const result = generateRosterEngine(context);

  const nextVersion = parentVersionId
    ? (await prisma.roster.findUnique({ where: { id: parentVersionId }, select: { version: true } }))?.version ?? 0 + 1
    : 1;

  const roster = await prisma.$transaction(async (tx) => {
    const newRoster = await tx.roster.create({
      data: {
        month,
        year,
        version: nextVersion,
        status: 'DRAFT',
        generatedAt: new Date(),
        parentVersionId: parentVersionId || null,
      },
    });

    await saveEntriesChunked(newRoster.id, result.entries, 500, tx);

    if (result.conflicts.length > 0) {
      const conflictsData = result.conflicts.map((c) => ({
        rosterId: newRoster.id,
        severity: c.severity,
        code: c.code,
        brandProcessId: c.brandProcessId,
        employeeId: c.employeeId,
        date: c.date,
        message: c.message,
        suggestedActions: JSON.stringify(c.suggestedActions),
      }));
      for (let i = 0; i < conflictsData.length; i += 500) {
        await tx.conflict.createMany({ data: conflictsData.slice(i, i + 500) });
      }
    }

    await tx.auditLog.create({
      data: {
        entityType: 'Roster',
        entityId: newRoster.id,
        action: parentVersionId ? 'REGENERATE' : 'GENERATE',
        actorRole: 'SYSTEM',
        after: { month, year, version: nextVersion, entriesCount: result.entries.length },
      },
    });

    return newRoster;
  });

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
  const entry = await prisma.rosterEntry.findUnique({
    where: { id: entryId },
    include: { roster: true },
  });
  if (!entry) throw new Error('Entry not found');

  if (entry.isLocked) {
    const error = new Error('Cannot edit locked entry') as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  if (entry.roster.status === 'PUBLISHED') {
    const error = new Error('Cannot edit published roster') as Error & { statusCode: number };
    error.statusCode = 409;
    throw error;
  }

  const oldConflictCount = await prisma.conflict.count({ where: { rosterId: entry.rosterId } });

  const updated = await prisma.rosterEntry.update({
    where: { id: entryId },
    data: {
      status: data.status as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF',
      isLocked: data.isLocked,
      note: data.note,
      source: 'MANUAL',
    },
  });

  const context = await loadGenerationContext(entry.roster.month, entry.roster.year);
  const allEntries = await prisma.rosterEntry.findMany({ where: { rosterId: entry.rosterId } });

  const conflicts = validateRoster(
    allEntries.map((e) => ({
      employeeId: e.employeeId,
      date: e.date,
      status: e.status,
      source: e.source as 'GENERATED' | 'MANUAL',
      isLocked: e.isLocked,
      note: e.note || undefined,
    })),
    context
  );

  await prisma.$transaction(async (tx) => {
    await tx.conflict.deleteMany({ where: { rosterId: entry.rosterId } });

    if (conflicts.length > 0) {
      const conflictsData = conflicts.map((c) => ({
        rosterId: entry.rosterId,
        severity: c.severity,
        code: c.code,
        brandProcessId: c.brandProcessId,
        employeeId: c.employeeId,
        date: c.date,
        message: c.message,
        suggestedActions: JSON.stringify(c.suggestedActions),
      }));
      for (let i = 0; i < conflictsData.length; i += 500) {
        await tx.conflict.createMany({ data: conflictsData.slice(i, i + 500) });
      }
    }

    await tx.auditLog.create({
      data: {
        entityType: 'RosterEntry',
        entityId: entryId,
        action: 'UPDATE',
        actorRole: 'EMPLOYEE',
        before: { status: entry.status },
        after: { status: data.status },
      },
    });
  });

  const errorCount = conflicts.filter(c => c.severity === 'ERROR').length;
  const conflictDelta = conflicts.length - oldConflictCount;

  return {
    entry: updated,
    conflictCount: conflicts.length,
    errorCount,
    conflictDelta,
  };
}

export async function analyzeChangeImpact(rosterId: string, change: { entryId: string; newStatus: string }) {
  const entry = await prisma.rosterEntry.findUnique({ where: { id: change.entryId }, include: { employee: true } });
  if (!entry) return { affectedDates: [], newConflicts: [], conflictDelta: 0 };

  const roster = await prisma.roster.findUnique({ where: { id: rosterId } });
  if (!roster) return { affectedDates: [], newConflicts: [], conflictDelta: 0 };

  const context = await loadGenerationContext(roster.month, roster.year);
  const allEntries = await prisma.rosterEntry.findMany({ where: { rosterId } });

  const updatedEntries = allEntries.map((e) =>
    e.id === change.entryId ? { ...e, status: change.newStatus as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF' } : e
  );

  const conflicts = validateRoster(
    updatedEntries.map((e) => ({
      employeeId: e.employeeId,
      date: e.date,
      status: e.status,
      source: e.source as 'GENERATED' | 'MANUAL',
      isLocked: e.isLocked,
      note: e.note || undefined,
    })),
    context
  );

  const oldConflictCount = await prisma.conflict.count({ where: { rosterId } });
  const conflictDelta = conflicts.length - oldConflictCount;

  return { affectedDates: [entry.date], newConflicts: conflicts, conflictDelta };
}

export async function revalidateRoster(rosterId: string) {
  const roster = await prisma.roster.findUnique({ where: { id: rosterId } });
  if (!roster) {
    return {
      before: { errors: 0, warnings: 0 },
      after: { errors: 0, warnings: 0 },
      newConflicts: [],
    };
  }

  // Get conflicts before revalidation
  const conflictsBefore = await prisma.conflict.findMany({
    where: { rosterId },
    select: { code: true, severity: true, brandProcessId: true, employeeId: true, date: true, message: true },
  });

  const errorsBefore = conflictsBefore.filter((c) => c.severity === 'ERROR').length;
  const warningsBefore = conflictsBefore.filter((c) => c.severity === 'WARNING').length;

  // Reload context (which now includes the new/updated leave)
  const context = await loadGenerationContext(roster.month, roster.year);
  const entries = await prisma.rosterEntry.findMany({ where: { rosterId } });

  // Re-run validation
  const newConflicts = validateRoster(
    entries.map((e) => ({
      employeeId: e.employeeId,
      date: e.date,
      status: e.status as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF',
      source: e.source as 'GENERATED' | 'MANUAL',
      isLocked: e.isLocked,
      note: e.note || undefined,
    })),
    context
  );

  const errorsAfter = newConflicts.filter((c) => c.severity === 'ERROR').length;
  const warningsAfter = newConflicts.filter((c) => c.severity === 'WARNING').length;

  // Find truly new conflicts (not present before)
  const beforeSet = new Set(
    conflictsBefore.map((c) => 
      `${c.code}_${c.employeeId || ''}_${c.brandProcessId || ''}_${c.date?.toISOString().split('T')[0] || ''}`
    )
  );

  const conflictsToReturn = newConflicts.filter((c) => {
    const key = `${c.code}_${c.employeeId || ''}_${c.brandProcessId || ''}_${c.date?.toISOString().split('T')[0] || ''}`;
    return !beforeSet.has(key);
  });

  // If roster is published, return impact only without mutating
  if (roster.status === 'PUBLISHED') {
    return {
      before: { errors: errorsBefore, warnings: warningsBefore },
      after: { errors: errorsAfter, warnings: warningsAfter },
      newConflicts: conflictsToReturn,
    };
  }

  // Store all new conflicts in DB
  await prisma.$transaction(async (tx) => {
    // Clear old conflicts
    await tx.conflict.deleteMany({ where: { rosterId } });

    // Insert new conflicts
    if (newConflicts.length > 0) {
      const conflictsData = newConflicts.map((c) => ({
        rosterId,
        severity: c.severity,
        code: c.code,
        brandProcessId: c.brandProcessId || null,
        employeeId: c.employeeId || null,
        date: c.date || null,
        message: c.message,
        suggestedActions: JSON.stringify(c.suggestedActions),
      }));
      for (let i = 0; i < conflictsData.length; i += 500) {
        await tx.conflict.createMany({ data: conflictsData.slice(i, i + 500) });
      }
    }
  });

  return {
    before: { errors: errorsBefore, warnings: warningsBefore },
    after: { errors: errorsAfter, warnings: warningsAfter },
    newConflicts: conflictsToReturn,
  };
}

export async function repairRoster(rosterId: string) {
  const roster = await prisma.roster.findUnique({ where: { id: rosterId } });
  if (!roster) return { applied: false, reason: 'Roster not found' };

  const context = await loadGenerationContext(roster.month, roster.year);
  const entries = await prisma.rosterEntry.findMany({ where: { rosterId } });

  const result = attemptLocalRepair(
    entries.map((e) => ({
      employeeId: e.employeeId,
      date: e.date,
      status: e.status as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF',
      source: e.source as 'GENERATED' | 'MANUAL',
      isLocked: e.isLocked,
      note: e.note || undefined,
    })),
    validateRoster(
      entries.map((e) => ({
        employeeId: e.employeeId,
        date: e.date,
        status: e.status as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF',
        source: e.source as 'GENERATED' | 'MANUAL',
        isLocked: e.isLocked,
        note: e.note || undefined,
      })),
      context
    ),
    context
  );

  if (!result.applied) return { applied: false, reason: 'No applicable swaps found' };

  await prisma.$transaction(async (tx) => {
    for (const change of result.changes) {
      await tx.rosterEntry.updateMany({
        where: { rosterId, employeeId: change.employeeId, date: change.date },
        data: { status: change.newStatus as 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF', source: 'MANUAL' },
      });
    }

    await tx.auditLog.create({
      data: {
        entityType: 'Roster',
        entityId: rosterId,
        action: 'REPAIR',
        actorRole: 'SYSTEM',
        after: { changesApplied: result.changes.length, changes: result.changes },
      },
    });
  });

  return { applied: true, changes: result.changes };
}

export async function getRosterConflicts(rosterId: string) {
  return prisma.conflict.findMany({
    where: { rosterId },
    orderBy: { severity: 'desc' },
  });
}

export async function publishRoster(rosterId: string) {
  const roster = await prisma.roster.update({
    where: { id: rosterId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'Roster',
      entityId: rosterId,
      action: 'PUBLISH',
      actorRole: 'SYSTEM',
      after: { status: 'PUBLISHED', publishedAt: roster.publishedAt },
    },
  });

  return roster;
}

export async function requestApproval(rosterId: string, actorId?: string) {
  const roster = await prisma.roster.update({
    where: { id: rosterId },
    data: { status: 'PENDING_APPROVAL' },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'Roster',
      entityId: rosterId,
      action: 'REQUEST_APPROVAL',
      actorRole: 'EMPLOYEE',
      actorId: actorId || null,
      after: { status: 'PENDING_APPROVAL' },
    },
  });

  return roster;
}

export async function approveRoster(rosterId: string, actorId?: string) {
  const roster = await prisma.roster.update({
    where: { id: rosterId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'Roster',
      entityId: rosterId,
      action: 'APPROVE',
      actorRole: 'POD_LEAD',
      actorId: actorId || null,
      after: { status: 'PUBLISHED', publishedAt: roster.publishedAt },
    },
  });

  return roster;
}

export async function rejectRoster(rosterId: string, reason: string, actorId?: string) {
  const roster = await prisma.roster.update({
    where: { id: rosterId },
    data: { status: 'DRAFT' },
  });

  await prisma.auditLog.create({
    data: {
      entityType: 'Roster',
      entityId: rosterId,
      action: 'REJECT',
      actorRole: 'POD_LEAD',
      actorId: actorId || null,
      after: { status: 'DRAFT', reason },
    },
  });

  return roster;
}

export async function getAuditLogs(rosterId: string) {
  return prisma.auditLog.findMany({
    where: { entityType: 'Roster', entityId: rosterId },
    orderBy: { createdAt: 'desc' },
    include: { actor: { select: { id: true, name: true } } },
  });
}

export async function compareVersions(rosterId: string, compareToId: string) {
  const [current, compareTo] = await Promise.all([
    prisma.rosterEntry.findMany({ where: { rosterId }, orderBy: [{ date: 'asc' }, { employeeId: 'asc' }] }),
    prisma.rosterEntry.findMany({ where: { rosterId: compareToId }, orderBy: [{ date: 'asc' }, { employeeId: 'asc' }] }),
  ]);

  const changes: Array<{ date: Date; employeeId: string; before: string; after: string }> = [];
  const compareMap = new Map(compareTo.map((e) => [`${e.employeeId}-${e.date.toISOString()}`, e]));

  for (const entry of current) {
    const key = `${entry.employeeId}-${entry.date.toISOString()}`;
    const prev = compareMap.get(key);
    if (!prev || prev.status !== entry.status) {
      changes.push({
        date: entry.date,
        employeeId: entry.employeeId,
        before: prev?.status || 'NONE',
        after: entry.status,
      });
    }
  }

  return { changes };
}

export async function exportRosterCSV(rosterId: string) {
  const entries = await prisma.rosterEntry.findMany({
    where: { rosterId },
    include: { employee: { select: { name: true, code: true } } },
    orderBy: [{ date: 'asc' }, { employee: { name: 'asc' } }],
  });

  const rows = [['Date', 'Employee Code', 'Employee Name', 'Status', 'Source', 'Note']];
  for (const e of entries) {
    rows.push([
      e.date.toISOString().split('T')[0],
      e.employee.code,
      e.employee.name,
      e.status,
      e.source,
      e.note || '',
    ]);
  }

  return rows.map((r) => r.join(',')).join('\n');
}

export async function getRosterViewData(rosterId: string) {
  const roster = await prisma.roster.findUnique({ where: { id: rosterId } });
  if (!roster) throw new Error('Roster not found');

  const entries = await prisma.rosterEntry.findMany({
    where: { rosterId },
    include: {
      employee: {
        include: {
          pod: true,
          assignments: {
            include: {
              brandProcess: {
                include: {
                  brand: true,
                  process: true,
                  operatingRule: true,
                  coverageOverrides: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const employees = new Map<string, {
    id: string;
    code: string;
    name: string;
    podId: string;
    podName: string;
    podCode: string;
    isPodLead: boolean;
  }>();

  entries.forEach((e) => {
    if (!employees.has(e.employee.id)) {
      employees.set(e.employee.id, {
        id: e.employee.id,
        code: e.employee.code,
        name: e.employee.name,
        podId: e.employee.podId,
        podName: e.employee.pod.name,
        podCode: e.employee.pod.id,
        isPodLead: e.employee.pod.leadEmployeeId === e.employee.id,
      });
    }
  });

  const brandProcessMap = new Map<string, {
    id: string;
    brandId: string;
    brandName: string;
    brandCode: string;
    processId: string;
    processName: string;
    processCode: string;
    operatingRuleType: string;
    defaultMinCoverage: number;
    assignedEmployeeIds: string[];
  }>();

  const allBrandProcesses = await prisma.brandProcess.findMany({
    include: {
      brand: true,
      process: true,
      operatingRule: true,
      assignments: {
        select: { employeeId: true },
      },
    },
  });

  allBrandProcesses.forEach((bp) => {
    brandProcessMap.set(bp.id, {
      id: bp.id,
      brandId: bp.brandId,
      brandName: bp.brand.name,
      brandCode: bp.brand.code,
      processId: bp.processId,
      processName: bp.process.name,
      processCode: bp.process.code,
      operatingRuleType: bp.operatingRule.type,
      defaultMinCoverage: bp.defaultMinCoverage,
      assignedEmployeeIds: bp.assignments.map((a) => a.employeeId),
    });
  });

  const holidays = await prisma.publicHoliday.findMany();

  return {
    employees: Array.from(employees.values()),
    brandProcesses: Array.from(brandProcessMap.values()),
    holidays: holidays.map((h) => ({ date: h.date.toISOString().split('T')[0] })),
  };
}
