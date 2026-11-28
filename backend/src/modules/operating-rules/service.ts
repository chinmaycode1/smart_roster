import { prisma } from '../../lib/prisma.js';
import type { OperatingRuleType } from '@prisma/client';

export async function getAllOperatingRules() {
  return prisma.operatingRule.findMany({
    include: {
      _count: {
        select: { brandProcesses: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getOperatingRuleById(id: string) {
  return prisma.operatingRule.findUnique({
    where: { id },
    include: {
      brandProcesses: true,
    },
  });
}

export async function createOperatingRule(data: {
  name: string;
  type: string;
  workingWeekdays: number[];
  worksOnHolidays: boolean;
}) {
  return prisma.operatingRule.create({
    data: {
      ...data,
      type: data.type as OperatingRuleType,
    },
  });
}

export async function updateOperatingRule(
  id: string,
  data: {
    name?: string;
    type?: string;
    workingWeekdays?: number[];
    worksOnHolidays?: boolean;
  }
) {
  return prisma.operatingRule.update({
    where: { id },
    data: {
      ...data,
      type: data.type ? (data.type as OperatingRuleType) : undefined,
    },
  });
}

export async function deleteOperatingRule(id: string) {
  const count = await prisma.brandProcess.count({
    where: { operatingRuleId: id },
  });

  if (count > 0) {
    throw new Error('Cannot delete operating rule assigned to brand processes');
  }

  return prisma.operatingRule.delete({
    where: { id },
  });
}
