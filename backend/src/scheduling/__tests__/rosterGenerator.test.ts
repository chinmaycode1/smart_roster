import { describe, it, expect } from 'vitest';
import { generateRoster } from '../generator/rosterGenerator.js';
import type { GenerationContext, EmployeeData, BrandProcessData } from '../types.js';

describe('rosterGenerator', () => {
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
      fixedOffDays: [],
      isFixed: false,
    },
    leaves: [],
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

  it('should generate roster entries for all days in month', () => {
    const result = generateRoster(context);
    
    const empEntries = result.entries.filter((e) => e.employeeId === 'emp1');
    expect(empEntries.length).toBeGreaterThan(0);
  });

  it('should respect approved leaves', () => {
    const empWithLeave: EmployeeData = {
      ...mockEmployee,
      leaves: [
        {
          startDate: new Date('2026-01-10'),
          endDate: new Date('2026-01-12'),
          status: 'APPROVED',
        },
      ],
    };

    const contextWithLeave: GenerationContext = {
      ...context,
      employees: [empWithLeave],
    };

    const result = generateRoster(contextWithLeave);
    
    const leaveEntries = result.entries.filter(
      (e) =>
        e.employeeId === 'emp1' &&
        e.status === 'LEAVE'
    );

    expect(leaveEntries.length).toBeGreaterThanOrEqual(2);
  });

  it('should respect fixed weekly off days', () => {
    const empWithFixedOff: EmployeeData = {
      ...mockEmployee,
      weeklyOffPattern: {
        preferredOffDays: [0],
        fixedOffDays: [0],
        isFixed: true,
      },
    };

    const contextWithFixedOff: GenerationContext = {
      ...context,
      employees: [empWithFixedOff],
    };

    const result = generateRoster(contextWithFixedOff);
    
    const sundays = result.entries.filter((e) => {
      return e.employeeId === 'emp1' && e.date.getDay() === 0;
    });

    const workingSundays = sundays.filter((e) => e.status === 'WORKING');
    expect(workingSundays.length).toBe(0);
  });

  it('should not override locked entries', () => {
    const lockedEntry = {
      employeeId: 'emp1',
      date: new Date('2026-01-15'),
      status: 'WORKING' as const,
      source: 'MANUAL' as const,
      isLocked: true,
    };

    const contextWithLocked: GenerationContext = {
      ...context,
      lockedEntries: [lockedEntry],
    };

    const result = generateRoster(contextWithLocked);
    
    const entry = result.entries.find(
      (e) =>
        e.employeeId === 'emp1' &&
        e.date.toDateString() === new Date('2026-01-15').toDateString()
    );

    expect(entry).toBeDefined();
    expect(entry?.isLocked).toBe(true);
    expect(entry?.source).toBe('MANUAL');
  });

  it('should validate generated roster and return conflicts', () => {
    const result = generateRoster(context);
    
    expect(result.conflicts).toBeDefined();
    expect(Array.isArray(result.conflicts)).toBe(true);
  });

  it('should mark holiday work entries', () => {
    const contextWithHoliday: GenerationContext = {
      ...context,
      holidays: [{ date: new Date('2026-01-26') }],
      brandProcesses: [
        {
          ...mockBrandProcess,
          operatingRule: {
            type: 'ALL_365',
            workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
            worksOnHolidays: true,
          },
        },
      ],
    };

    const result = generateRoster(contextWithHoliday);
    
    const holidayEntry = result.entries.find(
      (e) =>
        e.employeeId === 'emp1' &&
        e.date.toDateString() === new Date('2026-01-26').toDateString()
    );

    expect(holidayEntry).toBeDefined();
    if (holidayEntry?.status === 'WORKING') {
      expect(holidayEntry.note).toBe('Working on holiday');
    }
  });

  it('should assign weekly offs', () => {
    const result = generateRoster(context);
    
    const weeklyOffEntries = result.entries.filter(
      (e) => e.employeeId === 'emp1' && e.status === 'WEEKLY_OFF'
    );

    expect(weeklyOffEntries.length).toBeGreaterThan(0);
  });
});
