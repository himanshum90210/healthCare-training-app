export interface ErrorDetails{
    field?: string;
    message: string;
}


export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: ErrorDetails[];


    constructor(
        message: string,
        statusCode: number,
        code: string,
        details?: ErrorDetails[]
    ){
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;
        this.details = details;
        Error.captureStackTrace(this, this.constructor)
    }
}