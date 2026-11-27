import { z } from 'zod';

export const createBrandSchema = z.object({
  name: z.string(),
  code: z.string(),
});

export type CreateBrandInput = z.infer<typeof createBrandSchema>;
