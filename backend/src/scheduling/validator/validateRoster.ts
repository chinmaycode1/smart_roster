import type { RosterEntryData, ConflictData, GenerationContext } from '../types.js';
import {
  checkDuplicateEntries,
  checkNoAssignedEmployeeAvailable,
  checkInsufficientCoverage,
  checkSoleOwnerUnavailable,
  checkOverlappingShiftAssignment,
  checkWeeklyOffViolations,
  checkLeaveCoverageClash,
  checkCrossBrandGap,
  checkPreferenceViolated,
  checkFairnessImbalance,
} from './rules/index.js';

export function validateRoster(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const allConflicts: ConflictData[] = [];

  const rules = [
    checkDuplicateEntries,
    checkLeaveCoverageClash,
    checkNoAssignedEmployeeAvailable,
    checkSoleOwnerUnavailable,
    checkInsufficientCoverage,
    checkWeeklyOffViolations,
    checkOverlappingShiftAssignment,
    checkCrossBrandGap,
    checkPreferenceViolated,
    checkFairnessImbalance,
  ];

  for (const rule of rules) {
    const conflicts = rule(entries, context);
    allConflicts.push(...conflicts);
  }

  return deduplicateConflicts(allConflicts);
}

function deduplicateConflicts(conflicts: ConflictData[]): ConflictData[] {
  const seen = new Set<string>();
  const unique: ConflictData[] = [];

  for (const conflict of conflicts) {
    const key = `${conflict.code}_${conflict.employeeId || ''}_${conflict.brandProcessId || ''}_${conflict.date?.toISOString().split('T')[0] || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(conflict);
    }
  }

  return unique;
}
