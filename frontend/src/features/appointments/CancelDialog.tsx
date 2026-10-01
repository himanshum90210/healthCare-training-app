import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { getApiError } from "../../services/apiError";
import type { Appointment } from "../../types/appointment";
import { formatClinicDateTime } from "../../utils/format";
import { useCancelAppointment } from "./useAppointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
}

export function CancelDialog({ appointment, onClose }: Props) {
  const cancel = useCancelAppointment();
  const [reason, setReason] = useState("");

  const submit = () =>
    cancel.mutate(
      { id: appointment.id, reason: reason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled");
          onClose();
        },
        onError: (err) => toast.error(getApiError(err).message),
      }
    );

  return (
    <Modal
      open
      title="Cancel appointment"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Keep appointment
          </Button>
          <Button variant="danger" loading={cancel.isPending} onClick={submit}>
            Cancel appointment
          </Button>
        </>
      }
    >
      <p>
        Cancel the appointment with Dr. {appointment.doctor.lastName} on{" "}
        <strong>{formatClinicDateTime(appointment.startTime)}</strong>? The slot becomes available to others.
      </p>
      <div>
        <label htmlFor="cancel-reason" className="field__label">
          Reason (optional)
        </label>
        <div className="field__control" style={{ marginTop: 6 }}>
          <textarea
            id="cancel-reason"
            className="textarea"
            maxLength={300}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}