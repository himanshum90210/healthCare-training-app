import { Router, type RequestHandler } from "express";
import type { NotificationController } from "../controllers/NotificationController";
import { validateQuery } from "../middleware/validate";
import { notificationListQuerySchema } from "../validators/notification.validators";

export function createNotificationRouter(controller: NotificationController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);
  router.get("/", validateQuery(notificationListQuerySchema), controller.list);
  router.post("/read-all", controller.markAllRead);
  router.post("/:id/read", controller.markRead);
  return router;
}