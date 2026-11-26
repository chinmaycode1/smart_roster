import type {
  ConflictData,
  GenerationContext,
  SuggestedAction,
  EmployeeData,
  BrandProcessData,
  RosterEntryData,
} from '../types.js';

export function generateResolutionSuggestions(
  conflict: ConflictData,
  context: GenerationContext,
  entries: RosterEntryData[]
): SuggestedAction[] {
  switch (conflict.code) {
    case 'INSUFFICIENT_COVERAGE':
      return suggestBackupAssignments(conflict, context, entries);
    
    case 'SOLE_OWNER_UNAVAILABLE':
      return suggestSoleOwnerBackup(conflict, context, entries);
    
    case 'NO_WEEKLY_OFF':
      return suggestWeeklyOffAddition(conflict, context, entries);
    
    case 'MAX_CONSECUTIVE_DAYS_EXCEEDED':
      return suggestRestDay(conflict, context, entries);
    
    case 'LEAVE_CLASH':
    case 'COMP_OFF_CLASH':
      return suggestCoverageAdjustment(conflict, context, entries);
    
    case 'FIXED_OFF_DAY_VIOLATION':
      return suggestAlternateCoverage(conflict, context, entries);
    
    default:
      return [];
  }
}

function suggestBackupAssignments(
  conflict: ConflictData,
  context: GenerationContext,
  entries: RosterEntryData[]
): SuggestedAction[] {
  if (!conflict.brandProcessId || !conflict.date) return [];

  const conflictDate = conflict.date;
  const { employees, brandProcesses } = context;
  const bp = brandProcesses.find((bp) => bp.id === conflict.brandProcessId);
  if (!bp) return [];

  const availableEmployees = employees.filter((emp) => {
    const entry = entries.find(
      (e) =>
        e.employeeId === emp.id &&
        e.date.toDateString() === conflictDate.toDateString()
    );
    
    const isAlreadyAssigned = emp.assignments.some((a) => a.brandProcessId === bp.id);
    return !isAlreadyAssigned && (!entry || entry.status === 'WEEKLY_OFF');
  });

  const rankedCandidates = rankBackupCandidates(availableEmployees, bp, context);

  return rankedCandidates.slice(0, 3).map((emp, index) => {
    const samePod = employees.find((e) => e.id === conflict.employeeId)?.podId === emp.podId;
    const priority = index === 0 ? 'Best match' : samePod ? 'Same pod' : 'Available';

    return {
      type: 'ASSIGN_BACKUP',
      description: `Assign ${emp.name} (${priority})`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: conflictDate,
      impact: samePod
        ? 'Same pod member, minimal training needed'
        : 'Cross-pod assignment, may need handover',
    };
  });
}

function suggestSoleOwnerBackup(
  conflict: ConflictData,
  context: GenerationContext,
  entries: RosterEntryData[]
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];

  if (!conflict.employeeId || !conflict.date || !conflict.brandProcessId) {
    return suggestions;
  }

  const { employees } = context;
  const soleOwner = employees.find((e) => e.id === conflict.employeeId);
  if (!soleOwner) return suggestions;

  const conflictDate = conflict.date;

  const entry = entries.find(
    (e) =>
      e.employeeId === conflict.employeeId &&
      e.date.toDateString() === conflictDate.toDateString()
  );

  if (entry && entry.status === 'WEEKLY_OFF' && !entry.isLocked) {
    const weekStart = getWeekStart(conflictDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    suggestions.push({
      type: 'SWAP_WEEKLY_OFF',
      description: `Swap ${soleOwner.name}'s weekly off to another day this week`,
      employeeId: soleOwner.id,
      employeeName: soleOwner.name,
      date: conflictDate,
      impact: 'Sole owner works on this day, gets compensatory off',
    });
  }

  const samePodBackups = employees.filter(
    (emp) =>
      emp.id !== soleOwner.id &&
      emp.podId === soleOwner.podId &&
      !emp.assignments.some((a) => a.brandProcessId === conflict.brandProcessId)
  );

  suggestions.push(
    ...samePodBackups.slice(0, 2).map((emp) => ({
      type: 'ASSIGN_BACKUP' as const,
      description: `Assign ${emp.name} from same pod as temporary backup`,
      employeeId: emp.id,
      employeeName: emp.name,
      date: conflictDate,
      impact: 'Same pod member can cover with minimal training',
    }))
  );

  return suggestions;
}

