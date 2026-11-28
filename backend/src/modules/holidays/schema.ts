import { z } from 'zod';

export const createHolidaySchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  name: z.string(),
  region: z.string().optional().default('India'),
});

export type CreateHolidayInput = z.infer<typeof createHolidaySchema>;
