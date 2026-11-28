import { z } from 'zod';

export const createHolidaySchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  name: z.string(),
  isOptional: z.boolean().optional().default(false),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
