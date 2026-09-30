import { HydratedDocument, Schema, Types, model } from "mongoose";
import type { ScheduleBlock } from "../types/doctor";

export interface DoctorDoc {
  userId?: Types.ObjectId;
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
  yearsOfExperience: number;
  bio: string;
  slotDurationMinutes: number;
  weeklySchedule: ScheduleBlock[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DoctorDocument = HydratedDocument<DoctorDoc>;

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const scheduleBlockSchema = new Schema<ScheduleBlock>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true, match: TIME },
    endTime: { type: String, required: true, match: TIME },
  },
  { _id: false }
);

const doctorSchema = new Schema<DoctorDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    yearsOfExperience: { type: Number, required: true, min: 0 },
    bio: { type: String, default: "", trim: true },
    slotDurationMinutes: { type: Number, default: 30, min: 5, max: 120 },
    weeklySchedule: { type: [scheduleBlockSchema], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

doctorSchema.index({ lastName: 1, firstName: 1 });
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ department: 1 });
// One profile per login user, while allowing many profiles with no user
doctorSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $type: "objectId" } } });

export const DoctorModel = model<DoctorDoc>("Doctor", doctorSchema);