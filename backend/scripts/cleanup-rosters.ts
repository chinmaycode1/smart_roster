import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupRosters(month: number, year: number) {
  console.log(`Cleaning up rosters for ${month}/${year}...`);

  const rosters = await prisma.roster.findMany({
    where: { month, year },
    orderBy: { version: 'desc' },
  });

  if (rosters.length <= 1) {
    console.log('Only one or no roster found. Nothing to clean up.');
    return;
  }

  const latestRoster = rosters[0];
  const rostersToDelete = rosters.slice(1);

  console.log(`Keeping roster version ${latestRoster.version} (ID: ${latestRoster.id})`);
  console.log(`Deleting ${rostersToDelete.length} old roster(s)...`);

  for (const roster of rostersToDelete) {
    console.log(`Deleting roster version ${roster.version} (ID: ${roster.id})...`);

    await prisma.rosterEntry.deleteMany({ where: { rosterId: roster.id } });
    await prisma.conflict.deleteMany({ where: { rosterId: roster.id } });
    await prisma.auditLog.deleteMany({ where: { entityType: 'Roster', entityId: roster.id } });
    await prisma.roster.delete({ where: { id: roster.id } });

    console.log(`Deleted roster version ${roster.version}`);
  }

  console.log('Cleanup completed successfully!');
}

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: npm run cleanup:rosters <month> <year>');
  console.error('Example: npm run cleanup:rosters 12 2026');
  process.exit(1);
}

const month = parseInt(args[0]);
const year = parseInt(args[1]);

if (isNaN(month) || month < 1 || month > 12) {
  console.error('Invalid month. Must be between 1 and 12.');
  process.exit(1);
}

if (isNaN(year) || year < 2000) {
  console.error('Invalid year.');
  process.exit(1);
}

cleanupRosters(month, year)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during cleanup:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
