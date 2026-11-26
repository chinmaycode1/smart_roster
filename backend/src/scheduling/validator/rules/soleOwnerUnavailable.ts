import type { RosterEntryData, ConflictData, GenerationContext, SuggestedAction } from '../../types.js';
import { buildDemandMap } from '../../demand/coverageDemand.js';
import { getAllDatesInMonth } from '../../../lib/dates.js';

export function checkSoleOwnerUnavailable(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { month, year, employees, brandProcesses, holidays } = context;

  const dates = getAllDatesInMonth(year, month);
  const demandMap = buildDemandMap(dates, brandProcesses, holidays);

  for (const bp of brandProcesses) {
    const assignedEmployees = employees.filter((emp) =>
      emp.assignments.some((a) => a.brandProcessId === bp.id)
    );

    if (assignedEmployees.length !== 1) continue;

    const soleOwner = assignedEmployees[0];

    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      const required = demandMap[bp.id]?.[dateKey] ?? 0;

      if (required === 0) continue;

      const entry = entries.find(
        (e) =>
          e.employeeId === soleOwner.id &&
          e.date.toDateString() === date.toDateString()
      );

      if (entry && entry.status !== 'WORKING') {
        const samePodBackups = employees.filter(
          (emp) =>
            emp.id !== soleOwner.id &&
            emp.podId === soleOwner.podId &&
            !emp.assignments.some((a) => a.brandProcessId === bp.id)
        );

        const otherBackups = employees.filter(
          (emp) =>
            emp.id !== soleOwner.id &&
            emp.podId !== soleOwner.podId &&
            !emp.assignments.some((a) => a.brandProcessId === bp.id)
        );

        const suggestedActions: SuggestedAction[] = [
          ...samePodBackups.slice(0, 2).map((emp) => ({
            type: 'ASSIGN_BACKUP' as const,
            description: `Assign ${emp.name} from same pod as temporary backup`,
            employeeId: emp.id,
            employeeName: emp.name,
            date,
            impact: 'Same pod member can cover with minimal training',
          })),
          ...otherBackups.slice(0, 1).map((emp) => ({
            type: 'ASSIGN_BACKUP' as const,
            description: `Assign ${emp.name} from another pod as backup`,
            employeeId: emp.id,
            employeeName: emp.name,
            date,
            impact: 'May require additional training or handover',
          })),
        ];

        if (entry.status === 'WEEKLY_OFF') {
          suggestedActions.push({
            type: 'SWAP_WEEKLY_OFF',
            description: `Move ${soleOwner.name}'s weekly off to another day this week`,
            employeeId: soleOwner.id,
            employeeName: soleOwner.name,
            date,
            impact: 'Sole owner works this day, gets off on different day',
          });
        }

        conflicts.push({
          severity: 'ERROR',
          code: 'SOLE_OWNER_UNAVAILABLE',
          brandProcessId: bp.id,
          employeeId: soleOwner.id,
          date,
          message: `${bp.brandName} - ${bp.processName} has sole owner ${soleOwner.name} unavailable on ${dateKey} (${entry.status})`,
          suggestedActions,
        });
      }
    }
  }

  return conflicts;
}
