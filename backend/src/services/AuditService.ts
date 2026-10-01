import type { IAuditRepository } from "../repositories/interfaces/IAuditRepository";
import type { AuditEntryInput, AuditListQuery, AuditLog } from "../types/audit";
import type { Paginated } from "../types/pagination";
import { getRequestContext } from "../utils/requestContext";

export class AuditService {
  constructor(private readonly repo: IAuditRepository) {}

  /** Best-effort: an audit failure is logged loudly but never breaks the user's action */
  async record(entry: AuditEntryInput): Promise<void> {
    const context = getRequestContext();
    try {
      await this.repo.create({
        actorId: entry.actor?.id ?? null,
        actorRole: entry.actor?.role ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        summary: entry.summary,
        before: entry.before ?? null,
        after: entry.after ?? null,
        metadata: entry.metadata ?? null,
        requestId: context?.requestId ?? null,
        ip: context?.ip ?? null,
        userAgent: context?.userAgent ?? null,
      });
    } catch (err) {
      console.error("AUDIT WRITE FAILED", { action: entry.action, entityId: entry.entityId, err });
    }
  }

  list(query: AuditListQuery): Promise<Paginated<AuditLog>> {
    return this.repo.list(query);
  }
}