import { Router, type RequestHandler } from "express";
import type { DoctorController } from "../controllers/DoctorController";
import { authorize } from "../middleware/authorize";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  availabilityQuerySchema,
  createDoctorSchema,
  doctorListQuerySchema,
  updateDoctorSchema,
} from "../validators/doctor.validators";

export function createDoctorRouter(controller: DoctorController, authenticate: RequestHandler): Router {
  const router = Router();
  router.use(authenticate);

  // Reads: every authenticated role
  router.get("/filters", controller.filterOptions); // must be declared before "/:id"
  router.get("/", validateQuery(doctorListQuerySchema), controller.list);
  router.get("/:id", controller.getById);
  router.get("/:id/availability", validateQuery(availabilityQuerySchema), controller.availability);

  // Writes: admin only, enforced on the server
  router.post("/", authorize("ADMIN"), validateBody(createDoctorSchema), controller.create);
  router.patch("/:id", authorize("ADMIN"), validateBody(updateDoctorSchema), controller.update);

  return router;
}