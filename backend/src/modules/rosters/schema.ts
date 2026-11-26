import { z } from 'zod';

export const generateRosterSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export const updateEntrySchema = z.object({
  status: z.enum(['WORKING', 'WEEKLY_OFF', 'LEAVE', 'HOLIDAY', 'COMP_OFF']),
  isLocked: z.boolean().optional(),
  note: z.string().optional(),
});

export type GenerateRosterInput = z.infer<typeof generateRosterSchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
