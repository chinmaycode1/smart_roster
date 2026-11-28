import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string(),
  code: z.string(),
});

export const updateBrandSchema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
