export type Role = "ADMIN" | "DOCTOR" | "RECEPTIONIST" | "PATIENT";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
}