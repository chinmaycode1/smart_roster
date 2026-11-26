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
}
