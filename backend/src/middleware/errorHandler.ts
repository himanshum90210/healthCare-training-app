import type { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { Config } from "../config/config";
import { getRequestContext } from "../utils/requestContext";
import { AppError, BadRequestError, ConflictError, NotFoundError, ValidationError } from "../errors"

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`, "ROUTE_NOT_FOUND"));

}

function normalizeError(err: unknown): AppError | null {
    if (err instanceof AppError) return err;

    if (err instanceof ZodError) {
        return new ValidationError(
            "Validation failed", err.issues.map((i) => ({ field: i.path.join("."), message: i.message }))
        )
    };



    if (err instanceof mongoose.Error.ValidationError) {
        return new ValidationError(
            "Validation Failed", Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }))
        )
    }

    if (err instanceof mongoose.Error.CastError) {
        return new BadRequestError(`Invalid value for ${err.path}`, "INVALID_ID");

    }

    if (typeof err === "object" && err !== null && (err as { code?: unknown }).code === 11000) {
        const keys = Object.keys((err as { keyPattern?: object }).keyPattern ?? {});
        return new ConflictError(
            keys.length ? `${keys.join(",")} already exists` : "Duplicate value", "DUPLICATE_KEY"
        );
    }


    if (err instanceof SyntaxError && "body" in err) {
        return new BadRequestError("Malformed JSON in request body", "INVALID_JSON")
    }


    return null;


}


export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
    const requestId = getRequestContext()?.requestId;
    if (res.headersSent) {
        next(err);
        return;
    }


    const config = Config.getInstance();
    const appError = normalizeError(err);

    if (!appError) {
        console.error("Unhandled error", err);
        res.status(500).json({
            succss: false,
            message: "internal server error",
            code: "INTERNAL_ERROR",
            requestId,
            ...(config.isDevelopment && err instanceof Error ? { stack: err.stack } : {}),
        });
        return;
    }

    res.status(appError.statusCode).json({
        success: false,
        message: appError.message,
        code: appError.code,
        requestId,
        ...(appError.details ? { details: appError.details } : {}),
        ...(config.isDevelopment ? { stack: appError.stack } : {}),
    });
}

