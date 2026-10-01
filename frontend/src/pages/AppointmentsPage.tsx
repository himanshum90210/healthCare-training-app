import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarClock, Check, CheckCheck, X } from "lucide-react";
import { toast } from "sonner";
import { useAppSelector } from "../app/hooks";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { DataTable, type Column } from "../components/ui/DataTable";
import { PageHeader } from "../components/ui/PageHeader";
import { Pagination } from "../components/ui/Pagination";
import { Select } from "../components/ui/Select";
import { CancelDialog } from "../features/appointments/CancelDialog";
import { RescheduleDialog } from "../features/appointments/RescheduleDialog";
import {
  useAppointments,
  useCompleteAppointment,
  useConfirmAppointment,
} from "../features/appointments/useAppointments";
import { getApiError } from "../services/apiError";
import type { Appointment, AppointmentStatus } from "../types/appointment";
import type { Role } from "../types/auth";
import { formatClinicDateTime } from "../utils/format";

type Range = "upcoming" | "past" | "all";

const STATUS_TONE: Record<AppointmentStatus, "info" | "success" | "neutral" | "danger"> = {
  SCHEDULED: "info",
  CONFIRMED: "success",
  COMPLETED: "neutral",
  CANCELLED: "danger",
};

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const RANGE_OPTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All" },
];

function AppointmentActions({ appointment, role }: { appointment: Appointment; role: Role }) {
  const [dialog, setDialog] = useState<"cancel" | "reschedule" | null>(null);
  const confirm = useConfirmAppointment();
  const complete = useCompleteAppointment();

  const active = appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED";
  const canReschedule = active && (role === "PATIENT" || role === "RECEPTIONIST" || role === "ADMIN");
  const canConfirm = appointment.status === "SCHEDULED" && role !== "PATIENT";
  const canComplete = appointment.status === "CONFIRMED" && (role === "DOCTOR" || role === "ADMIN");

  if (!active) return <span className="hint">-</span>;

  const onError = (err: unknown) => toast.error(getApiError(err).message);

  return (
    <>
      <div className="row-actions">
        {canConfirm && (
          <Button
            variant="ghost"
            className="btn--sm"
            icon={<Check size={14} />}
            loading={confirm.isPending}
            onClick={() => confirm.mutate(appointment.id, { onSuccess: () => toast.success("Appointment confirmed"), onError })}
          >
            Confirm
          </Button>
        )}
        {canComplete && (
          <Button
            variant="ghost"
            className="btn--sm"
            icon={<CheckCheck size={14} />}
            loading={complete.isPending}
            onClick={() => complete.mutate(appointment.id, { onSuccess: () => toast.success("Marked as completed"), onError })}
          >
            Complete
          </Button>
        )}
        {canReschedule && (
          <Button variant="ghost" className="btn--sm" icon={<CalendarClock size={14} />} onClick={() => setDialog("reschedule")}>
            Reschedule
          </Button>
        )}
        <Button variant="ghost" className="btn--sm" icon={<X size={14} />} onClick={() => setDialog("cancel")}>
          Cancel
        </Button>
      </div>

      {dialog === "cancel" && <CancelDialog appointment={appointment} onClose={() => setDialog(null)} />}
      {dialog === "reschedule" && <RescheduleDialog appointment={appointment} onClose={() => setDialog(null)} />}
    </>
  );
}

const DESCRIPTIONS: Record<Role, string> = {
  PATIENT: "Your upcoming and past visits.",
  DOCTOR: "Your schedule.",
  RECEPTIONIST: "All appointments across the clinic.",
  ADMIN: "All appointments across the clinic.",
};

export default function AppointmentsPage() {
  const user = useAppSelector((s) => s.auth.user);
  const [params, setParams] = useSearchParams();

  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = params.get("status") ?? "";
  const rangeParam = params.get("range");
  const range: Range = rangeParam === "past" || rangeParam === "all" ? rangeParam : "upcoming";

  // "Now" is fixed per range selection, so the query key stays stable between renders
  const bounds = useMemo(() => {
    const now = new Date().toISOString();
    if (range === "upcoming") return { from: now };
    if (range === "past") return { to: now };
    return {};
  }, [range]);

  const appointments = useAppointments({
    page,
    limit: 10,
    status: status || undefined,
    ...bounds,
    order: range === "past" ? "desc" : "asc",
  });

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

  if (!user) return null;

  const columns: Column<Appointment>[] = [
    {
      key: "when",
      header: "When",
      render: (a) => <strong>{formatClinicDateTime(a.startTime)}</strong>,
    },
    {
      key: "doctor",
      header: "Doctor",
      render: (a) => (
        <div>
          <strong>
            Dr. {a.doctor.firstName} {a.doctor.lastName}
          </strong>
          <div className="hint">{a.doctor.specialty}</div>
        </div>
      ),
    },
    ...(user.role === "PATIENT"
      ? []
      : [
          {
            key: "patient",
            header: "Patient",
            render: (a: Appointment) => `${a.patient.firstName} ${a.patient.lastName}`,
          },
        ]),
    { key: "reason", header: "Reason", render: (a) => a.reason || "-" },
    {
      key: "status",
      header: "Status",
      render: (a) => <Badge tone={STATUS_TONE[a.status]}>{a.status.charAt(0) + a.status.slice(1).toLowerCase()}</Badge>,
    },
    { key: "actions", header: "Actions", render: (a) => <AppointmentActions appointment={a} role={user.role} /> },
  ];

  return (
    <>
      <PageHeader title="Appointments" description={DESCRIPTIONS[user.role]} />

      <div className="toolbar">
        <Select
          label="Time range"
          value={range}
          options={RANGE_OPTIONS}
          onChange={(v) => update({ range: v === "upcoming" ? undefined : v, page: undefined })}
        />
        <Select
          label="Filter by status"
          value={status}
          placeholder="All statuses"
          options={STATUS_OPTIONS}
          onChange={(v) => update({ status: v || undefined, page: undefined })}
        />
      </div>

      {appointments.isError ? (
        <Card>
          <div className="alert alert--danger" role="alert">
            {getApiError(appointments.error).message}
          </div>
          <Button variant="secondary" onClick={() => void appointments.refetch()}>
            Try again
          </Button>
        </Card>
      ) : (
        <div className="card">
          <DataTable
            columns={columns}
            rows={appointments.data?.items ?? []}
            getRowId={(a) => a.id}
            loading={appointments.isPending}
            skeletonRows={6}
            emptyTitle="No appointments"
            emptyMessage={user.role === "PATIENT" ? "Book one from the Doctors page." : "Nothing matches these filters."}
          />
          {appointments.data && (
            <Pagination
              page={appointments.data.meta.page}
              totalPages={appointments.data.meta.totalPages}
              total={appointments.data.meta.total}
              limit={appointments.data.meta.limit}
              onPageChange={(p) => update({ page: p > 1 ? String(p) : undefined })}
            />
          )}
        </div>
      )}
    </>
  );
}