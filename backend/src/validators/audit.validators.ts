import { z } from "zod";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../types/audit";
import { objectId, utcInstant } from "./common.validators";

export const auditListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  action: z.enum(AUDIT_ACTIONS).optional(),
  entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
  entityId: z.string().trim().max(64).optional(),
  actorId: objectId.optional(),
  from: utcInstant.optional(),
  to: utcInstant.optional(),
});