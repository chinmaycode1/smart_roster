import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';

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
    const employee = await service.createEmployee(req.body);
    res.status(201).json({ data: employee });
  } catch (error) {
    next(error);
  }
}

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await service.updateEmployee(req.params.id, req.body);
    res.json({ data: employee });
  } catch (error) {
    next(error);
  }
}
