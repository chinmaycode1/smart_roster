import type { EmployeeData, PublicHolidayData, AvailabilityStatus } from '../types.js';

export function getEmployeeAvailability(
  date: Date,
  employee: EmployeeData,
  holidays: PublicHolidayData[],
  weeklyOffDates?: Set<string>
): AvailabilityStatus {
  const dateKey = date.toISOString().split('T')[0];

  // Check leaves
  const hasApprovedLeave = employee.leaves.some(
    (leave) =>
      leave.status === 'APPROVED' &&
      date >= leave.startDate &&
      date <= leave.endDate
  );
  if (hasApprovedLeave) return 'LEAVE';

  // Check comp-offs
  const hasCompOff = employee.compOffs.some(
    (co) =>
      co.status === 'REDEEMED' &&
      co.redeemOn &&
      co.redeemOn.toDateString() === date.toDateString()
  );
  if (hasCompOff) return 'COMP_OFF';

  // Check fixed weekly offs
  if (employee.weeklyOffPattern && employee.weeklyOffPattern.isFixed) {
    const weekday = date.getDay();
    if (employee.weeklyOffPattern.fixedOffDays.includes(weekday)) {
      return 'FIXED_OFF';
    }
  }

  // Check planned weekly off (from generation)
  if (weeklyOffDates && weeklyOffDates.has(dateKey)) {
    return 'WEEKLY_OFF';
  }

  // Check holidays
  const isHoliday = holidays.some(
    (h) => h.date.toDateString() === date.toDateString()
  );
  if (isHoliday) return 'HOLIDAY';

  return 'AVAILABLE';
}

export function isEmployeeAvailable(
  date: Date,
  employee: EmployeeData,
  holidays: PublicHolidayData[],
  weeklyOffDates?: Set<string>
): boolean {
  const availability = getEmployeeAvailability(date, employee, holidays, weeklyOffDates);
  return availability === 'AVAILABLE' || availability === 'HOLIDAY';
}
