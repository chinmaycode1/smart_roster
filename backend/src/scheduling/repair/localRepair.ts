import type {
  RosterEntryData,
  ConflictData,
  GenerationContext,
} from '../types.js';
import { validateRoster } from '../validator/validateRoster.js';
import { buildDemandMap } from '../demand/coverageDemand.js';
import { getAllDatesInMonth } from '../../lib/dates.js';

export interface RepairResult {
  entries: RosterEntryData[];
  conflicts: ConflictData[];
  applied: boolean;
  changes: Array<{ employeeId: string; date: Date; oldStatus: string; newStatus: string }>;
}

export function attemptLocalRepair(
  entries: RosterEntryData[],
  conflicts: ConflictData[],
  context: GenerationContext
): RepairResult {
  let currentEntries = [...entries];
  const changes: RepairResult['changes'] = [];
  let applied = false;

  const errorConflicts = conflicts.filter((c) => c.severity === 'ERROR');

  for (const conflict of errorConflicts) {
    if (conflict.code === 'INSUFFICIENT_COVERAGE' || conflict.code === 'SOLE_OWNER_UNAVAILABLE') {
      const result = repairCoverageGap(currentEntries, conflict, context);
      if (result.applied) {
        currentEntries = result.entries;
        changes.push(...result.changes);
        applied = true;
      }
    }

    if (conflict.code === 'NO_WEEKLY_OFF') {
      const result = repairNoWeeklyOff(currentEntries, conflict, context);
      if (result.applied) {
        currentEntries = result.entries;
        changes.push(...result.changes);
        applied = true;
      }
    }

    if (conflict.code === 'LEAVE_COVERAGE_CLASH') {
      const result = repairLeaveClash(currentEntries, conflict, context);
      if (result.applied) {
        currentEntries = result.entries;
        changes.push(...result.changes);
        applied = true;
      }
    }
  }

  const finalConflicts = validateRoster(currentEntries, context);

  return {
    entries: currentEntries,
    conflicts: finalConflicts,
    applied,
    changes,
  };
}

