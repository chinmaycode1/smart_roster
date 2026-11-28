import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../lib/errors.js';
import type { CreateEmployeeInput, UpdateEmployeeInput, WeeklyOffPatternInput } from './schema.js';

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

export async function createEmployee(data: CreateEmployeeInput) {
  return prisma.employee.create({
    data: {
      code: data.code,
      name: data.name,
      email: data.email,
      podId: data.podId,
      role: data.role || 'EMPLOYEE',
      maxConsecutiveWorkDays: data.maxConsecutiveWorkDays || 6,
    },
  });
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput) {
  return prisma.employee.update({
    where: { id },
    data,
  });
}

export async function fetchWeeklyOffPattern(employeeId: string) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new NotFoundError(`Employee with id ${employeeId} not found`);
  }

  return prisma.weeklyOffPattern.findUnique({
    where: { employeeId },
  });
}

export async function upsertWeeklyOffPattern(employeeId: string, data: WeeklyOffPatternInput) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) {
    throw new NotFoundError(`Employee with id ${employeeId} not found`);
  }

  return prisma.weeklyOffPattern.upsert({
    where: { employeeId },
    create: {
      employeeId,
      preferredOffDays: data.preferredOffDays,
      fixedOffDays: data.fixedOffDays,
      isFixed: data.isFixed,
    },
    update: {
      preferredOffDays: data.preferredOffDays,
      fixedOffDays: data.fixedOffDays,
      isFixed: data.isFixed,
    },
  });
}
