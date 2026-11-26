import type {
  RosterEntryData,
  ConflictData,
  GenerationContext,
  LeaveData,
} from '../types.js';
import { validateRoster } from '../validator/validateRoster.js';

export interface ChangeImpactResult {
  affectedDates: Date[];
  newConflicts: ConflictData[];
  resolvedConflicts: ConflictData[];
  conflictDelta: number;
  affectedEmployees: string[];
  affectedBrandProcesses: string[];
  summary: string;
}

export function analyzeLeaveApprovalImpact(
  leave: LeaveData,
  employeeId: string,
  currentEntries: RosterEntryData[],
  currentConflicts: ConflictData[],
  context: GenerationContext
): ChangeImpactResult {
  const affectedDates: Date[] = [];
  let currentDate = new Date(leave.startDate);

  while (currentDate <= leave.endDate) {
    affectedDates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const updatedContext: GenerationContext = {
    ...context,
    employees: context.employees.map((emp) => {
      if (emp.id === employeeId) {
        return {
          ...emp,
          leaves: [...emp.leaves, { ...leave, status: 'APPROVED' as const }],
        };
      }
      return emp;
    }),
  };

  const updatedEntries = currentEntries.map((entry) => {
    if (
      entry.employeeId === employeeId &&
      affectedDates.some((d) => d.toDateString() === entry.date.toDateString())
    ) {
      return {
        ...entry,
        status: 'LEAVE' as const,
        source: 'GENERATED' as const,
      };
    }
    return entry;
  });

  const newConflicts = validateRoster(updatedEntries, updatedContext);

  const resolvedConflicts = currentConflicts.filter(
    (old) =>
      !newConflicts.some(
        (nc) =>
          nc.code === old.code &&
          nc.employeeId === old.employeeId &&
          nc.brandProcessId === old.brandProcessId &&
          nc.date?.toDateString() === old.date?.toDateString()
      )
  );

  const addedConflicts = newConflicts.filter(
    (nc) =>
      !currentConflicts.some(
        (old) =>
          nc.code === old.code &&
          nc.employeeId === old.employeeId &&
          nc.brandProcessId === old.brandProcessId &&
          nc.date?.toDateString() === old.date?.toDateString()
      )
  );

  const affectedEmployees = new Set([employeeId]);
  const affectedBrandProcesses = new Set<string>();

  for (const conflict of addedConflicts) {
    if (conflict.employeeId) affectedEmployees.add(conflict.employeeId);
    if (conflict.brandProcessId) affectedBrandProcesses.add(conflict.brandProcessId);
  }

  const employee = context.employees.find((e) => e.id === employeeId);
  const employeeName = employee?.name || employeeId;

  let summary = `Approving leave for ${employeeName} (${affectedDates.length} days) `;
  if (addedConflicts.length > 0) {
    summary += `will create ${addedConflicts.length} new conflict(s)`;
  } else {
    summary += 'will not create conflicts';
  }

  if (resolvedConflicts.length > 0) {
    summary += ` and resolve ${resolvedConflicts.length} existing conflict(s)`;
  }

  return {
    affectedDates,
    newConflicts: addedConflicts,
    resolvedConflicts,
    conflictDelta: addedConflicts.length - resolvedConflicts.length,
    affectedEmployees: Array.from(affectedEmployees),
    affectedBrandProcesses: Array.from(affectedBrandProcesses),
    summary,
  };
}

export function analyzeManualEditImpact(
  employeeId: string,
  date: Date,
  newStatus: 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF',
  currentEntries: RosterEntryData[],
  currentConflicts: ConflictData[],
  context: GenerationContext
): ChangeImpactResult {
  const updatedEntries = currentEntries.map((entry) => {
    if (
      entry.employeeId === employeeId &&
      entry.date.toDateString() === date.toDateString()
    ) {
      return {
        ...entry,
        status: newStatus,
        source: 'MANUAL' as const,
        isLocked: true,
      };
    }
    return entry;
  });

  const entryExists = currentEntries.some(
    (e) =>
      e.employeeId === employeeId &&
      e.date.toDateString() === date.toDateString()
  );

  if (!entryExists) {
    updatedEntries.push({
      employeeId,
      date,
      status: newStatus,
      source: 'MANUAL',
      isLocked: true,
    });
  }

  const newConflicts = validateRoster(updatedEntries, context);

  const resolvedConflicts = currentConflicts.filter(
    (old) =>
      !newConflicts.some(
        (nc) =>
          nc.code === old.code &&
          nc.employeeId === old.employeeId &&
          nc.brandProcessId === old.brandProcessId &&
          nc.date?.toDateString() === old.date?.toDateString()
      )
  );

  const addedConflicts = newConflicts.filter(
    (nc) =>
      !currentConflicts.some(
        (old) =>
          nc.code === old.code &&
          nc.employeeId === old.employeeId &&
          nc.brandProcessId === old.brandProcessId &&
          nc.date?.toDateString() === old.date?.toDateString()
      )
  );

  const affectedEmployees = new Set([employeeId]);
  const affectedBrandProcesses = new Set<string>();

  for (const conflict of [...addedConflicts, ...resolvedConflicts]) {
    if (conflict.employeeId) affectedEmployees.add(conflict.employeeId);
    if (conflict.brandProcessId) affectedBrandProcesses.add(conflict.brandProcessId);
  }

  const employee = context.employees.find((e) => e.id === employeeId);
  const employeeName = employee?.name || employeeId;

  let summary = `Changing ${employeeName} to ${newStatus} on ${date.toISOString().split('T')[0]} `;
  if (addedConflicts.length > 0) {
    summary += `will create ${addedConflicts.length} new conflict(s)`;
  } else {
    summary += 'will not create conflicts';
  }

  if (resolvedConflicts.length > 0) {
    summary += ` and resolve ${resolvedConflicts.length} existing conflict(s)`;
  }

  return {
    affectedDates: [date],
    newConflicts: addedConflicts,
    resolvedConflicts,
    conflictDelta: addedConflicts.length - resolvedConflicts.length,
    affectedEmployees: Array.from(affectedEmployees),
    affectedBrandProcesses: Array.from(affectedBrandProcesses),
    summary,
  };
}

export function analyzeWeeklyOffSwapImpact(
  employeeId: string,
  fromDate: Date,
  toDate: Date,
  currentEntries: RosterEntryData[],
  currentConflicts: ConflictData[],
  context: GenerationContext
): ChangeImpactResult {
  const updatedEntries = currentEntries.map((entry) => {
    if (entry.employeeId === employeeId) {
      if (entry.date.toDateString() === fromDate.toDateString()) {
        return {
          ...entry,
          status: 'WORKING' as const,
          source: 'MANUAL' as const,
        };
      }
      if (entry.date.toDateString() === toDate.toDateString()) {
        return {
          ...entry,
          status: 'WEEKLY_OFF' as const,
          source: 'MANUAL' as const,
        };
      }
    }
    return entry;
  });

  const newConflicts = validateRoster(updatedEntries, context);

  const resolvedConflicts = currentConflicts.filter(
    (old) =>
      !newConflicts.some(
        (nc) =>
          nc.code === old.code &&
          nc.employeeId === old.employeeId &&
          nc.brandProcessId === old.brandProcessId &&
          nc.date?.toDateString() === old.date?.toDateString()
      )
  );

  const addedConflicts = newConflicts.filter(
    (nc) =>
      !currentConflicts.some(
        (old) =>
          nc.code === old.code &&
          nc.employeeId === old.employeeId &&
          nc.brandProcessId === old.brandProcessId &&
          nc.date?.toDateString() === old.date?.toDateString()
      )
  );

  const employee = context.employees.find((e) => e.id === employeeId);
  const employeeName = employee?.name || employeeId;

  const summary = `Swapping ${employeeName}'s weekly off from ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]} will ${
    addedConflicts.length > 0
      ? `create ${addedConflicts.length} conflict(s)`
      : 'not create conflicts'
  }${resolvedConflicts.length > 0 ? ` and resolve ${resolvedConflicts.length} conflict(s)` : ''}`;

  return {
    affectedDates: [fromDate, toDate],
    newConflicts: addedConflicts,
    resolvedConflicts,
    conflictDelta: addedConflicts.length - resolvedConflicts.length,
    affectedEmployees: [employeeId],
    affectedBrandProcesses: [],
    summary,
  };
}
