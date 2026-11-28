export interface DashboardSummary {
  totalEmployees: number;
  totalBrands: number;
  totalProcesses: number;
  openConflicts: number;
  coverageData: {
    working: number;
    totalDays: number;
    percentage: number;
  } | null;
}

export interface Pod {
  id: string;
  name: string;
  code: string;
  _count: {
    employees: number;
  };
}

export interface Brand {
  id: string;
  name: string;
  code: string;
  _count: {
    brandProcesses: number;
  };
  brandProcesses?: BrandProcess[];
}

export interface Process {
  id: string;
  name: string;
  code: string;
  description?: string;
  _count: {
    brandProcesses: number;
  };
  brandProcesses?: BrandProcess[];
}

export interface BrandProcess {
  id: string;
  brandId: string;
  processId: string;
  operatingRuleId: string;
  defaultMinCoverage: number;
  brand?: Brand;
  process?: Process;
  operatingRule?: OperatingRule;
  assignments?: AssignmentWithEmployee[];
}

export interface OperatingRule {
  id: string;
  name: string;
  type: string;
  workingWeekdays: number[];
  worksOnHolidays: boolean;
}

export interface CoverageOverride {
  id: string;
  brandProcessId: string;
  date?: string;
  weekday?: number;
  minCoverage: number;
  reason?: string;
  brandProcess?: BrandProcess;
}

export interface WeeklyOffPattern {
  id: string;
  employeeId: string;
  preferredOffDays: number[];
  fixedOffDays: number[];
  isFixed: boolean;
}

export interface Employee {
  id: string;
  code: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  pod?: {
    id: string;
    name: string;
  };
  assignments?: Assignment[];
}

export interface Assignment {
  id: string;
  employeeId: string;
  brandProcessId: string;
  allocationPercent: number;
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
  brandProcess?: BrandProcess;
  employee?: Employee;
}

export interface AssignmentWithEmployee extends Assignment {
  employee: {
    id: string;
    code: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
    pod?: {
      id: string;
      name: string;
    };
  };
}

export interface DashboardSummary {
  totalEmployees: number;
  totalBrands: number;
  totalProcesses: number;
  openConflicts: number;
  errorCount: number;
  warningCount: number;
  coverage: {
    covered: number;
    uncovered: number;
    offLeave: number;
    percentage: number;
  };
  todayOverview: {
    date: string;
    working: number;
    onLeave: number;
    weeklyOff: number;
    holiday: number;
    compOff: number;
    coverageGaps: number;
  } | null;
  brandCoverage: Array<{
    brandName: string;
    percentage: number;
  }>;
  preview: Array<{
    employeeId: string;
    employeeName: string;
    podName: string;
    statuses: Record<number, string>;
  }>;
}
