import type {
  RosterEntryData,
  ConflictData,
  GenerationContext,
  EmployeeData,
} from '../types.js';
import { validateRoster } from '../validator/validateRoster.js';

export interface RepairResult {
  entries: RosterEntryData[];
  conflicts: ConflictData[];
  applied: boolean;
  reason?: string;
}

export function attemptLocalRepair(
  entries: RosterEntryData[],
  conflicts: ConflictData[],
  context: GenerationContext
): RepairResult {
  let currentEntries = [...entries];
  let currentConflicts = [...conflicts];
  let applied = false;

  const errorConflicts = conflicts.filter((c) => c.severity === 'ERROR');

  for (const conflict of errorConflicts) {
    if (conflict.code === 'INSUFFICIENT_COVERAGE') {
      const result = repairInsufficientCoverage(currentEntries, conflict, context);
      if (result.applied) {
        currentEntries = result.entries;
        currentConflicts = validateRoster(currentEntries, context);
        applied = true;
        break;
      }
    }

    if (conflict.code === 'SOLE_OWNER_UNAVAILABLE') {
      const result = repairSoleOwnerUnavailable(currentEntries, conflict, context);
      if (result.applied) {
        currentEntries = result.entries;
        currentConflicts = validateRoster(currentEntries, context);
        applied = true;
        break;
      }
    }

    if (conflict.code === 'NO_WEEKLY_OFF') {
      const result = repairNoWeeklyOff(currentEntries, conflict, context);
      if (result.applied) {
        currentEntries = result.entries;
        currentConflicts = validateRoster(currentEntries, context);
        applied = true;
        break;
      }
    }
  }

  return {
    entries: currentEntries,
    conflicts: currentConflicts,
    applied,
    reason: applied ? 'Applied local repair' : 'No applicable repair found',
  };
}

function repairInsufficientCoverage(
  entries: RosterEntryData[],
  conflict: ConflictData,
  context: GenerationContext
): RepairResult {
  if (!conflict.date || !conflict.brandProcessId) {
    return { entries, conflicts: [], applied: false };
  }

  const conflictDate = conflict.date;
  const { employees, brandProcesses } = context;
  const bp = brandProcesses.find((bp) => bp.id === conflict.brandProcessId);
  if (!bp) {
    return { entries, conflicts: [], applied: false };
  }

  const availableBackups = employees.filter((emp) => {
    const entry = entries.find(
      (e) =>
        e.employeeId === emp.id &&
        e.date.toDateString() === conflictDate.toDateString()
    );

    const isAlreadyAssigned = emp.assignments.some((a) => a.brandProcessId === bp.id);
    if (isAlreadyAssigned && entry?.status === 'WORKING') {
      return false;
    }

    return !entry || entry.status === 'WEEKLY_OFF';
  });

  if (availableBackups.length === 0) {
    return { entries, conflicts: [], applied: false };
  }

  const backup = rankBackupCandidates(availableBackups, bp, context)[0];
  if (!backup) {
    return { entries, conflicts: [], applied: false };
  }

  const newEntries = [...entries];
  const existingEntry = newEntries.find(
    (e) =>
      e.employeeId === backup.id &&
      e.date.toDateString() === conflictDate.toDateString()
  );

  if (existingEntry) {
    existingEntry.status = 'WORKING';
    existingEntry.source = 'MANUAL';
    existingEntry.note = `Auto-assigned as backup for ${bp.brandName} - ${bp.processName}`;
  } else {
    newEntries.push({
      employeeId: backup.id,
      date: conflictDate,
      status: 'WORKING',
      source: 'MANUAL',
      isLocked: false,
      note: `Auto-assigned as backup for ${bp.brandName} - ${bp.processName}`,
    });
  }

  return {
    entries: newEntries,
    conflicts: validateRoster(newEntries, context),
    applied: true,
  };
}

