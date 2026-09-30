import type { IDoctorRepository } from "../repositories/interfaces/IDoctorRepository";
import { NotFoundError } from "../errors";
import { dayOfWeekFromDate, generateSlots } from "../utils/slots";
import type {
  AvailabilitySlot,
  CreateDoctorInput,
  Doctor,
  DoctorFilterOptions,
  DoctorListQuery,
  UpdateDoctorInput,
} from "../types/doctor";
import type { Paginated } from "../types/pagination";
import type { Role } from "../types/role";

export interface Availability {
  doctorId: string;
  date: string;
  slotDurationMinutes: number;
  slots: AvailabilitySlot[];
}

export class DoctorService {
  constructor(private readonly doctors: IDoctorRepository) {}

  async list(query: DoctorListQuery, viewerRole: Role): Promise<Paginated<Doctor>> {
    // Only admins may see inactive doctors, whatever the client asks for
    return this.doctors.list({ ...query, includeInactive: query.includeInactive && viewerRole === "ADMIN" });
  }

  async getById(id: string, viewerRole: Role): Promise<Doctor> {
    const doctor = await this.doctors.findById(id);
    if (!doctor || (!doctor.isActive && viewerRole !== "ADMIN")) {
      throw new NotFoundError("Doctor not found", "DOCTOR_NOT_FOUND");
    }
    return doctor;
  }

  create(input: CreateDoctorInput): Promise<Doctor> {
    return this.doctors.create(input);
  }

  async update(id: string, patch: UpdateDoctorInput): Promise<Doctor> {
    const doctor = await this.doctors.update(id, patch);
    if (!doctor) throw new NotFoundError("Doctor not found", "DOCTOR_NOT_FOUND");
    return doctor;
  }

  getFilterOptions(): Promise<DoctorFilterOptions> {
    return this.doctors.getFilterOptions();
  }

  async getAvailability(id: string, date: string, viewerRole: Role): Promise<Availability> {
    const doctor = await this.getById(id, viewerRole);
    const slots = doctor.isActive
      ? generateSlots(doctor.weeklySchedule, dayOfWeekFromDate(date), doctor.slotDurationMinutes)
      : [];
    return { doctorId: doctor.id, date, slotDurationMinutes: doctor.slotDurationMinutes, slots };
  }
}