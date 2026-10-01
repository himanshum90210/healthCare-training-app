import { Router, type RequestHandler } from "express";
import type { AuditController } from "../controllers/AuditController";
import { authorize } from "../middleware/authorize";
import { validateQuery } from "../middleware/validate";
import { auditListQuerySchema } from "../validators/audit.validators";

export function createAuditRouter(controller: AuditController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate, authorize("ADMIN"));
  router.get("/", validateQuery(auditListQuerySchema), controller.list);
  return router;
}