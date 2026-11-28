import { z } from 'zod';

export const createCoverageOverrideSchema = z.object({
  brandProcessId: z.string().min(1),
  date: z.string().datetime().optional().nullable(),
  weekday: z.number().int().min(0).max(6).optional().nullable(),
  minCoverage: z.number().int().min(0),
  reason: z.string().optional().nullable(),
});

export type CreateCoverageOverrideInput = z.infer<typeof createCoverageOverrideSchema>;
