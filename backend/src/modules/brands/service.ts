import { prisma } from '../../lib/prisma.js';

export async function fetchBrands() {
  return prisma.brand.findMany({
    include: {
      brandProcesses: {
        include: {
          process: true,
          operatingRule: true,
          shift: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function createBrand(data: { name: string; code: string }) {
  return prisma.brand.create({ data });
}
