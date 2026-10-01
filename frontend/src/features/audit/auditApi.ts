import { api } from "../../services/api";
import type { AuditListParams, AuditLog } from "../../types/audit";
import type { PageMeta, Paginated } from "../../types/pagination";
import { cleanParams } from "../../utils/params";

export async function fetchAuditLogs(params: AuditListParams): Promise<Paginated<AuditLog>> {
  const res = await api.get<{ data: AuditLog[]; meta: PageMeta }>("/api/audit-logs", { params: cleanParams(params) });
  return { items: res.data.data, meta: res.data.meta };
}