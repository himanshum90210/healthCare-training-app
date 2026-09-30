import { Router, type RequestHandler } from "express";
import type { AuthController } from "../controllers/AuthController";
import { validateBody } from "../middleware/validate";
import { loginSchema } from "../validators/auth.validators";

export function createAuthRouter(controller: AuthController, authenticate: RequestHandler): Router {
  const router = Router();
  router.post("/login", validateBody(loginSchema), controller.login);
  router.post("/refresh", controller.refresh);
  router.post("/logout", controller.logout);
  router.get("/me", authenticate, controller.me)
  return router;
}