import { prisma } from '../../lib/prisma.js';
import type { CreateBrandInput } from './schema.js';

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

export async function createBrand(data: CreateBrandInput) {
  return prisma.brand.create({ data });
}
