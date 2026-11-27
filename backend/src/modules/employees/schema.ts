import { z } from 'zod';

export const createEmployeeSchema = z.object({
  code: z.string(),
  name: z.string(),
  email: z.string().email(),
  podId: z.string(),
  role: z.enum(['EMPLOYEE', 'POD_LEAD']).optional(),
  maxConsecutiveWorkDays: z.number().optional(),
});

export const updateEmployeeSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
  maxConsecutiveWorkDays: z.number().optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
