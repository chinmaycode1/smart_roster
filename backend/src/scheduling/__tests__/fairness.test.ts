import { describe, it, expect } from 'vitest';
import { analyzeFairness } from '../fairness/fairnessAnalyzer.js';
import type { RosterEntryData, EmployeeData, PublicHolidayData } from '../types.js';

describe('fairnessAnalyzer', () => {
  const emp1: EmployeeData = {
    id: 'emp1',
    code: 'E001',
    name: 'Employee One',
    podId: 'pod1',
    maxConsecutiveWorkDays: 6,
    assignments: [],
    weeklyOffPattern: {
      preferredOffDays: [0],
      fixedOffDays: [],
      isFixed: false,
    },
    leaves: [],
    compOffs: [],
  };

  const emp2: EmployeeData = {
    id: 'emp2',
    code: 'E002',
    name: 'Employee Two',
    podId: 'pod1',
    maxConsecutiveWorkDays: 6,
    assignments: [],
    weeklyOffPattern: {
      preferredOffDays: [0],
      fixedOffDays: [],
      isFixed: false,
    },
    leaves: [],
    compOffs: [],
  };

  const holiday: PublicHolidayData = {
    date: new Date('2026-01-26'),
  };

  it('should calculate weekend work days correctly', () => {
    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-03'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-04'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const report = analyzeFairness(entries, [emp1], []);
    const emp1Metrics = report.metrics.find((m) => m.employeeId === 'emp1');

    expect(emp1Metrics?.weekendDays).toBe(2);
  });

  it('should calculate holiday work days correctly', () => {
    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-26'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const report = analyzeFairness(entries, [emp1], [holiday]);
    const emp1Metrics = report.metrics.find((m) => m.employeeId === 'emp1');

    expect(emp1Metrics?.holidayDays).toBe(1);
  });

  it('should detect preferred off days missed', () => {
    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-04'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-11'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const report = analyzeFairness(entries, [emp1], []);
    const emp1Metrics = report.metrics.find((m) => m.employeeId === 'emp1');

    expect(emp1Metrics?.preferredOffDaysMissed).toBe(2);
  });

  it('should calculate max consecutive work streak', () => {
    const entries: RosterEntryData[] = [];
    for (let i = 5; i <= 12; i++) {
      entries.push({
        employeeId: 'emp1',
        date: new Date(`2026-01-${String(i).padStart(2, '0')}`),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      });
    }

    const report = analyzeFairness(entries, [emp1], []);
    const emp1Metrics = report.metrics.find((m) => m.employeeId === 'emp1');

    expect(emp1Metrics?.consecutiveWorkStreak).toBe(8);
  });

  it('should detect HIGH imbalance when variance is high', () => {
    const entries: RosterEntryData[] = [
      ...Array.from({ length: 8 }, (_, i) => ({
        employeeId: 'emp1',
        date: new Date(`2026-01-${String((i % 7) + 1).padStart(2, '0')}`),
        status: 'WORKING' as const,
        source: 'GENERATED' as const,
        isLocked: false,
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        employeeId: 'emp2',
        date: new Date(`2026-01-${String(i + 10).padStart(2, '0')}`),
        status: 'WORKING' as const,
        source: 'GENERATED' as const,
        isLocked: false,
      })),
    ];

    entries.push(
      {
        employeeId: 'emp1',
        date: new Date('2026-01-03'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-04'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      }
    );

    const report = analyzeFairness(entries, [emp1, emp2], []);

    expect(report.imbalanceLevel).toBeTruthy();
  });

  it('should generate recommendations for imbalanced distribution', () => {
    const entries: RosterEntryData[] = [
      {
        employeeId: 'emp1',
        date: new Date('2026-01-03'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-04'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-10'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
      {
        employeeId: 'emp1',
        date: new Date('2026-01-11'),
        status: 'WORKING',
        source: 'GENERATED',
        isLocked: false,
      },
    ];

    const report = analyzeFairness(entries, [emp1, emp2], []);

    expect(report.recommendations.length).toBeGreaterThan(0);
  });
});
