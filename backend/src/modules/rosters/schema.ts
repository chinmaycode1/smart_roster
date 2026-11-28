import { z } from 'zod';

export const listRostersSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(2100),
});

export const generateRosterSchema = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
  parentVersionId: z.string().optional(),
});

export const updateEntrySchema = z.object({
  status: z.enum(['WORKING', 'WEEKLY_OFF', 'LEAVE', 'HOLIDAY', 'COMP_OFF']),
  isLocked: z.boolean().optional(),
  note: z.string().optional(),
});

export const changeImpactSchema = z.object({
  entryId: z.string(),
  newStatus: z.string(),
});

export const approvalActionSchema = z.object({
  actorId: z.string().optional(),
  reason: z.string().optional(),
});

export type ListRostersInput = z.infer<typeof listRostersSchema>;
export type GenerateRosterInput = z.infer<typeof generateRosterSchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type ChangeImpactInput = z.infer<typeof changeImpactSchema>;
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
