import { getAllDatesInMonth } from '../../lib/dates.js';
import { buildDemandMap } from '../demand/coverageDemand.js';
import { planWeeklyOffs } from './weeklyOffPlanner.js';
import type {
  GenerationContext,
  GenerationResult,
  RosterEntryData,
  EmployeeData,
  BrandProcessData,
} from '../types.js';

export function generateRoster(context: GenerationContext): GenerationResult {
  const { month, year, employees, brandProcesses, holidays, lockedEntries } = context;

  const dates = getAllDatesInMonth(year, month);
  const entries: RosterEntryData[] = [...lockedEntries];
  const demandMap = buildDemandMap(dates, brandProcesses, holidays);

  // Build a map of employee weekly offs
  const employeeWeeklyOffMap = planWeeklyOffs(dates, employees, brandProcesses, holidays);

  // Build base entries: holidays, leaves, comp-offs, weekly offs
  for (const employee of employees) {
    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];

      // Skip if locked entry exists
      const locked = lockedEntries.find(
        (e) => e.employeeId === employee.id && e.date.toDateString() === date.toDateString()
      );
      if (locked) continue;

      // Check leaves
      const hasApprovedLeave = employee.leaves.some(
        (leave) =>
          leave.status === 'APPROVED' &&
          date >= leave.startDate &&
          date <= leave.endDate
      );
      if (hasApprovedLeave) {
        entries.push({
          employeeId: employee.id,
          date,
          status: 'LEAVE',
          source: 'GENERATED',
          isLocked: false,
        });
        continue;
      }

      // Check comp-offs
      const compOff = employee.compOffs.find(
        (co) =>
          co.status === 'REDEEMED' &&
          co.redeemOn &&
          co.redeemOn.toDateString() === date.toDateString()
      );
      if (compOff) {
        entries.push({
          employeeId: employee.id,
          date,
          status: 'COMP_OFF',
          source: 'GENERATED',
          isLocked: false,
        });
        continue;
      }

      // Check fixed weekly offs
      if (employee.weeklyOffPattern && employee.weeklyOffPattern.isFixed) {
        const weekday = date.getDay();
        if (employee.weeklyOffPattern.fixedOffDays.includes(weekday)) {
          entries.push({
            employeeId: employee.id,
            date,
            status: 'WEEKLY_OFF',
            source: 'GENERATED',
            isLocked: false,
          });
          continue;
        }
      }

      // Check planned weekly off
      const weeklyOffDates = employeeWeeklyOffMap.get(employee.id) || new Set();
      if (weeklyOffDates.has(dateKey)) {
        entries.push({
          employeeId: employee.id,
          date,
          status: 'WEEKLY_OFF',
          source: 'GENERATED',
          isLocked: false,
        });
        continue;
      }

      // Check if holiday (but employee might still work)
      const isHoliday = holidays.some(
        (h) => h.date.toDateString() === date.toDateString()
      );

      // Determine if employee should work
      const shouldWork = shouldEmployeeWork(
        employee,
        date,
        brandProcesses,
        demandMap,
        isHoliday
      );

      if (shouldWork) {
        entries.push({
          employeeId: employee.id,
          date,
          status: isHoliday ? 'WORKING' : 'WORKING',
          source: 'GENERATED',
          isLocked: false,
          note: isHoliday ? 'Working on holiday' : undefined,
        });
      } else if (isHoliday) {
        entries.push({
          employeeId: employee.id,
          date,
          status: 'HOLIDAY',
          source: 'GENERATED',
          isLocked: false,
        });
      } else {
        entries.push({
          employeeId: employee.id,
          date,
          status: 'WEEKLY_OFF',
          source: 'GENERATED',
          isLocked: false,
        });
      }
    }
  }

  return {
    entries,
    conflicts: [],
  };
}

function shouldEmployeeWork(
  employee: EmployeeData,
  date: Date,
  brandProcesses: BrandProcessData[],
  demandMap: { [brandProcessId: string]: { [dateKey: string]: number } },
  _isHoliday: boolean
): boolean {
  const dateKey = date.toISOString().split('T')[0];

  // Find employee's assignments
  const activeAssignments = employee.assignments.filter((a) => {
    if (a.startDate && date < a.startDate) return false;
    if (a.endDate && date > a.endDate) return false;
    return true;
  });

  // Check if any assigned brand-process needs coverage on this date
  for (const assignment of activeAssignments) {
    const bp = brandProcesses.find((bp) => bp.id === assignment.brandProcessId);
    if (!bp) continue;

    const demand = demandMap[bp.id]?.[dateKey] ?? 0;
    if (demand > 0) {
      return true;
    }
  }

  return false;
}
