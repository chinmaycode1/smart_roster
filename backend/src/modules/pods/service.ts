import { prisma } from '../../lib/prisma.js';
import type { CreatePodInput, UpdatePodInput } from './schema.js';

export async function getAllPods() {
  return prisma.pod.findMany({
    include: {
      _count: {
        select: { employees: true },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getPodById(id: string) {
  return prisma.pod.findUnique({
    where: { id },
    include: {
      employees: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });
}

export async function createPod(data: CreatePodInput) {
  return prisma.pod.create({
    data,
  });
}

export async function updatePod(id: string, data: UpdatePodInput) {
  return prisma.pod.update({
    where: { id },
    data,
  });
}

export async function deletePod(id: string) {
  const employeeCount = await prisma.employee.count({
    where: { podId: id },
  });

  if (employeeCount > 0) {
    throw new Error('Cannot delete pod with assigned employees');
  }

  return prisma.pod.delete({
    where: { id },
  });
}
