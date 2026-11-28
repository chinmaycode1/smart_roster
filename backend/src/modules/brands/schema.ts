import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  code: z.string().trim().min(1, 'Code is required'),
});

export const updateBrandSchema = z.object({
  name: z.string().trim().min(1).optional(),
  code: z.string().trim().min(1).optional(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
