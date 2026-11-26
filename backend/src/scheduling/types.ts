export interface EmployeeData {
  id: string;
  code: string;
  name: string;
  podId: string;
  maxConsecutiveWorkDays: number;
  assignments: AssignmentData[];
  weeklyOffPattern?: WeeklyOffPatternData;
  leaves: LeaveData[];
  compOffs: CompOffData[];
}

export interface AssignmentData {
  id: string;
  brandProcessId: string;
  allocationPercent: number;
  isPrimary: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface WeeklyOffPatternData {
  preferredOffDays: number[];
  fixedOffDays: number[];
  isFixed: boolean;
}

export interface LeaveData {
  startDate: Date;
  endDate: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CompOffData {
  earnedOn: Date;
  redeemOn?: Date;
  status: 'EARNED' | 'REDEEMED' | 'EXPIRED';
}

export interface BrandProcessData {
  id: string;
  brandId: string;
  brandName: string;
  brandCode: string;
  processId: string;
  processName: string;
  processCode: string;
  operatingRule: OperatingRuleData;
  shiftId?: string;
  defaultMinCoverage: number;
  coverageOverrides: CoverageOverrideData[];
}

export interface OperatingRuleData {
  type: 'ALL_365' | 'DAILY_EXCEPT_HOLIDAYS' | 'EXCEPT_SUNDAYS_AND_HOLIDAYS' | 'CUSTOM_WEEKDAYS';
  workingWeekdays: number[];
  worksOnHolidays: boolean;
}

export interface CoverageOverrideData {
  date?: Date;
  weekday?: number;
  minCoverage: number;
}

export interface PublicHolidayData {
  date: Date;
}

export interface RosterEntryData {
  employeeId: string;
  date: Date;
  status: 'WORKING' | 'WEEKLY_OFF' | 'LEAVE' | 'HOLIDAY' | 'COMP_OFF';
  source: 'GENERATED' | 'MANUAL';
  isLocked: boolean;
  note?: string;
}

export interface ConflictData {
  severity: 'ERROR' | 'WARNING';
  code: string;
  brandProcessId?: string;
  employeeId?: string;
  date?: Date;
  message: string;
  suggestedActions: SuggestedAction[];
}

export interface SuggestedAction {
  type: 'ASSIGN_BACKUP' | 'SWAP_WEEKLY_OFF' | 'MOVE_WEEKLY_OFF' | 'ADJUST_COVERAGE';
  description: string;
  employeeId?: string;
  employeeName?: string;
  date?: Date;
  impact?: string;
}

export interface DemandMap {
  [brandProcessId: string]: {
    [dateKey: string]: number;
  };
}

export interface AvailabilityMap {
  [employeeId: string]: {
    [dateKey: string]: AvailabilityStatus;
  };
}

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'FIXED_OFF'
  | 'HOLIDAY'
  | 'LEAVE'
  | 'COMP_OFF'
  | 'WEEKLY_OFF';

export interface GenerationContext {
  month: number;
  year: number;
  employees: EmployeeData[];
  brandProcesses: BrandProcessData[];
  holidays: PublicHolidayData[];
  lockedEntries: RosterEntryData[];
}

export interface GenerationResult {
  entries: RosterEntryData[];
  conflicts: ConflictData[];
}
