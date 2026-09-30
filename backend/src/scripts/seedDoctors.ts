import { Database } from "../config/database";
import { DoctorModel } from "../models/doctor.model";
import { UserModel } from "../models/user.model";
import type { ScheduleBlock } from "../types/doctor";

const WEEKDAYS = [1, 2, 3, 4, 5];
const days = (list: number[], startTime: string, endTime: string): ScheduleBlock[] =>
  list.map((dayOfWeek) => ({ dayOfWeek, startTime, endTime }));

const BIO = "Synthetic profile for training purposes.";

const doctors = [
  {
    firstName: "Dev", lastName: "Doctor", specialty: "General Medicine", department: "Primary Care",
    yearsOfExperience: 8, slotDurationMinutes: 30,
    weeklySchedule: [...days(WEEKDAYS, "09:00", "13:00"), ...days(WEEKDAYS, "14:00", "17:00")],
    linkEmail: "doctor@demo.test",
  },
  { firstName: "Asha", lastName: "Menon", specialty: "Cardiology", department: "Cardiac Sciences", yearsOfExperience: 15, slotDurationMinutes: 30, weeklySchedule: days([1, 3, 5], "10:00", "16:00") },
  { firstName: "Imran", lastName: "Sheikh", specialty: "Cardiology", department: "Cardiac Sciences", yearsOfExperience: 9, slotDurationMinutes: 20, weeklySchedule: days([2, 4], "09:00", "15:00") },
  { firstName: "Rohan", lastName: "Iyer", specialty: "Orthopedics", department: "Musculoskeletal", yearsOfExperience: 12, slotDurationMinutes: 30, weeklySchedule: days(WEEKDAYS, "09:00", "12:00") },
  { firstName: "Meera", lastName: "Kapoor", specialty: "Pediatrics", department: "Child Health", yearsOfExperience: 7, slotDurationMinutes: 20, weeklySchedule: days([1, 2, 3, 4, 5, 6], "09:00", "13:00") },
  { firstName: "Tara", lastName: "Bose", specialty: "Pediatrics", department: "Child Health", yearsOfExperience: 4, slotDurationMinutes: 20, weeklySchedule: days([1, 3, 5], "14:00", "18:00") },
  { firstName: "Vikram", lastName: "Rao", specialty: "Neurology", department: "Neurosciences", yearsOfExperience: 18, slotDurationMinutes: 45, weeklySchedule: days([2, 4], "10:00", "16:00") },
  { firstName: "Sara", lastName: "Khan", specialty: "Dermatology", department: "Skin Care", yearsOfExperience: 6, slotDurationMinutes: 15, weeklySchedule: days(WEEKDAYS, "11:00", "17:00") },
  { firstName: "Arjun", lastName: "Nair", specialty: "ENT", department: "Head and Neck", yearsOfExperience: 10, slotDurationMinutes: 20, weeklySchedule: days([1, 2, 4], "09:00", "14:00") },
  { firstName: "Nisha", lastName: "Verma", specialty: "Gynecology", department: "Women's Health", yearsOfExperience: 14, slotDurationMinutes: 30, weeklySchedule: days([1, 2, 3, 4], "10:00", "15:00") },
  { firstName: "Kabir", lastName: "Sethi", specialty: "Psychiatry", department: "Mental Health", yearsOfExperience: 11, slotDurationMinutes: 50, weeklySchedule: days([2, 3, 5], "12:00", "18:00") },
  { firstName: "Leena", lastName: "Joshi", specialty: "Ophthalmology", department: "Eye Care", yearsOfExperience: 5, slotDurationMinutes: 20, weeklySchedule: days(WEEKDAYS, "09:00", "13:00") },
];

async function seed(): Promise<void> {
  const database = Database.getInstance();
  await database.connect();
  await DoctorModel.init();

  for (const { linkEmail, ...data } of doctors) {
    const linked = linkEmail ? await UserModel.findOne({ email: linkEmail }) : null;
    const result = await DoctorModel.updateOne(
      { firstName: data.firstName, lastName: data.lastName },
      { $setOnInsert: { ...data, bio: BIO, ...(linked ? { userId: linked._id } : {}) } },
      { upsert: true }
    );
    console.log(`${result.upsertedCount ? "created" : "skipped (exists)"}: Dr. ${data.firstName} ${data.lastName}`);
  }

  await database.disconnected();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});