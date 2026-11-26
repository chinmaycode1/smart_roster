import { prisma } from '../../lib/prisma.js';
import { getMonthDateRange } from '../../lib/dates.js';

export async function getDashboardSummary(month: number, year: number) {
  const totalEmployees = await prisma.employee.count({ where: { isActive: true } });
  const totalBrands = await prisma.brand.count({ where: { isActive: true } });
  const totalProcesses = await prisma.process.count();
  const openConflicts = await prisma.conflict.count({
    where: { resolvedAt: null },
  });

  const { start, end } = getMonthDateRange(year, month);

  const roster = await prisma.roster.findFirst({
    where: {
      month,
      year,
      status: { in: ['PUBLISHED', 'DRAFT'] },
    },
    orderBy: { version: 'desc' },
  });

  let coverageData = null;
  if (roster) {
    const entries = await prisma.rosterEntry.findMany({
      where: {
        rosterId: roster.id,
        date: { gte: start, lte: end },
      },
    });

    const working = entries.filter((e) => e.status === 'WORKING').length;
    const totalDays = entries.length;

    coverageData = {
      working,
      totalDays,
      percentage: totalDays > 0 ? Math.round((working / totalDays) * 100) : 0,
    };
  }

  return {
    totalEmployees,
    totalBrands,
    totalProcesses,
    openConflicts,
    coverageData,
  };
}
