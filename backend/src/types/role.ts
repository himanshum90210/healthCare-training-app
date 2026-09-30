export const ROLES = ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"] as const;
export type Role = (typeof ROLES)[number];