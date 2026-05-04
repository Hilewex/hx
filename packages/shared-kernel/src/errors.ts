export class BaseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly isRetryable: boolean = false,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, false, details);
  }
}

export class NotFoundError extends BaseError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, false);
  }
}

export class SystemError extends BaseError {
  constructor(message: string, details?: unknown) {
    super('SYSTEM_ERROR', message, true, details);
  }
}
