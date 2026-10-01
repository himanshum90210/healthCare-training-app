import type { IDoctorRepository } from "../repositories/interfaces/IDoctorRepository";
import { NotFoundError } from "../errors";
// import { dayOfWeekFromDate, generateSlots } from "../utils/slots";
import type { AvailabilityService } from "./AvailabilityService";


import type {
  // AvailabilitySlot,
  BookableSlot,
  CreateDoctorInput,
  Doctor,
  DoctorFilterOptions,
  DoctorListQuery,
  UpdateDoctorInput,
} from "../types/doctor";
import type { Paginated } from "../types/pagination";
import type { Role } from "../types/role";
import { AuditService } from "./AuditService";
import { Actor } from "../types/appointment";

export interface Availability {
  doctorId: string;
  date: string;
  timezone: string,
  slotDurationMinutes: number;
  slots: BookableSlot[];
}

export class DoctorService {
  constructor(private readonly doctors: IDoctorRepository, private readonly availability: AvailabilityService, private readonly audit: AuditService) { }

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

  // create(input: CreateDoctorInput): Promise<Doctor> {
  //   return this.doctors.create(input);
  // }

  async create(actor: Actor, input: CreateDoctorInput): Promise<Doctor> {
  const doctor = await this.doctors.create(input);
  await this.audit.record({
    actor,
    action: "DOCTOR_CREATED",
    entityType: "DOCTOR",
    entityId: doctor.id,
    summary: `Created profile for Dr. ${doctor.firstName} ${doctor.lastName}`,
    after: { specialty: doctor.specialty, department: doctor.department, isActive: doctor.isActive },
  });
  return doctor;
}

  // async update(id: string, patch: UpdateDoctorInput): Promise<Doctor> {
  //   const doctor = await this.doctors.update(id, patch);
  //   if (!doctor) throw new NotFoundError("Doctor not found", "DOCTOR_NOT_FOUND");
  //   return doctor;
  // }

  async update(actor: Actor, id: string, patch: UpdateDoctorInput): Promise<Doctor> {
    const before = await this.doctors.findById(id);
    if (!before) throw new NotFoundError("Doctor not found", "DOCTOR_NOT_FOUND");

    const doctor = await this.doctors.update(id, patch);
    if (!doctor) throw new NotFoundError("Doctor not found", "DOCTOR_NOT_FOUND");

    // Record only the fields that were part of the change
    const keys = Object.keys(patch) as (keyof UpdateDoctorInput)[];
    await this.audit.record({
      actor,
      action: "DOCTOR_UPDATED",
      entityType: "DOCTOR",
      entityId: id,
      summary: `Updated profile for Dr. ${doctor.firstName} ${doctor.lastName}`,
      before: Object.fromEntries(keys.map((k) => [k, before[k]])),
      after: Object.fromEntries(keys.map((k) => [k, doctor[k]])),
    });
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