import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AuditListParams } from "../../types/audit";
import { fetchAuditLogs } from "./auditApi";

export function useAuditLogs(params: AuditListParams) {
  return useQuery({
    queryKey: ["audit", "list", params] as const,
    queryFn: () => fetchAuditLogs(params),
    placeholderData: keepPreviousData,
  });
}