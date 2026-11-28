import { prisma } from '../../lib/prisma.js';
import type { CreateBrandInput, UpdateBrandInput } from './schema.js';

export async function fetchBrands() {
  return prisma.brand.findMany({
    include: {
      _count: {
        select: { brandProcesses: true },
      },
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

export async function updateBrand(id: string, data: UpdateBrandInput) {
  return prisma.brand.update({
    where: { id },
    data,
  });
}

export async function deleteBrand(id: string) {
  return prisma.brand.delete({
    where: { id },
  });
}
