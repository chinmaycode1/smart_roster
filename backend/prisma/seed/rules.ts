import type { PrismaClient, BrandProcess, CoverageOverride } from '@prisma/client';

export async function seedRules(prisma: PrismaClient, brandProcesses: BrandProcess[]) {
  const coverageOverrides: CoverageOverride[] = [];

  // Add Friday coverage boost for a couple of brands
  if (brandProcesses.length > 5) {
    coverageOverrides.push(
      await prisma.coverageOverride.create({
        data: {
          brandProcessId: brandProcesses[5].id,
          weekday: 5,
          minCoverage: 2,
          reason: 'Higher ticket volume on Fridays',
        },
      })
    );
  }

  if (brandProcesses.length > 10) {
    coverageOverrides.push(
      await prisma.coverageOverride.create({
        data: {
          brandProcessId: brandProcesses[10].id,
          weekday: 1,
          minCoverage: 2,
          reason: 'Post-weekend queries spike',
        },
      })
    );
  }

  return { coverageOverrides };
}
