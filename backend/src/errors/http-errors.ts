import { AppError, type ErrorDetails } from "./AppError";

export class BadRequestError extends AppError {
    constructor(message = "Bad request", code = "Bad_Request", details?: ErrorDetails[]) {
        super(message, 400, code, details);
    }
}



export class ValidationError extends AppError {
    constructor(message = "Validation failed", details?: ErrorDetails[]) {
        super(message, 400, "VALIDATION_ERROR", details)
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Authentication required", code = "UNAUTHORIZED") {
        super(message, 401, code)
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action", code = "FORBIDDEN") {
        super(message, 403, code)
    }
}


export class NotFoundError extends AppError {
    constructor(message = "Resource not found", code = "NOT_FOUND") {
        super(message, 404, code);
    }
}


export class ConflictError extends AppError {
    constructor(message = "Conflict", code = "CONFLICT") {
        super(message, 409, code)
    }
}
