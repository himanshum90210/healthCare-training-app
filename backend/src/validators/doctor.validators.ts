import { z } from "zod";
import { DOCTOR_SORT_FIELDS } from "../types/doctor";
import { toMinutes } from "../utils/slots";

const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm (24-hour)");

const scheduleBlockSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeString,
    endTime: timeString,
  })
  .refine((b) => toMinutes(b.endTime) > toMinutes(b.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

const weeklyScheduleSchema = z
  .array(scheduleBlockSchema)
  .max(28)
  .refine(
    (blocks) => {
      for (let day = 0; day <= 6; day++) {
        const sorted = blocks
          .filter((b) => b.dayOfWeek === day)
          .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
        for (let i = 1; i < sorted.length; i++) {
          if (toMinutes(sorted[i].startTime) < toMinutes(sorted[i - 1].endTime)) return false;
        }
      }
      return true;
    },
    { message: "Schedule blocks on the same day must not overlap" }
  );

const name = z.string().trim().min(1).max(60);
const label = z.string().trim().min(1).max(80);

// No .default() here: defaults live in the Mongoose model so PATCH can't accidentally reset fields
const fields = {
  firstName: name,
  lastName: name,
  specialty: label,
  department: label,
  yearsOfExperience: z.number().int().min(0).max(60),
  bio: z.string().trim().max(1000),
  slotDurationMinutes: z.number().int().min(5).max(120),
  weeklySchedule: weeklyScheduleSchema,
  isActive: z.boolean(),
};

// Unknown keys (like userId or _id) are stripped, which blocks mass-assignment
export const createDoctorSchema = z.object({
  firstName: fields.firstName,
  lastName: fields.lastName,
  specialty: fields.specialty,
  department: fields.department,
  yearsOfExperience: fields.yearsOfExperience,
  bio: fields.bio.optional(),
  slotDurationMinutes: fields.slotDurationMinutes.optional(),
  weeklySchedule: fields.weeklySchedule.optional(),
  isActive: fields.isActive.optional(),
});

export const updateDoctorSchema = z
  .object(fields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: "Provide at least one field to update" });

export const doctorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  specialty: z.string().trim().max(80).optional(),
  department: z.string().trim().max(80).optional(),
  includeInactive: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
  sort: z.enum(DOCTOR_SORT_FIELDS).default("lastName"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// export const availabilityQuerySchema = z.object({
//   date: z
//     .string()
//     .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
//     .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().startsWith(v), "Not a real calendar date"),
// });
export const availabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00Z`);
      // Reject invalid dates, and ones that roll over (e.g. 2026-02-30 becomes March 2)
      return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
    }, "Not a real calendar date"),
});