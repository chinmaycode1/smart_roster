import type { Request, Response } from 'express';
import { createHolidaySchema } from './schema.js';
import * as holidayService from './service.js';

export async function listHolidays(_req: Request, res: Response) {
  const holidays = await holidayService.getHolidays();
  res.json({ data: holidays });
}

export async function createHoliday(req: Request, res: Response) {
  const data = createHolidaySchema.parse(req.body);
  const holiday = await holidayService.createHoliday(data);
  res.status(201).json({ data: holiday });
}

export async function deleteHoliday(req: Request, res: Response) {
  await holidayService.deleteHoliday(req.params.id);
  res.status(204).send();
}
