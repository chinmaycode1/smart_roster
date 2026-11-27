import type { PrismaClient } from '@prisma/client';

export async function seedHolidays(prisma: PrismaClient) {
  const holidayData = [
    { date: new Date('2026-01-26'), name: 'Republic Day', region: 'India' },
    { date: new Date('2026-03-11'), name: 'Maha Shivaratri', region: 'India' },
    { date: new Date('2026-03-25'), name: 'Holi', region: 'India' },
    { date: new Date('2026-04-02'), name: 'Good Friday', region: 'India' },
    { date: new Date('2026-04-06'), name: 'Ram Navami', region: 'India' },
    { date: new Date('2026-04-14'), name: 'Mahavir Jayanti', region: 'India' },
    { date: new Date('2026-04-21'), name: 'Eid ul-Fitr', region: 'India' },
    { date: new Date('2026-05-01'), name: 'May Day', region: 'India' },
    { date: new Date('2026-05-26'), name: 'Buddha Purnima', region: 'India' },
    { date: new Date('2026-06-28'), name: 'Eid ul-Adha', region: 'India' },
    { date: new Date('2026-07-18'), name: 'Muharram', region: 'India' },
    { date: new Date('2026-08-15'), name: 'Independence Day', region: 'India' },
    { date: new Date('2026-08-22'), name: 'Raksha Bandhan', region: 'India' },
    { date: new Date('2026-08-31'), name: 'Janmashtami', region: 'India' },
    { date: new Date('2026-09-16'), name: 'Milad un-Nabi', region: 'India' },
    { date: new Date('2026-10-02'), name: 'Gandhi Jayanti', region: 'India' },
    { date: new Date('2026-10-15'), name: 'Dussehra', region: 'India' },
    { date: new Date('2026-11-04'), name: 'Diwali', region: 'India' },
    { date: new Date('2026-11-05'), name: 'Govardhan Puja', region: 'India' },
    { date: new Date('2026-11-25'), name: 'Guru Nanak Jayanti', region: 'India' },
    { date: new Date('2026-12-25'), name: 'Christmas', region: 'India' },
  ];

  // Create holidays sequentially to avoid connection pool limits
  const holidays = [];
  for (const holiday of holidayData) {
    const created = await prisma.publicHoliday.create({ data: holiday });
    holidays.push(created);
  }

  return { holidays };
}
