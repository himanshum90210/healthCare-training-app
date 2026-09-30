export interface ScheduleBlock {
  dayOfWeek: number;
  startTime: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface DoctorListParams {
  page: number;
  limit: number;
  search?: string;
  specialty?: string;
  department?: string;
  sort: string;
  order: "asc" | "desc";
}

export interface DoctorFilterOptions {
  specialties: string[];
  departments: string[];
}

export interface Availability {
  doctorId: string;
  date: string;
  slotDurationMinutes: number;
  slots: { start: string; end: string }[];
}