import type { RequestHandler } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors";
import type { Role } from "../types/role";

export function authorize(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    }
    if (!allowed.includes(req.user.role)) {
      throw new ForbiddenError();
    }
    next();
  };
}