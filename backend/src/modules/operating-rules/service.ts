import { prisma } from '../../lib/prisma.js';

export async function fetchOperatingRules() {
  return prisma.operatingRule.findMany({
    orderBy: { name: 'asc' },
  });
}
