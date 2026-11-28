import { z } from 'zod';

export const createAssignmentSchema = z.object({
  employeeId: z.string().min(1),
  brandProcessId: z.string().min(1),
  allocationPercent: z.number().int().min(0).max(100).default(100),
  isPrimary: z.boolean().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  allocationPercent: z.number().int().min(0).max(100).optional(),
  isPrimary: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
