import type {
  PrismaClient,
  Employee,
  Brand,
  Process,
  OperatingRule,
  Shift,
  BrandProcess,
  Assignment,
  WeeklyOffPattern,
} from '@prisma/client';

export async function seedAssignments(
  prisma: PrismaClient,
  employees: Employee[],
  brands: Brand[],
  processes: Process[],
  operatingRules: OperatingRule[],
  shifts: Shift[]
) {
  const csProcess = processes.find((p) => p.code === 'CS')!;
  const accProcess = processes.find((p) => p.code === 'ACC')!;
  const retentionProcess = processes.find((p) => p.code === 'RETENTION')!;
  const ndrProcess = processes.find((p) => p.code === 'NDR')!;

  const all365Rule = operatingRules.find((r) => r.type === 'ALL_365')!;
  const dailyExceptHolidaysRule = operatingRules.find(
    (r) => r.type === 'DAILY_EXCEPT_HOLIDAYS'
  )!;
  const noSundaysRule = operatingRules.find((r) => r.type === 'EXCEPT_SUNDAYS_AND_HOLIDAYS')!;

  const generalShift = shifts[0];

  const brandProcesses: BrandProcess[] = [];
  const assignments: Assignment[] = [];
  const weeklyOffPatterns: WeeklyOffPattern[] = [];

  // 16 single-resource brands (80% of 20)
  const singleResourceBrands = brands.slice(0, 16);

  // Brand 0: PureGlow Skincare - single resource, all processes, 365 days
  brandProcesses.push(
    await prisma.brandProcess.create({
      data: {
        brandId: singleResourceBrands[0].id,
        processId: csProcess.id,
        operatingRuleId: all365Rule.id,
        shiftId: generalShift.id,
        defaultMinCoverage: 1,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[1].id,
        brandProcessId: brandProcesses[brandProcesses.length - 1].id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[1].id,
        preferredOffDays: [0],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Brand 1: VerdantLeaf Nutrition - single resource, daily except holidays
  brandProcesses.push(
    await prisma.brandProcess.create({
      data: {
        brandId: singleResourceBrands[1].id,
        processId: csProcess.id,
        operatingRuleId: dailyExceptHolidaysRule.id,
        shiftId: generalShift.id,
        defaultMinCoverage: 1,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[2].id,
        brandProcessId: brandProcesses[brandProcesses.length - 1].id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[2].id,
        preferredOffDays: [6],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Brand 2: Silkstream Apparel - single resource, no Sundays and holidays
  brandProcesses.push(
    await prisma.brandProcess.create({
      data: {
        brandId: singleResourceBrands[2].id,
        processId: csProcess.id,
        operatingRuleId: noSundaysRule.id,
        shiftId: generalShift.id,
        defaultMinCoverage: 1,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[3].id,
        brandProcessId: brandProcesses[brandProcesses.length - 1].id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[3].id,
        preferredOffDays: [1],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Brands 3-10: single resource each
  for (let i = 3; i < 11; i++) {
    const empIdx = i + 1;
    brandProcesses.push(
      await prisma.brandProcess.create({
        data: {
          brandId: singleResourceBrands[i].id,
          processId: csProcess.id,
          operatingRuleId: i % 2 === 0 ? dailyExceptHolidaysRule.id : noSundaysRule.id,
          shiftId: generalShift.id,
          defaultMinCoverage: 1,
        },
      })
    );
    assignments.push(
      await prisma.assignment.create({
        data: {
          employeeId: employees[empIdx].id,
          brandProcessId: brandProcesses[brandProcesses.length - 1].id,
          allocationPercent: 100,
          isPrimary: true,
        },
      })
    );
    weeklyOffPatterns.push(
      await prisma.weeklyOffPattern.create({
        data: {
          employeeId: employees[empIdx].id,
          preferredOffDays: [i % 7],
          fixedOffDays: [],
          isFixed: false,
        },
      })
    );
  }

  // Brands 11-15: some employees own 2 or 3 brands
  // Employee 12 owns brands 11 and 12
  for (let i = 11; i < 13; i++) {
    brandProcesses.push(
      await prisma.brandProcess.create({
        data: {
          brandId: singleResourceBrands[i].id,
          processId: csProcess.id,
          operatingRuleId: noSundaysRule.id,
          shiftId: generalShift.id,
          defaultMinCoverage: 1,
        },
      })
    );
    assignments.push(
      await prisma.assignment.create({
        data: {
          employeeId: employees[12].id,
          brandProcessId: brandProcesses[brandProcesses.length - 1].id,
          allocationPercent: 50,
          isPrimary: true,
        },
      })
    );
  }
  if (!weeklyOffPatterns.find((p) => p.employeeId === employees[12].id)) {
    weeklyOffPatterns.push(
      await prisma.weeklyOffPattern.create({
        data: {
          employeeId: employees[12].id,
          preferredOffDays: [2],
          fixedOffDays: [],
          isFixed: false,
        },
      })
    );
  }

  // Employee 13 owns brands 13, 14, 15
  for (let i = 13; i < 16; i++) {
    brandProcesses.push(
      await prisma.brandProcess.create({
        data: {
          brandId: singleResourceBrands[i].id,
          processId: csProcess.id,
          operatingRuleId: dailyExceptHolidaysRule.id,
          shiftId: generalShift.id,
          defaultMinCoverage: 1,
        },
      })
    );
    assignments.push(
      await prisma.assignment.create({
        data: {
          employeeId: employees[13].id,
          brandProcessId: brandProcesses[brandProcesses.length - 1].id,
          allocationPercent: 33,
          isPrimary: true,
        },
      })
    );
  }
  if (!weeklyOffPatterns.find((p) => p.employeeId === employees[13].id)) {
    weeklyOffPatterns.push(
      await prisma.weeklyOffPattern.create({
        data: {
          employeeId: employees[13].id,
          preferredOffDays: [3],
          fixedOffDays: [],
          isFixed: false,
        },
      })
    );
  }

  // 4 multi-employee brands (20%)
  const multiEmployeeBrands = brands.slice(16, 20);

  // Brand 16: ActiveFit Gear - 2 employees on different processes
  // CS runs 7 days, ACC runs no Sundays
  const activeFitCS = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[0].id,
      processId: csProcess.id,
      operatingRuleId: dailyExceptHolidaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(activeFitCS);
  const activeFitACC = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[0].id,
      processId: accProcess.id,
      operatingRuleId: noSundaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(activeFitACC);
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[14].id,
        brandProcessId: activeFitCS.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[15].id,
        brandProcessId: activeFitACC.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[14].id,
        preferredOffDays: [0],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[15].id,
        preferredOffDays: [0],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Brand 17: FreshHaven Groceries - 3 processes, 3 employees
  const freshHavenCS = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[1].id,
      processId: csProcess.id,
      operatingRuleId: all365Rule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(freshHavenCS);
  const freshHavenACC = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[1].id,
      processId: accProcess.id,
      operatingRuleId: dailyExceptHolidaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(freshHavenACC);
  const freshHavenNDR = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[1].id,
      processId: ndrProcess.id,
      operatingRuleId: noSundaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(freshHavenNDR);

  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[16].id,
        brandProcessId: freshHavenCS.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[17].id,
        brandProcessId: freshHavenACC.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[18].id,
        brandProcessId: freshHavenNDR.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[16].id,
        preferredOffDays: [0],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[17].id,
        preferredOffDays: [6],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[18].id,
        preferredOffDays: [0],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Brand 18: PureTone Wellness - 2 employees share CS process, min coverage 2
  const pureToneCS = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[2].id,
      processId: csProcess.id,
      operatingRuleId: dailyExceptHolidaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 2,
    },
  });
  brandProcesses.push(pureToneCS);
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[19].id,
        brandProcessId: pureToneCS.id,
        allocationPercent: 50,
        isPrimary: true,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[20].id,
        brandProcessId: pureToneCS.id,
        allocationPercent: 50,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[19].id,
        preferredOffDays: [2],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[20].id,
        preferredOffDays: [4],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Brand 19: BloomField Gardens - 2 processes, 2 employees
  const bloomFieldCS = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[3].id,
      processId: csProcess.id,
      operatingRuleId: noSundaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(bloomFieldCS);
  const bloomFieldRetention = await prisma.brandProcess.create({
    data: {
      brandId: multiEmployeeBrands[3].id,
      processId: retentionProcess.id,
      operatingRuleId: dailyExceptHolidaysRule.id,
      shiftId: generalShift.id,
      defaultMinCoverage: 1,
    },
  });
  brandProcesses.push(bloomFieldRetention);
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[21].id,
        brandProcessId: bloomFieldCS.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[22].id,
        brandProcessId: bloomFieldRetention.id,
        allocationPercent: 100,
        isPrimary: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[21].id,
        preferredOffDays: [0],
        fixedOffDays: [0],
        isFixed: true,
      },
    })
  );
  weeklyOffPatterns.push(
    await prisma.weeklyOffPattern.create({
      data: {
        employeeId: employees[22].id,
        preferredOffDays: [6],
        fixedOffDays: [],
        isFixed: false,
      },
    })
  );

  // Add a few backup assignments (employees assigned to multiple brands)
  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[23].id,
        brandProcessId: activeFitCS.id,
        allocationPercent: 20,
        isPrimary: false,
      },
    })
  );
  if (!weeklyOffPatterns.find((p) => p.employeeId === employees[23].id)) {
    weeklyOffPatterns.push(
      await prisma.weeklyOffPattern.create({
        data: {
          employeeId: employees[23].id,
          preferredOffDays: [5],
          fixedOffDays: [],
          isFixed: false,
        },
      })
    );
  }

  assignments.push(
    await prisma.assignment.create({
      data: {
        employeeId: employees[24].id,
        brandProcessId: freshHavenCS.id,
        allocationPercent: 20,
        isPrimary: false,
      },
    })
  );
  if (!weeklyOffPatterns.find((p) => p.employeeId === employees[24].id)) {
    weeklyOffPatterns.push(
      await prisma.weeklyOffPattern.create({
        data: {
          employeeId: employees[24].id,
          preferredOffDays: [0],
          fixedOffDays: [],
          isFixed: false,
        },
      })
    );
  }

  // Fill in remaining employees with weekly-off patterns
  for (let i = 25; i < 32; i++) {
    if (!weeklyOffPatterns.find((p) => p.employeeId === employees[i].id)) {
      weeklyOffPatterns.push(
        await prisma.weeklyOffPattern.create({
          data: {
            employeeId: employees[i].id,
            preferredOffDays: [i % 7],
            fixedOffDays: [],
            isFixed: false,
          },
        })
      );
    }
  }

  return { brandProcesses, assignments, weeklyOffPatterns };
}
