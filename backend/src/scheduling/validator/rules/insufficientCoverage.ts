import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';
import { buildDemandMap } from '../../demand/coverageDemand.js';
import { getAllDatesInMonth } from '../../../lib/dates.js';

export function checkInsufficientCoverage(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { month, year, employees, brandProcesses, holidays } = context;

  const dates = getAllDatesInMonth(year, month);
  const demandMap = buildDemandMap(dates, brandProcesses, holidays);

  for (const bp of brandProcesses) {
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];
      const required = demandMap[bp.id]?.[dateKey] ?? 0;

      if (required === 0) continue;

      const assignedEmployees = employees.filter((emp) =>
        emp.assignments.some((a) => {
          if (a.brandProcessId !== bp.id) return false;
          if (a.startDate && date < a.startDate) return false;
          if (a.endDate && date > a.endDate) return false;
          return true;
        })
      );

      const workingCount = assignedEmployees.filter((emp) => {
        const entry = entries.find(
          (e) =>
            e.employeeId === emp.id &&
            e.date.toDateString() === date.toDateString() &&
            e.status === 'WORKING'
        );
        return !!entry;
      }).length;

      if (workingCount < required) {
        const availableBackups = employees.filter((emp) => {
          const isAssigned = assignedEmployees.some((ae) => ae.id === emp.id);
          if (isAssigned) return false;

          const entry = entries.find(
            (e) =>
              e.employeeId === emp.id &&
              e.date.toDateString() === date.toDateString()
          );
          return !entry || entry.status === 'WEEKLY_OFF';
        });

        conflicts.push({
          severity: 'ERROR',
          code: 'INSUFFICIENT_COVERAGE',
          brandProcessId: bp.id,
          date,
          message: `${bp.brandName} - ${bp.processName} requires ${required} employees on ${dateKey}, but only ${workingCount} scheduled`,
          suggestedActions: availableBackups.slice(0, 3).map((emp) => ({
            type: 'ASSIGN_BACKUP',
            description: `Assign ${emp.name} from ${employees.find((e) => e.podId === emp.podId)?.podId || 'other pod'}`,
            employeeId: emp.id,
            employeeName: emp.name,
            date,
            impact: 'May require moving their weekly off or adjusting other assignments',
          })),
        });
      }
    }
  }

  return conflicts;
}
