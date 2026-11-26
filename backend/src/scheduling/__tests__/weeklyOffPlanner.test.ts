import { describe, it, expect } from 'vitest';
import { planWeeklyOffs } from '../generator/weeklyOffPlanner.js';
import type { EmployeeData } from '../types.js';

describe('weeklyOffPlanner', () => {
  const mockEmployee: EmployeeData = {
    id: 'emp1',
    code: 'E001',
    name: 'Test Employee',
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

  it('should assign one weekly off per week', () => {
    const dates = [
      new Date('2026-01-05'),
      new Date('2026-01-06'),
      new Date('2026-01-07'),
      new Date('2026-01-08'),
      new Date('2026-01-09'),
      new Date('2026-01-10'),
      new Date('2026-01-11'),
      new Date('2026-01-12'),
      new Date('2026-01-13'),
    ];

    const result = planWeeklyOffs(dates, [mockEmployee], [], []);
    const offDates = result.get('emp1');

    expect(offDates).toBeDefined();
    expect(offDates!.size).toBeGreaterThanOrEqual(1);
  });

  it('should prefer the preferred off day when available', () => {
    const dates = [
      new Date('2026-01-04'),
      new Date('2026-01-05'),
      new Date('2026-01-06'),
      new Date('2026-01-07'),
      new Date('2026-01-08'),
      new Date('2026-01-09'),
      new Date('2026-01-10'),
    ];

    const result = planWeeklyOffs(dates, [mockEmployee], [], []);
    const offDates = result.get('emp1');

    expect(offDates).toBeDefined();
    
    const hasSunday = Array.from(offDates!).some((dateKey) => {
      const date = new Date(dateKey);
      return date.getDay() === 0;
    });
    
    expect(hasSunday).toBe(true);
  });

  it('should handle multiple employees', () => {
    const emp2: EmployeeData = {
      ...mockEmployee,
      id: 'emp2',
      code: 'E002',
      name: 'Employee 2',
      weeklyOffPattern: {
        preferredOffDays: [6],
        fixedOffDays: [],
        isFixed: false,
      },
    };

    const dates = [
      new Date('2026-01-04'),
      new Date('2026-01-05'),
      new Date('2026-01-06'),
      new Date('2026-01-07'),
    ];

    const result = planWeeklyOffs(dates, [mockEmployee, emp2], [], []);

    expect(result.has('emp1')).toBe(true);
    expect(result.has('emp2')).toBe(true);
  });
});
