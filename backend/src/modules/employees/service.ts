import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';

export async function fetchEmployees() {
  return prisma.employee.findMany({
    include: {
      pod: true,
      assignments: {
        include: {
          brandProcess: {
            include: {
              brand: true,
              process: true,
            },
          },
        },
      },
    },
    orderBy: { code: 'asc' },
  });
}

export async function fetchEmployeeById(id: string) {
  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      pod: true,
      assignments: {
        include: {
          brandProcess: {
            include: {
              brand: true,
              process: true,
            },
          },
        },
      },
      weeklyOffPattern: true,
      leaves: {
        where: { status: 'APPROVED' },
      },
    },
  });

  if (!employee) {
    throw new NotFoundError(`Employee with id ${id} not found`);
  }

  return employee;
}

export async function createEmployee(data: {
  code: string;
  name: string;
  email: string;
  podId: string;
  role?: string;
  maxConsecutiveWorkDays?: number;
}) {
  return prisma.employee.create({
    data: {
      code: data.code,
      name: data.name,
      email: data.email,
      podId: data.podId,
      role: (data.role as 'EMPLOYEE' | 'POD_LEAD') || 'EMPLOYEE',
      maxConsecutiveWorkDays: data.maxConsecutiveWorkDays || 6,
    },
  });
}

export async function updateEmployee(
  id: string,
  data: {
    name?: string;
    email?: string;
    isActive?: boolean;
    maxConsecutiveWorkDays?: number;
  }
) {
  return prisma.employee.update({
    where: { id },
    data,
  });
}
