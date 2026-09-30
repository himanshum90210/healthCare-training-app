import type { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import type { IDoctorRepository } from "../repositories/interfaces/IDoctorRepository";
import type { IUserRepository } from "../repositories/interfaces/IUserRepository";
import type { AvailabilityService, SlotWindow } from "./AvailabilityService";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "../errors";
import {
  isActiveStatus,
  type Actor,
  type Appointment,
  type AppointmentListQuery,
} from "../types/appointment";
import type { Doctor } from "../types/doctor";
import type { Paginated } from "../types/pagination";
import { toClinicDate } from "../utils/clinicTime";

export interface BookAppointmentInput {
  doctorId: string;
  startTime: Date;
  reason?: string;
  patientId?: string;
}

const NOT_FOUND = () => new NotFoundError("Appointment not found", "APPOINTMENT_NOT_FOUND");
const INVALID_STATE = (message: string) => new ConflictError(message, "INVALID_APPOINTMENT_STATE");

export class AppointmentService {
  constructor(
    private readonly appointments: IAppointmentRepository,
    private readonly doctors: IDoctorRepository,
    private readonly users: IUserRepository,
    private readonly availability: AvailabilityService,
    private readonly now: () => Date = () => new Date()
  ) {}

  // ---------- commands ----------

  async book(actor: Actor, input: BookAppointmentInput): Promise<Appointment> {
    const patientId = await this.resolvePatientId(actor, input.patientId);

    const doctor = await this.doctors.findById(input.doctorId);
    if (!doctor || !doctor.isActive) throw new NotFoundError("Doctor not found", "DOCTOR_NOT_FOUND");

    const slot = this.requireSlot(doctor, input.startTime);
    await this.assertNoConflicts({ doctorId: doctor.id, patientId, slot });

    return this.appointments.create({
      doctorId: doctor.id,
      patientId,
      startTime: slot.startsAt,
      endTime: slot.endsAt,
      reason: input.reason ?? "",
      bookedById: actor.id,
    });
  }

  async reschedule(actor: Actor, id: string, newStart: Date): Promise<Appointment> {
    const appointment = await this.getAccessible(actor, id);
    if (!isActiveStatus(appointment.status)) {
      throw INVALID_STATE(`A ${appointment.status.toLowerCase()} appointment cannot be rescheduled`);
    }

    const doctor = await this.doctors.findById(appointment.doctorId);
    if (!doctor || !doctor.isActive) {
      throw new ConflictError("This doctor is no longer available", "DOCTOR_UNAVAILABLE");
    }

    const slot = this.requireSlot(doctor, newStart);
    await this.assertNoConflicts({
      doctorId: doctor.id,
      patientId: appointment.patientId,
      slot,
      excludeId: appointment.id,
    });

    const updated = await this.appointments.reschedule(id, { startTime: slot.startsAt, endTime: slot.endsAt });
    if (!updated) throw INVALID_STATE("Appointment can no longer be rescheduled");
    return updated;
  }

  async cancel(actor: Actor, id: string, reason?: string): Promise<Appointment> {
    const appointment = await this.getAccessible(actor, id);
    if (!isActiveStatus(appointment.status)) {
      throw INVALID_STATE(`Appointment is already ${appointment.status.toLowerCase()}`);
    }

    const cancelled = await this.appointments.cancel(id, {
      cancelledById: actor.id,
      reason: reason?.trim() || null,
      at: this.now(),
    });
    if (!cancelled) throw INVALID_STATE("Appointment can no longer be cancelled");
    return cancelled;
  }

  async confirm(actor: Actor, id: string): Promise<Appointment> {
    await this.getAccessible(actor, id);
    const confirmed = await this.appointments.transition(id, ["SCHEDULED"], "CONFIRMED");
    if (!confirmed) throw INVALID_STATE("Only a scheduled appointment can be confirmed");
    return confirmed;
  }

  async complete(actor: Actor, id: string): Promise<Appointment> {
    await this.getAccessible(actor, id);
    const completed = await this.appointments.transition(id, ["CONFIRMED"], "COMPLETED");
    if (!completed) throw INVALID_STATE("Only a confirmed appointment can be completed");
    return completed;
  }

  // ---------- queries ----------

  async getById(actor: Actor, id: string): Promise<Appointment> {
    return this.getAccessible(actor, id);
  }

  async list(actor: Actor, query: AppointmentListQuery): Promise<Paginated<Appointment>> {
    const scoped: AppointmentListQuery = { ...query };

    // The role decides the scope. Any doctorId/patientId the client sent is overridden.
    if (actor.role === "PATIENT") {
      scoped.patientId = actor.id;
    } else if (actor.role === "DOCTOR") {
      const profile = await this.doctors.findByUserId(actor.id);
      if (!profile) {
        throw new ForbiddenError("No doctor profile is linked to this account", "DOCTOR_PROFILE_MISSING");
      }
      scoped.doctorId = profile.id;
    }

    return this.appointments.list(scoped);
  }

  // ---------- helpers ----------

  private async resolvePatientId(actor: Actor, requested?: string): Promise<string> {
    if (actor.role === "PATIENT") return actor.id; // patients can only book for themselves

    if (!requested) {
      throw new BadRequestError("patientId is required when booking for a patient", "PATIENT_REQUIRED");
    }
    const patient = await this.users.findById(requested);
    if (!patient || patient.role !== "PATIENT" || !patient.isActive) {
      throw new NotFoundError("Patient not found", "PATIENT_NOT_FOUND");
    }
    return patient.id;
  }

  /** The requested instant must be a real, future slot in the doctor's schedule */
  private requireSlot(doctor: Doctor, start: Date): SlotWindow {
    if (start.getTime() <= this.now().getTime()) {
      throw new BadRequestError("Cannot book a time in the past", "PAST_TIME");
    }
    const date = toClinicDate(start, this.availability.timezone);
    const slot = this.availability
      .getSlotGrid(doctor, date)
      .find((s) => s.startsAt.getTime() === start.getTime());

    if (!slot) {
      throw new BadRequestError("Selected time is not a bookable slot for this doctor", "SLOT_INVALID");
    }
    return slot;
  }

  private async assertNoConflicts(args: {
    doctorId: string;
    patientId: string;
    slot: SlotWindow;
    excludeId?: string;
  }): Promise<void> {
    const { doctorId, patientId, slot, excludeId } = args;

    if (await this.appointments.hasActiveOverlap({ doctorId, start: slot.startsAt, end: slot.endsAt, excludeId })) {
      throw new ConflictError("Appointment slot is no longer available", "APPOINTMENT_CONFLICT");
    }
    if (await this.appointments.hasActiveOverlap({ patientId, start: slot.startsAt, end: slot.endsAt, excludeId })) {
      throw new ConflictError("The patient already has an appointment at this time", "PATIENT_DOUBLE_BOOKED");
    }
  }

  /** Loads an appointment only if the actor is allowed to see it; otherwise reports "not found" */
  private async getAccessible(actor: Actor, id: string): Promise<Appointment> {
    const appointment = await this.appointments.findById(id);
    if (!appointment) throw NOT_FOUND();

    if (actor.role === "ADMIN" || actor.role === "RECEPTIONIST") return appointment;
    if (actor.role === "PATIENT" && appointment.patientId === actor.id) return appointment;
    if (actor.role === "DOCTOR") {
      const profile = await this.doctors.findByUserId(actor.id);
      if (profile && profile.id === appointment.doctorId) return appointment;
    }
    throw NOT_FOUND(); // 404 instead of 403, so other people's appointment ids can't be probed
  }
}