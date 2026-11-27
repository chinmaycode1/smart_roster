import type { PrismaClient } from '@prisma/client';

export async function seedProcesses(prisma: PrismaClient) {
  const processData = [
    { name: 'Customer Support', code: 'CS' },
    { name: 'Abandoned Cart Conversion', code: 'ACC' },
    { name: 'Retention', code: 'RETENTION' },
    { name: 'NDR', code: 'NDR' },
  ];

  const processes = await Promise.all(
    processData.map((process) => prisma.process.create({ data: process }))
  );

  const shiftData = [
    { name: 'General Shift', startTime: '09:00', endTime: '18:00' },
    { name: 'Morning Shift', startTime: '07:00', endTime: '15:00' },
    { name: 'Evening Shift', startTime: '15:00', endTime: '23:00' },
  ];

  const shifts = await Promise.all(
    shiftData.map((shift) => prisma.shift.create({ data: shift }))
  );

  const operatingRuleData = [
    {
      name: 'All Days Including Holidays',
      type: 'ALL_365' as const,
      workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
      worksOnHolidays: true,
    },
    {
      name: 'Daily Except Public Holidays',
      type: 'DAILY_EXCEPT_HOLIDAYS' as const,
      workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
      worksOnHolidays: false,
    },
    {
      name: 'No Sundays and Holidays',
      type: 'EXCEPT_SUNDAYS_AND_HOLIDAYS' as const,
      workingWeekdays: [1, 2, 3, 4, 5, 6],
      worksOnHolidays: false,
    },
    {
      name: 'Weekdays Only',
      type: 'CUSTOM_WEEKDAYS' as const,
      workingWeekdays: [1, 2, 3, 4, 5],
      worksOnHolidays: false,
    },
  ];

  const operatingRules = await Promise.all(
    operatingRuleData.map((rule) => prisma.operatingRule.create({ data: rule }))
  );

  return { processes, shifts, operatingRules };
}
