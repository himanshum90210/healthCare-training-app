import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { useAuditLogs } from "../features/audit/useAuditLogs";
import { getApiError } from "../services/apiError";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES, type AuditAction, type AuditLog } from "../types/audit";
import { formatClinicTimestamp } from "../utils/format";

const humanize = (value: string): string => value.charAt(0) + value.slice(1).toLowerCase().replaceAll("_", " ");

const ACTION_OPTIONS = AUDIT_ACTIONS.map((a) => ({ value: a, label: humanize(a) }));
const ENTITY_OPTIONS = AUDIT_ENTITY_TYPES.map((e) => ({ value: e, label: humanize(e) }));

function toneFor(action: AuditAction): "danger" | "warning" | "success" | "info" {
  if (action === "LOGIN_FAILED" || action === "TOKEN_REUSE_DETECTED") return "danger";
  if (action === "APPOINTMENT_CANCELLED") return "warning";
  if (action === "LOGIN_SUCCESS") return "success";
  return "info";
}

const columns: Column<AuditLog>[] = [
  { key: "when", header: "When", render: (l) => formatClinicTimestamp(l.createdAt) },
  {
    key: "actor",
    header: "Actor",
    render: (l) =>
      l.actorName ? (
        <div>
          <strong>{l.actorName}</strong>
          <div className="hint">{l.actorRole ? humanize(l.actorRole) : ""}</div>
        </div>
      ) : (
        <span className="hint">Anonymous</span>
      ),
  },
  { key: "action", header: "Action", render: (l) => <Badge tone={toneFor(l.action)}>{humanize(l.action)}</Badge> },
  { key: "summary", header: "Summary", render: (l) => l.summary },
  {
    key: "entity",
    header: "Record",
    render: (l) => (
      <span className="hint">
        {humanize(l.entityType)}
        {l.entityId ? ` ...${l.entityId.slice(-6)}` : ""}
      </span>
    ),
  },
];

export default function AuditLogPage() {
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const page = Math.max(1, Number(params.get("page")) || 1);
  const action = params.get("action") ?? "";
  const entityType = params.get("entityType") ?? "";

  const logs = useAuditLogs({ page, limit: 15, action, entityType });

  const update = (changes: Record<string, string | undefined>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (value) next.set(key, value);
          else next.delete(key);
        }
        return next;
      },
      { replace: true }
    );

  return (
    <>
      <PageHeader title="Audit log" description="A permanent record of sign-ins and changes. Select a row for details." />

      <div className="toolbar">
        <Select
          label="Filter by action"
          value={action}
          placeholder="All actions"
          options={ACTION_OPTIONS}
          onChange={(v) => update({ action: v || undefined, page: undefined })}
        />
        <Select
          label="Filter by record type"
          value={entityType}
          placeholder="All record types"
          options={ENTITY_OPTIONS}
          onChange={(v) => update({ entityType: v || undefined, page: undefined })}
        />
      </div>

      {logs.isError ? (
        <Card>
          <div className="alert alert--danger" role="alert">
            {getApiError(logs.error).message}
          </div>
          <Button variant="secondary" onClick={() => void logs.refetch()}>
            Try again
          </Button>
        </Card>
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            rows={logs.data?.items ?? []}
            getRowId={(l) => l.id}
            loading={logs.isPending}
            skeletonRows={10}
            onRowClick={setSelected}
            emptyTitle="No audit entries"
            emptyMessage="Nothing matches these filters."
          />
          {logs.data && (
            <Pagination
              page={logs.data.meta.page}
              totalPages={logs.data.meta.totalPages}
              total={logs.data.meta.total}
              limit={logs.data.meta.limit}
              onPageChange={(p) => update({ page: p > 1 ? String(p) : undefined })}
            />
          )}
        </div>
      )}

      {selected && (
        <Modal
          open
          title="Audit entry"
          onClose={() => setSelected(null)}
          footer={
            <Button variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
          }
        >
          <dl className="details">
            <div>
              <dt>Action</dt>
              <dd>{humanize(selected.action)}</dd>
            </div>
            <div>
              <dt>Actor</dt>
              <dd>{selected.actorName ?? "Anonymous"}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>{formatClinicTimestamp(selected.createdAt)}</dd>
            </div>
            <div>
              <dt>Request ID</dt>
              <dd>{selected.requestId ?? "-"}</dd>
            </div>
            <div>
              <dt>IP address</dt>
              <dd>{selected.ip ?? "-"}</dd>
            </div>
          </dl>
          <pre className="code">
            {JSON.stringify({ before: selected.before, after: selected.after, metadata: selected.metadata }, null, 2)}
          </pre>
        </Modal>
      )}
    </>
  );
}