export class CustomError extends Error {
    statusCode: number;
    details?: any;
  
    constructor(message: string, statusCode: number = 500, details?: any) {
      super(message);
      this.statusCode = statusCode;
      this.details = details || null; // Default to `null` if not provided
  
      // Set the prototype explicitly for extending built-in classes
      Object.setPrototypeOf(this, CustomError.prototype);
    }
  }
  