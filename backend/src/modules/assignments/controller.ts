import type { Request, Response, NextFunction } from 'express';
import * as service from './service.js';
import type { CreateAssignmentInput, UpdateAssignmentInput } from './schema.js';

export async function getAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, brandProcessId } = req.query;
    const assignments = await service.fetchAssignments(
      employeeId as string | undefined,
      brandProcessId as string | undefined
    );
    res.json({ data: assignments });
  } catch (error) {
    next(error);
  }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await service.createAssignment(req.body as CreateAssignmentInput);
    res.status(201).json({ data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function updateAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const assignment = await service.updateAssignment(req.params.id, req.body as UpdateAssignmentInput);
    res.json({ data: assignment });
  } catch (error) {
    next(error);
  }
}

export async function deleteAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    await service.deleteAssignment(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
