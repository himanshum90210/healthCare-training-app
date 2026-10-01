import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { getApiError } from "../../services/apiError";
import type { Appointment } from "../../types/appointment";
import type { BookableSlot } from "../../types/doctor";
import { clinicDateOf, formatClinicDateTime, todayInClinic } from "../../utils/format";
import { SlotPicker } from "./SlotPicker";
import { useRescheduleAppointment } from "./useAppointments";

interface Props {
  appointment: Appointment;
  onClose: () => void;
}

export function RescheduleDialog({ appointment, onClose }: Props) {
  const reschedule = useRescheduleAppointment();
  const current = clinicDateOf(appointment.startTime);
  const [date, setDate] = useState(current < todayInClinic() ? todayInClinic() : current);
  const [slot, setSlot] = useState<BookableSlot | null>(null);

  const submit = () => {
    if (!slot) return;
    reschedule.mutate(
      { id: appointment.id, startTime: slot.startsAt },
      {
        onSuccess: () => {
          toast.success("Appointment rescheduled");
          onClose();
        },
        onError: (err) => toast.error(getApiError(err).message),
      }
    );
  };

  return (
    <Modal
      open
      title="Reschedule appointment"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button disabled={!slot} loading={reschedule.isPending} onClick={submit}>
            Confirm new time
          </Button>
        </>
      }
    >
      <p className="hint">
        Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}, currently{" "}
        {formatClinicDateTime(appointment.startTime)}
      </p>
      <SlotPicker
        doctorId={appointment.doctorId}
        date={date}
        onDateChange={(d) => {
          setDate(d);
          setSlot(null);
        }}
        selected={slot?.startsAt ?? null}
        onSelect={setSlot}
      />
    </Modal>
  );
}