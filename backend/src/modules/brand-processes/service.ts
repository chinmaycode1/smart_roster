import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { CreateBrandProcessInput, UpdateBrandProcessInput } from './schema.js';

export async function fetchBrandProcesses() {
  return prisma.brandProcess.findMany({
    include: {
      brand: true,
      process: true,
      operatingRule: true,
      assignments: {
        include: {
          employee: {
            include: {
              pod: true,
            },
          },
        },
      },
    },
    orderBy: [{ brandId: 'asc' }, { processId: 'asc' }],
  });
}

export async function createBrandProcess(data: CreateBrandProcessInput) {
  return prisma.brandProcess.create({
    data: {
      brandId: data.brandId,
      processId: data.processId,
      operatingRuleId: data.operatingRuleId,
      defaultMinCoverage: data.defaultMinCoverage ?? 1,
    },
    include: {
      brand: true,
      process: true,
      operatingRule: true,
      assignments: {
        include: {
          employee: {
            include: {
              pod: true,
            },
          },
        },
      },
    },
  });
}

export async function updateBrandProcess(id: string, data: UpdateBrandProcessInput) {
  const brandProcess = await prisma.brandProcess.findUnique({ where: { id } });
  if (!brandProcess) {
    throw new NotFoundError(`BrandProcess with id ${id} not found`);
  }

  return prisma.brandProcess.update({
    where: { id },
    data: {
      ...(data.operatingRuleId && { operatingRuleId: data.operatingRuleId }),
      ...(data.defaultMinCoverage !== undefined && { defaultMinCoverage: data.defaultMinCoverage }),
    },
    include: {
      brand: true,
      process: true,
      operatingRule: true,
      assignments: {
        include: {
          employee: {
            include: {
              pod: true,
            },
          },
        },
      },
    },
  });
}

export async function deleteBrandProcess(id: string) {
  const brandProcess = await prisma.brandProcess.findUnique({ where: { id } });
  if (!brandProcess) {
    throw new NotFoundError(`BrandProcess with id ${id} not found`);
  }

  return prisma.brandProcess.delete({ where: { id } });
}