function repairCoverageGap(
  entries: RosterEntryData[],
  conflict: ConflictData,
  context: GenerationContext
): RepairResult {
  const changes: RepairResult['changes'] = [];
  
  if (!conflict.date || !conflict.brandProcessId) {
    return { entries, conflicts: [], applied: false, changes };
  }

  const conflictDate = conflict.date;
  const { employees, brandProcesses } = context;
  const bp = brandProcesses.find((bp) => bp.id === conflict.brandProcessId);
  if (!bp) {
    return { entries, conflicts: [], applied: false, changes };
  }

  const samePodEmployees = employees.filter((emp) => {
    if (conflict.employeeId && emp.podId === employees.find((e) => e.id === conflict.employeeId)?.podId) {
      return emp.id !== conflict.employeeId;
    }
    return true;
  }).filter((emp) => {
    const entry = entries.find(
      (e) =>
        e.employeeId === emp.id &&
        e.date.toDateString() === conflictDate.toDateString()
    );
    return entry?.status === 'WEEKLY_OFF' && !entry.isLocked;
  });

  if (samePodEmployees.length > 0) {
    const backup = samePodEmployees[0];
    const newEntries = entries.map((e) => {
      if (
        e.employeeId === backup.id &&
        e.date.toDateString() === conflictDate.toDateString()
      ) {
        changes.push({
          employeeId: backup.id,
          date: conflictDate,
          oldStatus: e.status,
          newStatus: 'WORKING',
        });
        return { ...e, status: 'WORKING' as const, source: 'MANUAL' as const };
      }
      return e;
    });

    const weekStart = getWeekStart(conflictDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weekEntries = newEntries.filter(
      (e) =>
        e.employeeId === backup.id &&
        e.date >= weekStart &&
        e.date <= weekEnd &&
        e.status === 'WORKING' &&
        !e.isLocked &&
        e.date.toDateString() !== conflictDate.toDateString()
    );

    if (weekEntries.length > 0) {
      const swapTarget = weekEntries[weekEntries.length - 1];
      const finalEntries = newEntries.map((e) => {
        if (
          e.employeeId === backup.id &&
          e.date.toDateString() === swapTarget.date.toDateString()
        ) {
          changes.push({
            employeeId: backup.id,
            date: swapTarget.date,
            oldStatus: 'WORKING',
            newStatus: 'WEEKLY_OFF',
          });
          return { ...e, status: 'WEEKLY_OFF' as const, source: 'MANUAL' as const };
        }
        return e;
      });

      return {
        entries: finalEntries,
        conflicts: validateRoster(finalEntries, context),
        applied: true,
        changes,
      };
    }

    return {
      entries: newEntries,
      conflicts: validateRoster(newEntries, context),
      applied: true,
      changes,
    };
  }

  return { entries, conflicts: [], applied: false, changes };
}

function repairNoWeeklyOff(
  entries: RosterEntryData[],
  conflict: ConflictData,
  context: GenerationContext
): RepairResult {
  const changes: RepairResult['changes'] = [];
  
  if (!conflict.date || !conflict.employeeId) {
    return { entries, conflicts: [], applied: false, changes };
  }

  const conflictDate = conflict.date;
  const { employees, brandProcesses, holidays } = context;
  const employee = employees.find((e) => e.id === conflict.employeeId);
  if (!employee) {
    return { entries, conflicts: [], applied: false, changes };
  }

  const { month, year } = context;
  const dates = getAllDatesInMonth(year, month);
  const demandMap = buildDemandMap(dates, brandProcesses, holidays);

  const weekStart = getWeekStart(conflictDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekEntries = entries.filter(
    (e) =>
      e.employeeId === conflict.employeeId &&
      e.date >= weekStart &&
      e.date <= weekEnd &&
      e.status === 'WORKING' &&
      !e.isLocked
  );

  const sortedByDemand = weekEntries.sort((a, b) => {
    const demandA = employee.assignments.reduce((sum, assignment) => {
      const dateKey = a.date.toISOString().split('T')[0];
      return sum + (demandMap[assignment.brandProcessId]?.[dateKey] ?? 0);
    }, 0);
    const demandB = employee.assignments.reduce((sum, assignment) => {
      const dateKey = b.date.toISOString().split('T')[0];
      return sum + (demandMap[assignment.brandProcessId]?.[dateKey] ?? 0);
    }, 0);
    return demandA - demandB;
  });

  if (sortedByDemand.length > 0) {
    const targetDate = sortedByDemand[0];
    const newEntries = entries.map((e) => {
      if (
        e.employeeId === conflict.employeeId &&
        e.date.toDateString() === targetDate.date.toDateString()
      ) {
        changes.push({
          employeeId: conflict.employeeId,
          date: targetDate.date,
          oldStatus: 'WORKING',
          newStatus: 'WEEKLY_OFF',
        });
        return { ...e, status: 'WEEKLY_OFF' as const, source: 'MANUAL' as const };
      }
      return e;
    });

    return {
      entries: newEntries,
      conflicts: validateRoster(newEntries, context),
      applied: true,
      changes,
    };
  }

  return { entries, conflicts: [], applied: false, changes };
}

function repairLeaveClash(
  entries: RosterEntryData[],
  conflict: ConflictData,
  context: GenerationContext
): RepairResult {
  const changes: RepairResult['changes'] = [];
  
  if (!conflict.date || !conflict.employeeId) {
    return { entries, conflicts: [], applied: false, changes };
  }

  const newEntries = entries.map((e) => {
    if (
      e.employeeId === conflict.employeeId &&
      e.date.toDateString() === conflict.date!.toDateString() &&
      e.status === 'WORKING'
    ) {
      changes.push({
        employeeId: conflict.employeeId,
        date: e.date,
        oldStatus: 'WORKING',
        newStatus: 'LEAVE',
      });
      return { ...e, status: 'LEAVE' as const, source: 'MANUAL' as const };
    }
    return e;
  });

  return {
    entries: newEntries,
    conflicts: validateRoster(newEntries, context),
    applied: true,
    changes,
  };
}

function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
