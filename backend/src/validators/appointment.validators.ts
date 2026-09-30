import { z } from "zod";
import { APPOINTMENT_STATUSES } from "../types/appointment";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

// UTC ISO timestamp such as 2026-10-05T04:30:00.000Z, exactly the `startsAt` the availability endpoint returns
const utcInstant = z.iso.datetime().transform((value) => new Date(value));

export const bookAppointmentSchema = z.object({
  doctorId: objectId,
  startTime: utcInstant,
  reason: z.string().trim().max(300).optional(),
  patientId: objectId.optional(),
});

export const rescheduleAppointmentSchema = z.object({ startTime: utcInstant });

// Cancel may be sent with no body at all
export const cancelAppointmentSchema = z
  .object({ reason: z.string().trim().max(300).optional() })
  .optional()
  .transform((body) => body ?? {});

export const appointmentListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  doctorId: objectId.optional(),
  patientId: objectId.optional(),
  from: utcInstant.optional(),
  to: utcInstant.optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
});