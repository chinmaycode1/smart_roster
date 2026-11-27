import type { RosterEntryData, ConflictData, GenerationContext } from '../../types.js';

export function checkLeaveCoverageClash(
  entries: RosterEntryData[],
  context: GenerationContext
): ConflictData[] {
  const conflicts: ConflictData[] = [];
  const { employees } = context;

  for (const employee of employees) {
    const empEntries = entries.filter((e) => e.employeeId === employee.id);

    for (const leave of employee.leaves) {
      if (leave.status !== 'APPROVED') continue;

      let currentDate = new Date(leave.startDate);
      while (currentDate <= leave.endDate) {
        const entry = empEntries.find(
          (e) => e.date.toDateString() === currentDate.toDateString()
        );

        if (entry && entry.status === 'WORKING') {
          conflicts.push({
            severity: 'ERROR',
            code: 'LEAVE_COVERAGE_CLASH',
            employeeId: employee.id,
            date: new Date(currentDate),
            message: `${employee.name} scheduled to work on ${currentDate.toISOString().split('T')[0]} but has approved leave`,
            suggestedActions: [
              {
                type: 'ADJUST_COVERAGE',
                description: 'Remove work assignment and find backup coverage',
                employeeId: employee.id,
                employeeName: employee.name,
                date: new Date(currentDate),
              },
            ],
          });
        }

        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    for (const compOff of employee.compOffs) {
      if (compOff.status !== 'REDEEMED' || !compOff.redeemOn) continue;

      const entry = empEntries.find(
        (e) => e.date.toDateString() === compOff.redeemOn!.toDateString()
      );

      if (entry && entry.status === 'WORKING') {
        conflicts.push({
          severity: 'ERROR',
          code: 'LEAVE_COVERAGE_CLASH',
          employeeId: employee.id,
          date: compOff.redeemOn,
          message: `${employee.name} scheduled to work on ${compOff.redeemOn.toISOString().split('T')[0]} but has redeemed comp-off`,
          suggestedActions: [
            {
              type: 'ADJUST_COVERAGE',
              description: 'Remove work assignment and find backup coverage',
              employeeId: employee.id,
              employeeName: employee.name,
              date: compOff.redeemOn,
            },
          ],
        });
      }
    }
  }

  return conflicts;
}
