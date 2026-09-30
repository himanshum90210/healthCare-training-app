import type { AvailabilitySlot, ScheduleBlock } from "../types/doctor";

export const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const toTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** Day of week (0 = Sunday) for a "YYYY-MM-DD" date, independent of server timezone */
export const dayOfWeekFromDate = (date: string): number => new Date(`${date}T00:00:00Z`).getUTCDay();

export function generateSlots(
  blocks: ScheduleBlock[],
  dayOfWeek: number,
  slotMinutes: number
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const dayBlocks = blocks
    .filter((b) => b.dayOfWeek === dayOfWeek)
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  for (const block of dayBlocks) {
    const end = toMinutes(block.endTime);
    for (let start = toMinutes(block.startTime); start + slotMinutes <= end; start += slotMinutes) {
      slots.push({ start: toTime(start), end: toTime(start + slotMinutes) });
    }
  }
  return slots;
}