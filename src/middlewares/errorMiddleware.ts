import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { CustomError } from '../types/customError';

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);

  // Handle Zod validation errors
   if (err instanceof ZodError) {
      res.status(500).json({
        success: false,
        message: 'Validation error',
        errors: err.errors, 
      });
      return;
  }

  //Handle Custom Errors
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.details || undefined,
    });
    return;
  }

  // Determine the status code
  const statusCode = err.status || 500;

  // Handle generic errors
   res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Optionally include stack trace (avoid in production)
    // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
 
}
