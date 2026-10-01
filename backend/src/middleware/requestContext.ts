import { randomUUID } from "crypto";
import type { RequestHandler } from "express";
import { runWithRequestContext } from "../utils/requestContext";

export const requestContextMiddleware: RequestHandler = (req, res, next) => {
  // Accept a caller-supplied id only if it looks sane; otherwise generate one
  const incoming = req.header("x-request-id");
  const requestId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : randomUUID();

  res.setHeader("X-Request-Id", requestId);
  runWithRequestContext(
    { requestId, ip: req.ip ?? null, userAgent: req.header("user-agent")?.slice(0, 200) ?? null },
    next
  );
};