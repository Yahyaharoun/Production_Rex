export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non autorisé') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource introuvable') {
    super(message, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Erreur de validation') {
    super(message, 400);
  }
}
