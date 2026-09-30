import { Router, type RequestHandler } from "express";
import type { AppointmentController } from "../controllers/AppointmentController";
import { authorize } from "../middleware/authorize";
import { validateBody, validateQuery } from "../middleware/validate";
import {
  appointmentListQuerySchema,
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
} from "../validators/appointment.validators";

export function createAppointmentRouter(
  controller: AppointmentController,
  authenticate: RequestHandler
): Router {
  const router = Router();
  router.use(authenticate);

  // Reads: scoped by role inside the service
  router.get("/", validateQuery(appointmentListQuerySchema), controller.list);
  router.get("/:id", controller.getById);

  // Booking and rescheduling: patients (for themselves), receptionists, admins. Never doctors.
  router.post("/", authorize("PATIENT", "RECEPTIONIST", "ADMIN"), validateBody(bookAppointmentSchema), controller.book);
  router.post(
    "/:id/reschedule",
    authorize("PATIENT", "RECEPTIONIST", "ADMIN"),
    validateBody(rescheduleAppointmentSchema),
    controller.reschedule
  );

  // Cancelling: anyone who can access the appointment (checked in the service)
  router.post("/:id/cancel", validateBody(cancelAppointmentSchema), controller.cancel);

  // Clinical workflow
  router.post("/:id/confirm", authorize("DOCTOR", "RECEPTIONIST", "ADMIN"), controller.confirm);
  router.post("/:id/complete", authorize("DOCTOR", "ADMIN"), controller.complete);

  return router;
}