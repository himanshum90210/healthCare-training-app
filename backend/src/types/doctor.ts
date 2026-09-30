export interface ScheduleBlock {
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:mm", 24-hour
  endTime: string;
}

export interface Doctor {
  id: string;
  userId: string | null;
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

export const DOCTOR_SORT_FIELDS = ["lastName", "specialty", "yearsOfExperience", "createdAt"] as const;
export type DoctorSortField = (typeof DOCTOR_SORT_FIELDS)[number];

export interface DoctorListQuery {
  page: number;
  limit: number;
  search?: string;
  specialty?: string;
  department?: string;
  includeInactive: boolean;
  sort: DoctorSortField;
  order: "asc" | "desc";
}

export interface CreateDoctorInput {
  firstName: string;
  lastName: string;
  specialty: string;
  department: string;
  yearsOfExperience: number;
  bio?: string;
  slotDurationMinutes?: number;
  weeklySchedule?: ScheduleBlock[];
  isActive?: boolean;
}

export type UpdateDoctorInput = Partial<CreateDoctorInput>;

export interface DoctorFilterOptions {
  specialties: string[];
  departments: string[];
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface BookableSlot extends AvailabilitySlot {
  startsAt: string; // exact UTC instant, ISO 8601: what the client sends back when booking
}