import type {
  Appointment,
  AppointmentListQuery,
  AppointmentStatus,
  CreateAppointmentRecord,
} from "../../types/appointment";
import type { Paginated } from "../../types/pagination";

export interface TimeRange {
  startTime: Date;
  endTime: Date;
}

export interface OverlapQuery {
  doctorId?: string;
  patientId?: string;
  start: Date;
  end: Date;
  excludeId?: string;
}

export interface IAppointmentRepository {
  /** Throws ConflictError(APPOINTMENT_CONFLICT) if the slot was taken concurrently */
  create(record: CreateAppointmentRecord): Promise<Appointment>;
  findById(id: string): Promise<Appointment | null>;
  list(query: AppointmentListQuery): Promise<Paginated<Appointment>>;
  findActiveForDoctorBetween(doctorId: string, from: Date, to: Date): Promise<TimeRange[]>;
  hasActiveOverlap(query: OverlapQuery): Promise<boolean>;
  /** Atomic: only applies while the appointment is still active. Returns null otherwise. */
  reschedule(id: string, range: TimeRange): Promise<Appointment | null>;
  cancel(
    id: string,
    details: { cancelledById: string; reason: string | null; at: Date }
  ): Promise<Appointment | null>;
  /** Atomic status change, only if the current status is one of `from`. */
  transition(id: string, from: AppointmentStatus[], to: AppointmentStatus): Promise<Appointment | null>;
}