import { DateTime } from "luxon";

/** "2026-10-05" + "10:00" in the clinic zone -> exact UTC Date (null if invalid) */
export function clinicSlotToUtc(date: string, time: string, zone: string): Date | null {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone });
  return dt.isValid ? dt.toUTC().toJSDate() : null;
}

/** The UTC range [from, to) covering one clinic-local calendar day */
export function clinicDayRangeUtc(date: string, zone: string): { from: Date; to: Date } {
  const start = DateTime.fromISO(date, { zone }).startOf("day");
  return { from: start.toUTC().toJSDate(), to: start.plus({ days: 1 }).toUTC().toJSDate() };
}

/** A UTC instant -> the clinic-local calendar date, "YYYY-MM-DD" */
export function toClinicDate(instant: Date, zone: string): string {
  return DateTime.fromJSDate(instant, { zone }).toISODate() ?? "";
}