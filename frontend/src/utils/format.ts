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