function suggestWeeklyOffAddition(
  conflict: ConflictData,
  context: GenerationContext,
  entries: RosterEntryData[]
): SuggestedAction[] {
  if (!conflict.employeeId || !conflict.date) return [];

  const { employees } = context;
  const employee = employees.find((e) => e.id === conflict.employeeId);
  if (!employee) return [];

  const weekStart = getWeekStart(conflict.date);
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

  const preferredDays = employee.weeklyOffPattern?.preferredOffDays || [];
  const preferredDayEntry = weekEntries.find((e) =>
    preferredDays.includes(e.date.getDay())
  );

  const suggestions: SuggestedAction[] = [];

  if (preferredDayEntry) {
    suggestions.push({
      type: 'MOVE_WEEKLY_OFF',
      description: `Add weekly off on preferred day (${getDayName(preferredDayEntry.date.getDay())})`,
      employeeId: employee.id,
      employeeName: employee.name,
      date: preferredDayEntry.date,
      impact: 'Aligns with employee preference',
    });
  }

  weekEntries.slice(0, 2).forEach((entry) => {
    if (!preferredDayEntry || entry.date.toDateString() !== preferredDayEntry.date.toDateString()) {
      suggestions.push({
        type: 'MOVE_WEEKLY_OFF',
        description: `Add weekly off on ${entry.date.toISOString().split('T')[0]}`,
        employeeId: employee.id,
        employeeName: employee.name,
        date: entry.date,
        impact: 'May require coverage adjustment',
      });
    }
  });

  return suggestions.slice(0, 3);
}

function suggestRestDay(
  conflict: ConflictData,
  context: GenerationContext,
  _entries: RosterEntryData[]
): SuggestedAction[] {
  if (!conflict.employeeId || !conflict.date) return [];

  const { employees } = context;
  const employee = employees.find((e) => e.id === conflict.employeeId);
  if (!employee) return [];

  return [
    {
      type: 'MOVE_WEEKLY_OFF',
      description: `Add mandatory rest day for ${employee.name}`,
      employeeId: employee.id,
      employeeName: employee.name,
      date: conflict.date,
      impact: `Employee exceeded max ${employee.maxConsecutiveWorkDays} consecutive work days`,
    },
  ];
}

function suggestCoverageAdjustment(
  conflict: ConflictData,
  _context: GenerationContext,
  _entries: RosterEntryData[]
): SuggestedAction[] {
  if (!conflict.employeeId || !conflict.date) return [];

  return [
    {
      type: 'ADJUST_COVERAGE',
      description: 'Find alternate coverage for this date',
      date: conflict.date,
      impact: 'Approved leave/comp-off must be honored',
    },
  ];
}

function suggestAlternateCoverage(
  conflict: ConflictData,
  context: GenerationContext,
  entries: RosterEntryData[]
): SuggestedAction[] {
  if (!conflict.employeeId || !conflict.date) return [];

  const { employees } = context;
  const employee = employees.find((e) => e.id === conflict.employeeId);
  if (!employee) return [];

  const availableBackups = employees.filter((emp) => {
    if (emp.id === employee.id) return false;

    const entry = entries.find(
      (e) =>
        e.employeeId === emp.id &&
        e.date.toDateString() === conflict.date!.toDateString()
    );
    
    return !entry || entry.status === 'WEEKLY_OFF';
  });

  const conflictDate = conflict.date;
  return availableBackups.slice(0, 3).map((emp) => ({
    type: 'ASSIGN_BACKUP',
    description: `Assign ${emp.name} to cover fixed off day`,
    employeeId: emp.id,
    employeeName: emp.name,
    date: conflictDate,
    impact: 'Fixed weekly off pattern must be respected',
  }));
}

function rankBackupCandidates(
  candidates: EmployeeData[],
  bp: BrandProcessData,
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
  bp: BrandProcessData,
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

function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDayName(weekday: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[weekday];
}
