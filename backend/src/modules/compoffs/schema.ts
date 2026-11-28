import { z } from 'zod';

export const createCompOffSchema = z.object({
  employeeId: z.string(),
  earnedOn: z.string().transform((val) => new Date(val)),
  redeemOn: z.string().transform((val) => new Date(val)).optional(),
  status: z.enum(['EARNED', 'REDEEMED', 'EXPIRED']).optional().default('EARNED'),
});

export const updateCompOffSchema = z.object({
  redeemOn: z.string().transform((val) => new Date(val)).optional(),
  status: z.enum(['EARNED', 'REDEEMED', 'EXPIRED']).optional(),
});

export type CreateCompOffInput = z.infer<typeof createCompOffSchema>;
export type UpdateCompOffInput = z.infer<typeof updateCompOffSchema>;
