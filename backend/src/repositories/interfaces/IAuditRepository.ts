import type { AuditListQuery, AuditLog, CreateAuditRecord } from "../../types/audit";
import type { Paginated } from "../../types/pagination";

// Deliberately append-only: no update and no delete
export interface IAuditRepository {
  create(record: CreateAuditRecord): Promise<void>;
  list(query: AuditListQuery): Promise<Paginated<AuditLog>>;
}