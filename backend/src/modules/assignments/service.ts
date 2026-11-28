import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { CreateAssignmentInput, UpdateAssignmentInput } from './schema.js';

export async function fetchAssignments(employeeId?: string, brandProcessId?: string) {
  return prisma.assignment.findMany({
    where: {
      ...(employeeId && { employeeId }),
      ...(brandProcessId && { brandProcessId }),
    },
    include: {
      employee: true,
      brandProcess: {
        include: {
          brand: true,
          process: true,
          operatingRule: true,
        },
      },
    },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function createAssignment(data: CreateAssignmentInput) {
  return prisma.assignment.create({
    data: {
      employeeId: data.employeeId,
      brandProcessId: data.brandProcessId,
      allocationPercent: data.allocationPercent ?? 100,
      isPrimary: data.isPrimary ?? true,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
    include: {
      employee: true,
      brandProcess: {
        include: {
          brand: true,
          process: true,
          operatingRule: true,
        },
      },
    },
  });
}

export async function updateAssignment(id: string, data: UpdateAssignmentInput) {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) {
    throw new NotFoundError(`Assignment with id ${id} not found`);
  }

  return prisma.assignment.update({
    where: { id },
    data: {
      ...(data.allocationPercent !== undefined && { allocationPercent: data.allocationPercent }),
      ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
    },
    include: {
      employee: true,
      brandProcess: {
        include: {
          brand: true,
          process: true,
          operatingRule: true,
        },
      },
    },
  });
}

export async function deleteAssignment(id: string) {
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment) {
    throw new NotFoundError(`Assignment with id ${id} not found`);
  }

  return prisma.assignment.delete({ where: { id } });
}
