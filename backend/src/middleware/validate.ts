import type { Request, Response, NextFunction } from 'express';
import type { z, ZodSchema } from 'zod';
import { ValidationError } from '../lib/errors.js';

export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(new ValidationError('Invalid request body', result.error.errors));
      return;
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(new ValidationError('Invalid query parameters', result.error.errors));
      return;
    }
    req.query = result.data as z.infer<T>;
    next();
  };
}

export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      next(new ValidationError('Invalid path parameters', result.error.errors));
      return;
    }
    req.params = result.data as z.infer<T>;
    next();
  };
}
