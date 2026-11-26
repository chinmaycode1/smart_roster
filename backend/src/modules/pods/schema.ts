import { z } from 'zod';

export const createPodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  code: z.string().min(1, 'Code is required').max(20),
});

export const updatePodSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  code: z.string().min(1).max(20).optional(),
});

export type CreatePodInput = z.infer<typeof createPodSchema>;
export type UpdatePodInput = z.infer<typeof updatePodSchema>;
