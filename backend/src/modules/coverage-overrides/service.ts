import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { CreateCoverageOverrideInput } from './schema.js';

export async function fetchCoverageOverrides(brandProcessId?: string) {
  return prisma.coverageOverride.findMany({
    where: {
      ...(brandProcessId && { brandProcessId }),
    },
    include: {
      brandProcess: {
        include: {
          brand: true,
          process: true,
        },
      },
    },
    orderBy: [{ brandProcessId: 'asc' }, { date: 'asc' }, { weekday: 'asc' }],
  });
}

export async function createCoverageOverride(data: CreateCoverageOverrideInput) {
  return prisma.coverageOverride.create({
    data: {
      brandProcessId: data.brandProcessId,
      date: data.date ? new Date(data.date) : null,
      weekday: data.weekday ?? null,
      minCoverage: data.minCoverage,
      reason: data.reason ?? null,
    },
    include: {
      brandProcess: {
        include: {
          brand: true,
          process: true,
        },
      },
    },
  });
}

export async function deleteCoverageOverride(id: string) {
  const override = await prisma.coverageOverride.findUnique({ where: { id } });
  if (!override) {
    throw new NotFoundError(`CoverageOverride with id ${id} not found`);
  }

  return prisma.coverageOverride.delete({ where: { id } });
}
