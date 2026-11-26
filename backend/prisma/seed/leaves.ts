import type { PrismaClient, Employee, Leave, CompOff } from '@prisma/client';

export async function seedLeaves(prisma: PrismaClient, employees: Employee[]) {
  const leaves: Leave[] = [];
  const compOffs: CompOff[] = [];

  // Seed a few approved leaves in December 2026 for demonstration
  leaves.push(
    await prisma.leave.create({
      data: {
        employeeId: employees[5].id,
        startDate: new Date('2026-12-10'),
        endDate: new Date('2026-12-11'),
        type: 'PLANNED',
        status: 'APPROVED',
        reason: 'Family function',
      },
    })
  );

  leaves.push(
    await prisma.leave.create({
      data: {
        employeeId: employees[14].id,
        startDate: new Date('2026-12-15'),
        endDate: new Date('2026-12-15'),
        type: 'CASUAL',
        status: 'APPROVED',
        reason: 'Personal work',
      },
    })
  );

  // One comp-off earned on a holiday and redeemed
  compOffs.push(
    await prisma.compOff.create({
      data: {
        employeeId: employees[1].id,
        earnedOn: new Date('2026-11-04'),
        redeemOn: new Date('2026-12-18'),
        status: 'REDEEMED',
      },
    })
  );

  // One pending leave (to show impact)
  leaves.push(
    await prisma.leave.create({
      data: {
        employeeId: employees[3].id,
        startDate: new Date('2026-12-23'),
        endDate: new Date('2026-12-24'),
        type: 'PLANNED',
        status: 'PENDING',
        reason: 'Year-end break',
      },
    })
  );

  return { leaves, compOffs };
}
