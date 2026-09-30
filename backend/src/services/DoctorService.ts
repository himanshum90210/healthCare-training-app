import type { IDoctorRepository } from "../repositories/interfaces/IDoctorRepository";
import { NotFoundError } from "../errors";
import { dayOfWeekFromDate, generateSlots } from "../utils/slots";
import type { AvailabilityService } from "./AvailabilityService";


import type {
  AvailabilitySlot,
  BookableSlot,
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
  timezone: string,
  slotDurationMinutes: number;
  slots: BookableSlot[];
}

export class DoctorService {
  constructor(private readonly doctors: IDoctorRepository, private readonly availability: AvailabilityService) {}

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

  // async getAvailability(id: string, date: string, viewerRole: Role): Promise<Availability> {
  //   const doctor = await this.getById(id, viewerRole);
  //   const slots = doctor.isActive
  //     ? generateSlots(doctor.weeklySchedule, dayOfWeekFromDate(date), doctor.slotDurationMinutes)
  //     : [];
  //   return { doctorId: doctor.id, date, slotDurationMinutes: doctor.slotDurationMinutes, slots };
  // }

    async getAvailability(id: string, date: string, viewerRole: Role): Promise<Availability> {
    const doctor = await this.getById(id, viewerRole);
    return {
      doctorId: doctor.id,
      date,
      timezone: this.availability.timezone,
      slotDurationMinutes: doctor.slotDurationMinutes,
      slots: await this.availability.getOpenSlots(doctor, date),
    };
  }

}