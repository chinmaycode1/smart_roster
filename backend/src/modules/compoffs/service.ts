import { prisma } from '../../lib/prisma.js';
import type { CreateCompOffInput, UpdateCompOffInput } from './schema.js';

export async function getCompOffs(filters?: { employeeId?: string }) {
  return prisma.compOff.findMany({
    where: {
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
    },
    include: {
      employee: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
    orderBy: { earnedOn: 'desc' },
  });
}

export async function createCompOff(data: CreateCompOffInput) {
  return prisma.compOff.create({
    data,
    include: {
      employee: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function updateCompOff(id: string, data: UpdateCompOffInput) {
  return prisma.compOff.update({
    where: { id },
    data,
    include: {
      employee: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function deleteCompOff(id: string) {
  return prisma.compOff.delete({
    where: { id },
  });
}
