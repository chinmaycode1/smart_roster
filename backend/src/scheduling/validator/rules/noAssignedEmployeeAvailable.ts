import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';
import { buildDemandMap } from '../../demand/coverageDemand.js';
import { getAllDatesInMonth } from '../../../lib/dates.js';

export function checkNoAssignedEmployeeAvailable(
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

    if (assignedEmployees.length === 0) {
      for (const date of dates) {
        const dateKey = date.toISOString().split('T')[0];
        const required = demandMap[bp.id]?.[dateKey] ?? 0;

        if (required > 0) {
          const availableBackups = employees.filter((emp) => {
            const entry = entries.find(
              (e) =>
                e.employeeId === emp.id &&
                e.date.toDateString() === date.toDateString()
            );
            return !entry || entry.status === 'WEEKLY_OFF' || entry.status === 'HOLIDAY';
          });

          conflicts.push({
            severity: 'ERROR',
            code: 'NO_ASSIGNED_EMPLOYEE_AVAILABLE',
            brandProcessId: bp.id,
            date,
            message: `${bp.brandName} - ${bp.processName} has no assigned employees on ${dateKey}`,
            suggestedActions: availableBackups.slice(0, 3).map((emp) => ({
              type: 'ASSIGN_BACKUP',
              description: `Assign ${emp.name} to this brand-process`,
              employeeId: emp.id,
              employeeName: emp.name,
              date,
              impact: 'New assignment needed',
            })),
          });
          break;
        }
      }
    }
  }

  return conflicts;
}
