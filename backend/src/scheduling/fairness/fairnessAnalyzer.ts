import type { RosterEntryData, EmployeeData, PublicHolidayData } from '../types.js';

export interface FairnessMetrics {
  employeeId: string;
  employeeName: string;
  totalWorkingDays: number;
  weekendDays: number;
  holidayDays: number;
  preferredOffDaysMissed: number;
  consecutiveWorkStreak: number;
  fairnessScore: number;
}

export interface FairnessReport {
  metrics: FairnessMetrics[];
  averageWeekendDays: number;
  averageHolidayDays: number;
  maxWeekendDays: number;
  minWeekendDays: number;
  imbalanceLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendations: string[];
}

export function analyzeFairness(
  entries: RosterEntryData[],
  employees: EmployeeData[],
  holidays: PublicHolidayData[]
): FairnessReport {
  const metrics: FairnessMetrics[] = [];

  for (const employee of employees) {
    const empEntries = entries.filter((e) => e.employeeId === employee.id);
    const workingEntries = empEntries.filter((e) => e.status === 'WORKING');

    const weekendDays = workingEntries.filter((e) => {
      const day = e.date.getDay();
      return day === 0 || day === 6;
    }).length;

    const holidayDays = workingEntries.filter((e) =>
      holidays.some((h) => h.date.toDateString() === e.date.toDateString())
    ).length;

    const preferredDays = employee.weeklyOffPattern?.preferredOffDays || [];
    const preferredOffDaysMissed = workingEntries.filter((e) => {
      const day = e.date.getDay();
      return preferredDays.includes(day);
    }).length;

    const consecutiveWorkStreak = calculateMaxConsecutiveWorkDays(empEntries);

    const fairnessScore = calculateFairnessScore(
      weekendDays,
      holidayDays,
      preferredOffDaysMissed,
      consecutiveWorkStreak,
      employee.maxConsecutiveWorkDays
    );

    metrics.push({
      employeeId: employee.id,
      employeeName: employee.name,
      totalWorkingDays: workingEntries.length,
      weekendDays,
      holidayDays,
      preferredOffDaysMissed,
      consecutiveWorkStreak,
      fairnessScore,
    });
  }

  const weekendDaysArray = metrics.map((m) => m.weekendDays);
  const holidayDaysArray = metrics.map((m) => m.holidayDays);

  const averageWeekendDays = average(weekendDaysArray);
  const averageHolidayDays = average(holidayDaysArray);
  const maxWeekendDays = Math.max(...weekendDaysArray);
  const minWeekendDays = Math.min(...weekendDaysArray);

  const weekendVariance = variance(weekendDaysArray);
  const holidayVariance = variance(holidayDaysArray);

  const imbalanceLevel = determineImbalanceLevel(weekendVariance, holidayVariance);
  const recommendations = generateRecommendations(metrics, imbalanceLevel);

  return {
    metrics,
    averageWeekendDays,
    averageHolidayDays,
    maxWeekendDays,
    minWeekendDays,
    imbalanceLevel,
    recommendations,
  };
}

function calculateMaxConsecutiveWorkDays(entries: RosterEntryData[]): number {
  const sortedEntries = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  let maxStreak = 0;
  let currentStreak = 0;

  for (const entry of sortedEntries) {
    if (entry.status === 'WORKING') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

function calculateFairnessScore(
  weekendDays: number,
  holidayDays: number,
  preferredOffDaysMissed: number,
  consecutiveWorkStreak: number,
  maxAllowedStreak: number
): number {
  let score = 100;

  score -= weekendDays * 2;
  score -= holidayDays * 3;
  score -= preferredOffDaysMissed * 1;

  if (consecutiveWorkStreak > maxAllowedStreak) {
    score -= (consecutiveWorkStreak - maxAllowedStreak) * 5;
  }

  return Math.max(0, score);
}

function average(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function variance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => Math.pow(n - avg, 2));
  return average(squaredDiffs);
}

function determineImbalanceLevel(
  weekendVariance: number,
  holidayVariance: number
): 'LOW' | 'MEDIUM' | 'HIGH' {
  const totalVariance = weekendVariance + holidayVariance;

  if (totalVariance < 2) return 'LOW';
  if (totalVariance < 5) return 'MEDIUM';
  return 'HIGH';
}

function generateRecommendations(
  metrics: FairnessMetrics[],
  imbalanceLevel: 'LOW' | 'MEDIUM' | 'HIGH'
): string[] {
  const recommendations: string[] = [];

  if (imbalanceLevel === 'HIGH') {
    recommendations.push(
      'Significant imbalance detected in weekend and holiday work distribution'
    );
  }

  const sortedByWeekend = [...metrics].sort((a, b) => b.weekendDays - a.weekendDays);
  if (sortedByWeekend.length >= 2) {
    const highest = sortedByWeekend[0];
    const lowest = sortedByWeekend[sortedByWeekend.length - 1];

    if (highest.weekendDays - lowest.weekendDays > 2) {
      recommendations.push(
        `${highest.employeeName} worked ${highest.weekendDays} weekend days while ${lowest.employeeName} worked ${lowest.weekendDays}. Consider rebalancing next month.`
      );
    }
  }

  const sortedByHoliday = [...metrics].sort((a, b) => b.holidayDays - a.holidayDays);
  if (sortedByHoliday.length >= 2) {
    const highest = sortedByHoliday[0];
    const lowest = sortedByHoliday[sortedByHoliday.length - 1];

    if (highest.holidayDays - lowest.holidayDays > 1) {
      recommendations.push(
        `${highest.employeeName} worked ${highest.holidayDays} holidays while ${lowest.employeeName} worked ${lowest.holidayDays}. Prioritize ${highest.employeeName} for future holiday offs.`
      );
    }
  }

  const highStreakEmployees = metrics.filter(
    (m) => m.consecutiveWorkStreak > 10
  );
  if (highStreakEmployees.length > 0) {
    recommendations.push(
      `${highStreakEmployees.length} employee(s) worked more than 10 consecutive days. Review weekly-off distribution.`
    );
  }

  if (recommendations.length === 0 && imbalanceLevel === 'LOW') {
    recommendations.push('Work distribution is balanced across the team');
  }

  return recommendations;
}
