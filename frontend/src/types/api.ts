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
  brand?: Brand;
  process?: Process;
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
  allocationPercent: number;
  isPrimary: boolean;
  brandProcess?: BrandProcess;
}
