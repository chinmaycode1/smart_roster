import { z } from 'zod';

export const createBrandProcessSchema = z.object({
  brandId: z.string().min(1),
  processId: z.string().min(1),
  operatingRuleId: z.string().min(1),
  defaultMinCoverage: z.number().int().min(1).default(1),
});

export const updateBrandProcessSchema = z.object({
  operatingRuleId: z.string().min(1).optional(),
  defaultMinCoverage: z.number().int().min(1).optional(),
});

export type CreateBrandProcessInput = z.infer<typeof createBrandProcessSchema>;
export type UpdateBrandProcessInput = z.infer<typeof updateBrandProcessSchema>;