function repairSoleOwnerUnavailable(
  entries: RosterEntryData[],
  conflict: ConflictData,
  context: GenerationContext
): RepairResult {
  if (!conflict.date || !conflict.brandProcessId || !conflict.employeeId) {
    return { entries, conflicts: [], applied: false };
  }

  const conflictDate = conflict.date;
  const { employees, brandProcesses } = context;
  const bp = brandProcesses.find((bp) => bp.id === conflict.brandProcessId);
  if (!bp) {
    return { entries, conflicts: [], applied: false };
  }

  const soleOwner = employees.find((e) => e.id === conflict.employeeId);
  if (!soleOwner) {
    return { entries, conflicts: [], applied: false };
  }

  const entry = entries.find(
    (e) =>
      e.employeeId === conflict.employeeId &&
      e.date.toDateString() === conflictDate.toDateString()
  );

  if (entry && entry.status === 'WEEKLY_OFF' && !entry.isLocked) {
    const newEntries = entries.map((e) => {
      if (
        e.employeeId === conflict.employeeId &&
        e.date.toDateString() === conflictDate.toDateString()
      ) {
        return {
          ...e,
          status: 'WORKING' as const,
          source: 'MANUAL' as const,
          note: 'Moved weekly off to cover sole-owner responsibility',
        };
      }
      return e;
    });

    const weekEntries = newEntries.filter(
      (e) =>
        e.employeeId === conflict.employeeId &&
        isInSameWeek(e.date, conflictDate)
    );

    const availableForOff = weekEntries.find(
      (e) => e.status === 'WORKING' && !e.isLocked && e.date.toDateString() !== conflictDate.toDateString()
    );

    if (availableForOff) {
      availableForOff.status = 'WEEKLY_OFF';
      availableForOff.source = 'MANUAL';
      availableForOff.note = 'Swapped from previous weekly off';
    }

    return {
      entries: newEntries,
      conflicts: validateRoster(newEntries, context),
      applied: true,
    };
  }

  return { entries, conflicts: [], applied: false };
}

function repairNoWeeklyOff(
  entries: RosterEntryData[],
  conflict: ConflictData,
  context: GenerationContext
): RepairResult {
  if (!conflict.date || !conflict.employeeId) {
    return { entries, conflicts: [], applied: false };
  }

  const conflictDate = conflict.date;
  const { employees, brandProcesses, holidays } = context;
  const employee = employees.find((e) => e.id === conflict.employeeId);
  if (!employee) {
    return { entries, conflicts: [], applied: false };
  }

  const weekEntries = entries.filter(
    (e) =>
      e.employeeId === conflict.employeeId &&
      isInSameWeek(e.date, conflictDate)
  );

  const workingEntries = weekEntries
    .filter((e) => e.status === 'WORKING' && !e.isLocked)
    .sort((a, b) => {
      const scoreA = getOffDayScore(a.date, employee, brandProcesses, holidays, entries);
      const scoreB = getOffDayScore(b.date, employee, brandProcesses, holidays, entries);
      return scoreA - scoreB;
    });

  if (workingEntries.length === 0) {
    return { entries, conflicts: [], applied: false };
  }

  const bestDay = workingEntries[0];
  const newEntries = entries.map((e) => {
    if (
      e.employeeId === conflict.employeeId &&
      e.date.toDateString() === bestDay.date.toDateString()
    ) {
      return {
        ...e,
        status: 'WEEKLY_OFF' as const,
        source: 'MANUAL' as const,
        note: 'Added weekly off to satisfy minimum rest requirement',
      };
    }
    return e;
  });

  return {
    entries: newEntries,
    conflicts: validateRoster(newEntries, context),
    applied: true,
  };
}

function rankBackupCandidates(
  candidates: EmployeeData[],
  bp: { brandId: string; processId: string },
  context: GenerationContext
): EmployeeData[] {
  return candidates.sort((a, b) => {
    const scoreA = getBackupScore(a, bp, context);
    const scoreB = getBackupScore(b, bp, context);
    return scoreB - scoreA;
  });
}

function getBackupScore(
  employee: EmployeeData,
  bp: { brandId: string; processId: string },
  context: GenerationContext
): number {
  let score = 0;

  const sameBrandAssignment = employee.assignments.find((a) => {
    const empBp = context.brandProcesses.find((x) => x.id === a.brandProcessId);
    return empBp?.brandId === bp.brandId;
  });
  if (sameBrandAssignment) score += 50;

  const sameProcessAssignment = employee.assignments.find((a) => {
    const empBp = context.brandProcesses.find((x) => x.id === a.brandProcessId);
    return empBp?.processId === bp.processId;
  });
  if (sameProcessAssignment) score += 30;

  const totalAllocation = employee.assignments.reduce((sum, a) => sum + a.allocationPercent, 0);
  if (totalAllocation < 100) {
    score += 100 - totalAllocation;
  }

  return score;
}

function getOffDayScore(
  date: Date,
  employee: EmployeeData,
  brandProcesses: { id: string }[],
  _holidays: { date: Date }[],
  _entries: RosterEntryData[]
): number {
  let score = 0;

  const preferredDays = employee.weeklyOffPattern?.preferredOffDays || [];
  const weekday = date.getDay();
  if (preferredDays.includes(weekday)) {
    score -= 20;
  }

  const assignmentCount = employee.assignments.filter((a) =>
    brandProcesses.some((bp) => bp.id === a.brandProcessId)
  ).length;
  score += assignmentCount * 10;

  return score;
}

function isInSameWeek(date1: Date, date2: Date): boolean {
  const getWeekStart = (d: Date) => {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  };

  return getWeekStart(date1) === getWeekStart(date2);
}
