import type { Role } from "./role";

export const APPOINTMENT_STATUSES = ["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

/** Statuses that occupy a slot */
export const ACTIVE_STATUSES: readonly AppointmentStatus[] = ["SCHEDULED", "CONFIRMED"];
export const isActiveStatus = (status: AppointmentStatus): boolean => ACTIVE_STATUSES.includes(status);

export interface DoctorSummary {
  id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
}

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  doctor: DoctorSummary;
  patient: PatientSummary;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  reason: string;
  bookedById: string;
  cancelledById: string | null;
  cancelReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAppointmentRecord {
  doctorId: string;
  patientId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
  bookedById: string;
}

export interface AppointmentListQuery {
  page: number;
  limit: number;
  status?: AppointmentStatus;
  doctorId?: string;
  patientId?: string;
  from?: Date;
  to?: Date;
  order: "asc" | "desc";
}

export interface Actor {
  id: string;
  role: Role;
}