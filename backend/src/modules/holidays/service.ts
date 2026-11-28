import { prisma } from '../../lib/prisma.js';
import type { CreateHolidayInput } from './schema.js';

export async function getHolidays() {
  return prisma.publicHoliday.findMany({
    orderBy: { date: 'asc' },
  });
}

export async function createHoliday(data: CreateHolidayInput) {
  return prisma.publicHoliday.create({
    data,
  });
}

export async function deleteHoliday(id: string) {
  return prisma.publicHoliday.delete({
    where: { id },
  });
}
