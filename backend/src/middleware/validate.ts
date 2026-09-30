import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validateBody =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, _res, next) => {
    req.body = schema.parse(req.body);
    next();
  };

export const validateQuery =
  <T>(schema: ZodType<T>): RequestHandler =>
  (req, res, next) => {
    res.locals.query = schema.parse(req.query);
    next();
  };