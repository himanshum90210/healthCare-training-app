import type { Role, User } from "../types/auth";

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  RECEPTIONIST: "Receptionist",
  PATIENT: "Patient",
};

export const roleLabel = (role: Role): string => ROLE_LABELS[role];

export const initials = (user: Pick<User, "firstName" | "lastName">): string =>
  `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

export const formatDateTime = (iso: string | null): string =>
  iso
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso))
    : "First sign-in";

export const CLINIC_TZ: string = import.meta.env.VITE_CLINIC_TIMEZONE ?? "Asia/Kolkata";

export const formatClinicDateTime = (iso: string): string => 
  new Intl.DateTimeFormat("en-IN", {timeZone: CLINIC_TZ, dateStyle: "medium", timeStyle: "short"}).format(new Date(iso));

export const clinicDateOf = (iso: string): string => 
  new Intl.DateTimeFormat("en-CA", {timeZone: CLINIC_TZ, year: "numeric",  month: "2-digit", day: "2-digit"}).format(new Date(iso));

export const todayInClinic = (): string => clinicDateOf(new Date().toISOString());

export const formatClinicTimestamp = (iso: string): string =>
  new Intl.DateTimeFormat("en-IN", { timeZone: CLINIC_TZ, dateStyle: "medium", timeStyle: "medium" }).format(
    new Date(iso)
  );

export function timeAgo(iso: string): string {
  const seconds = (Date.now() - new Date(iso).getTime()) / 1000;
  if (seconds < 60) return "just now";
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (seconds < 3600) return rtf.format(-Math.floor(seconds / 60), "minute");
  if (seconds < 86400) return rtf.format(-Math.floor(seconds / 3600), "hour");
  return rtf.format(-Math.floor(seconds / 86400), "day");
}
