import { HydratedDocument, Schema, Types, model } from "mongoose";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditData,
  type AuditEntityType,
} from "../types/audit";
import type { Role } from "../types/role";

export interface AuditLogDoc {
  actorId?: Types.ObjectId | null;
  actorRole?: Role | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  summary: string;
  before?: AuditData | null;
  after?: AuditData | null;
  metadata?: AuditData | null;
  requestId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export type AuditLogDocument = HydratedDocument<AuditLogDoc>;

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    actorRole: { type: String, default: null },
    action: { type: String, enum: [...AUDIT_ACTIONS], required: true },
    entityType: { type: String, enum: [...AUDIT_ENTITY_TYPES], required: true },
    entityId: { type: String, default: null },
    summary: { type: String, required: true, maxlength: 300 },
    before: { type: Schema.Types.Mixed, default: null },
    after: { type: Schema.Types.Mixed, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
    requestId: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

// Defence in depth: the application can append to the audit log but never change or delete it.
// In production also give the application's database user insert/find rights only.
auditLogSchema.pre(/^(update|delete|replace|findOneAnd)/, function () {
  throw new Error("Audit logs are immutable");
});

export const AuditLogModel = model<AuditLogDoc>("AuditLog", auditLogSchema);