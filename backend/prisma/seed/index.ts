import { PrismaClient } from '@prisma/client';
import { seedEmployees } from './employees.js';
import { seedBrands } from './brands.js';
import { seedProcesses } from './processes.js';
import { seedAssignments } from './assignments.js';
import { seedRules } from './rules.js';
import { seedHolidays } from './holidays.js';
import { seedLeaves } from './leaves.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.auditLog.deleteMany();
  await prisma.conflict.deleteMany();
  await prisma.rosterEntry.deleteMany();
  await prisma.roster.deleteMany();
  await prisma.preference.deleteMany();
  await prisma.compOff.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.weeklyOffPattern.deleteMany();
  await prisma.coverageOverride.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.brandProcess.deleteMany();
  await prisma.publicHoliday.deleteMany();
  await prisma.operatingRule.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.process.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.pod.deleteMany();

  console.log('Cleared existing data');

  const { pods, employees } = await seedEmployees(prisma);
  console.log(`Seeded ${employees.length} employees in ${pods.length} pods`);

  const { brands } = await seedBrands(prisma);
  console.log(`Seeded ${brands.length} brands`);

  const { processes, shifts, operatingRules } = await seedProcesses(prisma);
  console.log(
    `Seeded ${processes.length} processes, ${shifts.length} shifts, ${operatingRules.length} operating rules`
  );

  const { brandProcesses, assignments, weeklyOffPatterns } = await seedAssignments(
    prisma,
    employees,
    brands,
    processes,
    operatingRules,
    shifts
  );
  console.log(
    `Seeded ${brandProcesses.length} brand-processes, ${assignments.length} assignments, ${weeklyOffPatterns.length} weekly-off patterns`
  );

  const { coverageOverrides } = await seedRules(prisma, brandProcesses);
  console.log(`Seeded ${coverageOverrides.length} coverage overrides`);

  const { holidays } = await seedHolidays(prisma);
  console.log(`Seeded ${holidays.length} public holidays`);

  const { leaves, compOffs } = await seedLeaves(prisma, employees);
  console.log(`Seeded ${leaves.length} leaves and ${compOffs.length} comp-offs`);

  console.log('Seeding complete');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
