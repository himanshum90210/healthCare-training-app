import { HydratedDocument, Schema, Types, model } from "mongoose";
import { APPOINTMENT_STATUSES, type AppointmentStatus } from "../types/appointment";

export interface AppointmentDoc {
  doctorId: Types.ObjectId;
  patientId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  reason: string;
  bookedById: Types.ObjectId;
  cancelledById?: Types.ObjectId | null;
  cancelReason?: string | null;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AppointmentDocument = HydratedDocument<AppointmentDoc>;

const appointmentSchema = new Schema<AppointmentDoc>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: [...APPOINTMENT_STATUSES], default: "SCHEDULED" },
    reason: { type: String, default: "", trim: true, maxlength: 300 },
    bookedById: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cancelledById: { type: Schema.Types.ObjectId, ref: "User", default: null },
    cancelReason: { type: String, default: null, trim: true, maxlength: 300 },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// The database-level guarantee against double booking: only one ACTIVE appointment
// per doctor per start time. Cancelled/completed ones don't block the slot.
appointmentSchema.index(
  { doctorId: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ["SCHEDULED", "CONFIRMED"] } } }
);
appointmentSchema.index({ doctorId: 1, startTime: -1 });
appointmentSchema.index({ patientId: 1, startTime: -1 });

export const AppointmentModel = model<AppointmentDoc>("Appointment", appointmentSchema);