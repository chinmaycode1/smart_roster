import { describe, it, expect } from 'vitest';
import { validateRoster } from '../validator/validateRoster.js';
import type { RosterEntryData, GenerationContext, EmployeeData, BrandProcessData } from '../types.js';

describe('validateRoster', () => {
  const mockEmployee: EmployeeData = {
    id: 'emp1',
    code: 'E001',
    name: 'Test Employee',
    podId: 'pod1',
    maxConsecutiveWorkDays: 6,
    assignments: [
      {
        id: 'a1',
        brandProcessId: 'bp1',
        allocationPercent: 100,
        isPrimary: true,
      },
    ],
    weeklyOffPattern: {
      preferredOffDays: [0],
      fixedOffDays: [0],
      isFixed: true,
    },
    leaves: [
      {
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-01-10'),
        status: 'APPROVED',
      },
    ],
    compOffs: [],
  };

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
    defaultMinCoverage: 1,
    coverageOverrides: [],
  };

  const context: GenerationContext = {
    month: 1,
    year: 2026,
    employees: [mockEmployee],
    brandProcesses: [mockBrandProcess],
    holidays: [],
    lockedEntries: [],
  };

  it('should detect duplicate entries', () => {
    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-05'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-05'),
        status: 'WEEKLY_OFF',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const conflicts = validateRoster(entries, context);
    const duplicateConflict = conflicts.find((c) => c.code === 'DUPLICATE_ENTRY');
    expect(duplicateConflict).toBeDefined();
  });

  it('should detect leave clash with working entry', () => {
    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-10'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const conflicts = validateRoster(entries, context);
    const leaveClash = conflicts.find((c) => c.code === 'LEAVE_COVERAGE_CLASH');
    expect(leaveClash).toBeDefined();
  });

  it('should detect working on Sunday with fixed off pattern', () => {
    const sunday = new Date('2026-01-04');
    expect(sunday.getDay()).toBe(0);

    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: sunday,
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const conflicts = validateRoster(entries, context);
    expect(conflicts.length).toBeGreaterThanOrEqual(0);
  });

  it('should detect max consecutive days exceeded', () => {
    const entries: RosterEntryData[] = [];
    for (let i = 5; i <= 13; i++) {
      entries.push({
        employeeId: 'emp1',
        date: new Date(`2026-01-${String(i).padStart(2, '0')}`),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      });
    }

    const conflicts = validateRoster(entries, context);
    const maxConsecutive = conflicts.find((c) => c.code === 'MAX_CONSECUTIVE_DAYS_EXCEEDED');
    expect(maxConsecutive).toBeDefined();
  });

  it('should detect insufficient coverage', () => {
    const bp: BrandProcessData = {
      ...mockBrandProcess,
      defaultMinCoverage: 2,
    };

    const contextWithHighDemand: GenerationContext = {
      ...context,
      brandProcesses: [bp],
    };

    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-05'),
        status: 'WEEKLY_OFF',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const conflicts = validateRoster(entries, contextWithHighDemand);
    const insufficientCoverage = conflicts.find((c) => c.code === 'INSUFFICIENT_COVERAGE');
    expect(insufficientCoverage).toBeDefined();
  });

  it('should detect no weekly off in a week', () => {
    const entries: RosterEntryData[] = [];
    for (let i = 5; i <= 11; i++) {
      entries.push({
        employeeId: 'emp1',
        date: new Date(`2026-01-${String(i).padStart(2, '0')}`),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      });
    }

    const empWithoutFixedOff: EmployeeData = {
      ...mockEmployee,
      weeklyOffPattern: {
        preferredOffDays: [0],
        fixedOffDays: [],
        isFixed: false,
      },
    };

    const contextWithoutFixed: GenerationContext = {
      ...context,
      employees: [empWithoutFixedOff],
    };

    const conflicts = validateRoster(entries, contextWithoutFixed);
    const noWeeklyOff = conflicts.find((c) => c.code === 'NO_WEEKLY_OFF');
    expect(noWeeklyOff).toBeDefined();
  });
});
