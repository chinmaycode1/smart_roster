import { describe, it, expect } from 'vitest';
import { buildDemandMap, getDemand } from '../demand/coverageDemand.js';
import type { BrandProcessData, PublicHolidayData } from '../types.js';

describe('coverageDemand', () => {
  const mockBrandProcess: BrandProcessData = {
    id: 'bp1',
    brandId: 'b1',
    brandName: 'Test Brand',
    brandCode: 'TB',
    processId: 'p1',
    processName: 'CS',
    processCode: 'CS',
    operatingRule: {
      type: 'DAILY_EXCEPT_HOLIDAYS',
      workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
      worksOnHolidays: false,
    },
    defaultMinCoverage: 2,
    coverageOverrides: [],
  };

  const holiday: PublicHolidayData = {
    date: new Date('2026-01-26'),
  };

  it('should return 0 demand on holidays for DAILY_EXCEPT_HOLIDAYS rule', () => {
    const dates = [new Date('2026-01-26')];
    const demandMap = buildDemandMap(dates, [mockBrandProcess], [holiday]);
    
    expect(demandMap['bp1']['2026-01-26']).toBe(0);
  });

  it('should return defaultMinCoverage on working days', () => {
    const dates = [new Date('2026-01-27')];
    const demandMap = buildDemandMap(dates, [mockBrandProcess], [holiday]);
    
    expect(demandMap['bp1']['2026-01-27']).toBe(2);
  });

  it('should apply date-specific override', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      coverageOverrides: [
        {
          date: new Date('2026-01-27'),
          minCoverage: 5,
        },
      ],
    };
    
    const dates = [new Date('2026-01-27')];
    const demandMap = buildDemandMap(dates, [bp], []);
    
    expect(demandMap['bp1']['2026-01-27']).toBe(5);
  });

  it('should apply weekday override', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      coverageOverrides: [
        {
          weekday: 5,
          minCoverage: 4,
        },
      ],
    };
    
    const friday = new Date('2026-01-02');
    expect(friday.getDay()).toBe(5);
    
    const dates = [friday];
    const demandMap = buildDemandMap(dates, [bp], []);
    
    expect(demandMap['bp1']['2026-01-02']).toBe(4);
  });

  it('should prioritize date-specific over weekday override', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      coverageOverrides: [
        {
          weekday: 5,
          minCoverage: 4,
        },
        {
          date: new Date('2026-01-02'),
          minCoverage: 6,
        },
      ],
    };
    
    const friday = new Date('2026-01-02');
    const dates = [friday];
    const demandMap = buildDemandMap(dates, [bp], []);
    
    expect(demandMap['bp1']['2026-01-02']).toBe(6);
  });

  it('should handle getDemand utility function', () => {
    const dates = [new Date('2026-01-27')];
    const demandMap = buildDemandMap(dates, [mockBrandProcess], []);
    
    const demand = getDemand(new Date('2026-01-27'), 'bp1', demandMap);
    expect(demand).toBe(2);
  });
});
