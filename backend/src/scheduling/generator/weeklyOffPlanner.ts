import type { EmployeeData, BrandProcessData, PublicHolidayData } from '../types.js';

export function planWeeklyOffs(
  dates: Date[],
  employees: EmployeeData[],
  _brandProcesses: BrandProcessData[],
  _holidays: PublicHolidayData[]
): Map<string, Set<string>> {
  const weeklyOffMap = new Map<string, Set<string>>();

  for (const employee of employees) {
    const offDates = new Set<string>();

    // For simplicity: assign one weekly off per week based on preferred day
    const preferredDay =
      employee.weeklyOffPattern && employee.weeklyOffPattern.preferredOffDays.length > 0
        ? employee.weeklyOffPattern.preferredOffDays[0]
        : 0;

    const weekGroups = groupDatesByWeek(dates);
    for (const week of weekGroups) {
      // Try to assign preferred day
      const preferred = week.find((d) => d.getDay() === preferredDay);
      if (preferred) {
        offDates.add(preferred.toISOString().split('T')[0]);
      } else if (week.length > 0) {
        // Fallback to first day of week
        offDates.add(week[0].toISOString().split('T')[0]);
      }
    }

    weeklyOffMap.set(employee.id, offDates);
  }

  return weeklyOffMap;
}

function groupDatesByWeek(dates: Date[]): Date[][] {
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let lastMonday: Date | null = null;

  for (const date of dates) {
    const dayOfWeek = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((dayOfWeek + 6) % 7));

    if (lastMonday && monday.getTime() !== lastMonday.getTime()) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentWeek.push(date);
    lastMonday = monday;
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}
