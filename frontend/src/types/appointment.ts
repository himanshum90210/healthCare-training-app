export type AppointmentStatus = "SCHEDULED" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  doctor: { id: string; firstName: string; lastName: string; specialty: string; department: string };
  patient: { id: string; firstName: string; lastName: string };
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string;
  bookedById: string;
  cancelledById: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppointmentListParams {
  page: number;
  limit: number;
  status?: string;
  from?: string;
  to?: string;
  order: "asc" | "desc";
}