import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'Invalid input'
      });
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Query validation failed',
        details: error instanceof Error ? error.message : 'Invalid query parameters'
      });
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      res.status(400).json({ 
        error: 'Parameters validation failed',
        details: error instanceof Error ? error.message : 'Invalid parameters'
      });
    }
  };
};
