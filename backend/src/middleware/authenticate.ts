import type { RequestHandler } from "express";
import type { TokenService } from "../services/TokenService";
import { UnauthorizedError } from "../errors";

export function createAuthenticate(tokens: TokenService): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    }
    const payload = tokens.verifyAccessToken(header.slice(7).trim());
    req.user = { id: payload.sub, role: payload.role };
    next();
  };
}