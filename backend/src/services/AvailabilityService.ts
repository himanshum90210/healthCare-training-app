import { Config } from "../config/config";
import type { IAppointmentRepository } from "../repositories/interfaces/IAppointmentRepository";
import type { BookableSlot, Doctor } from "../types/doctor";
import { clinicDayRangeUtc, clinicSlotToUtc } from "../utils/clinicTime";
import { dayOfWeekFromDate, generateSlots } from "../utils/slots";

export interface SlotWindow {
  start: string; // clinic-local "HH:mm"
  end: string;
  startsAt: Date; // exact instants
  endsAt: Date;
}

export class AvailabilityService {
  constructor(
    private readonly appointments: IAppointmentRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  get timezone(): string {
    return Config.getInstance().clinicTimezone;
  }

  /** Every slot in the doctor's schedule on a clinic-local date, booked or not */
  getSlotGrid(doctor: Doctor, date: string): SlotWindow[] {
    if (!doctor.isActive) return [];
    const zone = this.timezone;

    return generateSlots(doctor.weeklySchedule, dayOfWeekFromDate(date), doctor.slotDurationMinutes).flatMap(
      (slot) => {
        const startsAt = clinicSlotToUtc(date, slot.start, zone);
        const endsAt = clinicSlotToUtc(date, slot.end, zone);
        return startsAt && endsAt ? [{ ...slot, startsAt, endsAt }] : [];
      }
    );
  }

  /** The grid minus past slots and slots already taken */
  async getOpenSlots(doctor: Doctor, date: string): Promise<BookableSlot[]> {
    const grid = this.getSlotGrid(doctor, date);
    if (grid.length === 0) return [];

    const { from, to } = clinicDayRangeUtc(date, this.timezone);
    const booked = await this.appointments.findActiveForDoctorBetween(doctor.id, from, to);
    const now = this.now();

    return grid
      .filter(
        (slot) =>
          slot.startsAt > now &&
          !booked.some((b) => b.startTime < slot.endsAt && b.endTime > slot.startsAt)
      )
      .map((slot) => ({ start: slot.start, end: slot.end, startsAt: slot.startsAt.toISOString() }));
  }
}