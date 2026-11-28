import { prisma } from '../../lib/prisma.js';
import type { CreateLeaveInput, UpdateLeaveInput } from './schema.js';

async function findAffectedRosters(startDate: Date, endDate: Date) {
  const rosters = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Find all rosters covering the leave period
  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    
    const roster = await prisma.roster.findFirst({
      where: { month, year },
      orderBy: { createdAt: 'desc' },
    });
    
    if (roster) {
      rosters.push(roster);
    }
  }

  return rosters;
}

export async function getLeaves(filters?: { employeeId?: string; status?: string }) {
  return prisma.leave.findMany({
    where: {
      ...(filters?.employeeId && { employeeId: filters.employeeId }),
      ...(filters?.status && { status: filters.status as 'PENDING' | 'APPROVED' | 'REJECTED' }),
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
    orderBy: { startDate: 'desc' },
  });
}

export async function createLeave(data: CreateLeaveInput) {
  return prisma.leave.create({
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

export async function updateLeave(id: string, data: UpdateLeaveInput) {
  const oldLeave = await prisma.leave.findUnique({ where: { id } });
  
  const updated = await prisma.leave.update({
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

  // If status changed to APPROVED and wasn't before, check for affected rosters
  if (data.status === 'APPROVED' && oldLeave?.status !== 'APPROVED') {
    const affectedRosters = await findAffectedRosters(updated.startDate, updated.endDate);
    
    // Return the updated leave with roster info so controller can handle it
    return {
      ...updated,
      _affectedRosterIds: affectedRosters.map(r => r.id),
    };
  }

  return updated;
}

export async function deleteLeave(id: string) {
  return prisma.leave.delete({
    where: { id },
  });
}
