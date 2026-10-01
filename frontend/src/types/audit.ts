import type { Role } from "./auth";

export const AUDIT_ACTIONS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "TOKEN_REUSE_DETECTED",
  "DOCTOR_CREATED",
  "DOCTOR_UPDATED",
  "APPOINTMENT_BOOKED",
  "APPOINTMENT_RESCHEDULED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_CONFIRMED",
  "APPOINTMENT_COMPLETED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = ["USER", "DOCTOR", "APPOINTMENT"] as const;

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorRole: Role | null;
  actorName: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  summary: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  requestId: string | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditListParams {
  page: number;
  limit: number;
  action?: string;
  entityType?: string;
}