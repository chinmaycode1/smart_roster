import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';
import type { CreateEmployeeInput, UpdateEmployeeInput } from './schema.js';

export async function getEmployees(_req: Request, res: Response, next: NextFunction) {
  try {
    const employees = await service.fetchEmployees();
    res.json({ data: employees });
  } catch (error) {
    next(error);
  }
}

export async function getEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await service.fetchEmployeeById(req.params.id);
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
}

export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await service.createEmployee(req.body as CreateEmployeeInput);
    res.status(201).json({ data: employee });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await service.updateEmployee(req.params.id, req.body as UpdateEmployeeInput);
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
}
