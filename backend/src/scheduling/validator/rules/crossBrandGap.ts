import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';
import { buildDemandMap } from '../../demand/coverageDemand.js';
import { getAllDatesInMonth } from '../../../lib/dates.js';

export function checkCrossBrandGap(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { month, year, employees, brandProcesses, holidays } = context;

  const dates = getAllDatesInMonth(year, month);
  const demandMap = buildDemandMap(dates, brandProcesses, holidays);

  const employeesHandlingMultipleBrands = employees.filter((emp) => {
    const brands = new Set(
      emp.assignments.map((a) => {
        const bp = brandProcesses.find((bp) => bp.id === a.brandProcessId);
        return bp?.brandId;
      })
    );
    return brands.size > 1;
  });

  for (const employee of employeesHandlingMultipleBrands) {
    for (const date of dates) {
      const empEntry = entries.find(
        (e) =>
          e.employeeId === employee.id &&
          e.date.toDateString() === date.toDateString()
      );

      if (!empEntry || empEntry.status !== 'WEEKLY_OFF') continue;

      for (const assignment of employee.assignments) {
        const dateKey = date.toISOString().split('T')[0];
        const required = demandMap[assignment.brandProcessId]?.[dateKey] ?? 0;

        if (required > 0) {
          const bp = brandProcesses.find((bp) => bp.id === assignment.brandProcessId);
          const otherAssignedEmployees = employees.filter(
            (e) =>
              e.id !== employee.id &&
              e.assignments.some((a) => a.brandProcessId === assignment.brandProcessId)
          );

          const workingCount = otherAssignedEmployees.filter((e) => {
            const entry = entries.find(
              (ent) =>
                ent.employeeId === e.id &&
                ent.date.toDateString() === date.toDateString() &&
                ent.status === 'WORKING'
            );
            return !!entry;
          }).length;

          if (workingCount < required) {
            conflicts.push({
              severity: 'WARNING',
              code: 'CROSS_BRAND_GAP',
              brandProcessId: assignment.brandProcessId,
              employeeId: employee.id,
              date,
              message: `${employee.name} off on ${dateKey} creates gap for ${bp?.brandName} - ${bp?.processName}`,
              suggestedActions: [
                {
                  type: 'SWAP_WEEKLY_OFF',
                  description: `Move ${employee.name}'s weekly off to another day`,
                  employeeId: employee.id,
                  employeeName: employee.name,
                  date,
                },
              ],
            });
          }
        }
      }
    }
  }

  return conflicts;
}
