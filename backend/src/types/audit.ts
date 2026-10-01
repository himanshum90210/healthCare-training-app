import type { Actor } from "./appointment";
import type { Role } from "./role";

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
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export type AuditData = Record<string, unknown>;

/** What callers of AuditService provide */
export interface AuditEntryInput {
  actor: Actor | null; // null for anonymous events such as a failed sign-in
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  summary: string;
  before?: AuditData;
  after?: AuditData;
  metadata?: AuditData;
}

/** What is stored */
export interface CreateAuditRecord {
  actorId: string | null;
  actorRole: Role | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string | null;
  summary: string;
  before: AuditData | null;
  after: AuditData | null;
  metadata: AuditData | null;
  requestId: string | null;
  ip: string | null;
  userAgent: string | null;
}

export interface AuditLog extends CreateAuditRecord {
  id: string;
  actorName: string | null;
  createdAt: Date;
}

export interface AuditListQuery {
  page: number;
  limit: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  entityId?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
}