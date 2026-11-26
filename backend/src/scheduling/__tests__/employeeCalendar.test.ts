import { describe, it, expect } from 'vitest';
import { getEmployeeAvailability, isEmployeeAvailable } from '../calendar/employeeCalendar.js';
import type { EmployeeData, PublicHolidayData } from '../types.js';

describe('employeeCalendar', () => {
  const mockEmployee: EmployeeData = {
    id: 'emp1',
    code: 'E001',
    name: 'Test Employee',
    podId: 'pod1',
    maxConsecutiveWorkDays: 6,
    assignments: [],
    weeklyOffPattern: {
      preferredOffDays: [0],
      fixedOffDays: [0],
      isFixed: true,
    },
    leaves: [
      {
        startDate: new Date('2026-01-10'),
        endDate: new Date('2026-01-12'),
        status: 'APPROVED',
      },
    ],
    compOffs: [
      {
        earnedOn: new Date('2026-01-01'),
        redeemOn: new Date('2026-01-15'),
        status: 'REDEEMED',
      },
    ],
  };

  const holiday: PublicHolidayData = {
    date: new Date('2026-01-26'),
  };

  it('should return LEAVE for approved leave dates', () => {
    const date = new Date('2026-01-10');
    const status = getEmployeeAvailability(date, mockEmployee, []);
    expect(status).toBe('LEAVE');
  });

  it('should return COMP_OFF for redeemed comp-off dates', () => {
    const date = new Date('2026-01-15');
    const status = getEmployeeAvailability(date, mockEmployee, []);
    expect(status).toBe('COMP_OFF');
  });

  it('should return FIXED_OFF for fixed weekly off days', () => {
    const sunday = new Date('2026-01-04');
    expect(sunday.getDay()).toBe(0);
    
    const status = getEmployeeAvailability(sunday, mockEmployee, []);
    expect(status).toBe('FIXED_OFF');
  });

  it('should return HOLIDAY for public holidays', () => {
    const date = new Date('2026-01-26');
    const status = getEmployeeAvailability(date, mockEmployee, [holiday]);
    expect(status).toBe('HOLIDAY');
  });

  it('should return WEEKLY_OFF for planned weekly off dates', () => {
    const date = new Date('2026-01-13');
    const weeklyOffDates = new Set(['2026-01-13']);
    
    const status = getEmployeeAvailability(date, mockEmployee, [], weeklyOffDates);
    expect(status).toBe('WEEKLY_OFF');
  });

  it('should return AVAILABLE for normal working days', () => {
    const date = new Date('2026-01-05');
    const status = getEmployeeAvailability(date, mockEmployee, []);
    expect(status).toBe('AVAILABLE');
  });

  it('should return false for unavailable dates using isEmployeeAvailable', () => {
    const date = new Date('2026-01-10');
    const available = isEmployeeAvailable(date, mockEmployee, []);
    expect(available).toBe(false);
  });

  it('should return true for available dates using isEmployeeAvailable', () => {
    const date = new Date('2026-01-05');
    const available = isEmployeeAvailable(date, mockEmployee, []);
    expect(available).toBe(true);
  });
});
