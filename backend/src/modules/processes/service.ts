import { prisma } from '../../lib/prisma.js';
import type { CreateProcessInput, UpdateProcessInput } from './schema.js';

export async function getAllProcesses() {
  return prisma.process.findMany({
    include: {
      _count: {
        select: { brandProcesses: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getProcessById(id: string) {
  return prisma.process.findUnique({
    where: { id },
    include: {
      brandProcesses: {
        include: {
          brand: true,
        },
      },
    },
  });
}

export async function createProcess(data: CreateProcessInput) {
  return prisma.process.create({
    data,
  });
}

export async function updateProcess(id: string, data: UpdateProcessInput) {
  return prisma.process.update({
    where: { id },
    data,
  });
}

export async function deleteProcess(id: string) {
  const brandProcessCount = await prisma.brandProcess.count({
    where: { processId: id },
  });

  if (brandProcessCount > 0) {
    throw new Error('Cannot delete process assigned to brands');
  }

  return prisma.process.delete({
    where: { id },
  });
}
