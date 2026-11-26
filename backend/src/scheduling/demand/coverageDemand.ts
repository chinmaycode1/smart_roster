import { isOperatingDay } from '../calendar/operatingCalendar.js';
import type { BrandProcessData, PublicHolidayData, DemandMap } from '../types.js';

export function buildDemandMap(
  dates: Date[],
  brandProcesses: BrandProcessData[],
  holidays: PublicHolidayData[]
): DemandMap {
  const demand: DemandMap = {};

  for (const bp of brandProcesses) {
    demand[bp.id] = {};

    for (const date of dates) {
      const dateKey = date.toISOString().split('T')[0];

      if (!isOperatingDay(date, bp, holidays)) {
        demand[bp.id][dateKey] = 0;
        continue;
      }

      let minCoverage = bp.defaultMinCoverage;

      // Check date-specific overrides
      const dateOverride = bp.coverageOverrides.find(
        (ov) => ov.date && ov.date.toDateString() === date.toDateString()
      );
      if (dateOverride) {
        minCoverage = dateOverride.minCoverage;
      } else {
        // Check weekday overrides
        const weekday = date.getDay();
        const weekdayOverride = bp.coverageOverrides.find(
          (ov) => ov.weekday !== undefined && ov.weekday === weekday
        );
        if (weekdayOverride) {
          minCoverage = weekdayOverride.minCoverage;
        }
      }

      demand[bp.id][dateKey] = minCoverage;
    }
  }

  return demand;
}

export function getDemand(
  date: Date,
  brandProcessId: string,
  demandMap: DemandMap
): number {
  const dateKey = date.toISOString().split('T')[0];
  return demandMap[brandProcessId]?.[dateKey] ?? 0;
}
