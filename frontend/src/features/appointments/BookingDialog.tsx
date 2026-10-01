import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { getApiError } from "../../services/apiError";
import type { BookableSlot, Doctor } from "../../types/doctor";
import { formatClinicDateTime } from "../../utils/format";
import { useBookAppointment } from "./useAppointments";

interface Props {
    doctor: Doctor;
    slot: BookableSlot;
    onClose: () => void;
}

export function BookingDialog({ doctor, slot, onClose }: Props) {
    const navigate = useNavigate();
    const book = useBookAppointment();
    const [reason, setReason] = useState("");

    const submit = () => book.mutate(
        { doctorId: doctor.id, startTime: slot.startsAt, reason: reason.trim() || undefined },
        {
            onSuccess: () => {
                toast.success("Appointment booked");
                onClose();
                navigate("/appointments")
            },
            onError: (err) => {
                const { message, code } = getApiError(err);
                toast.error(message);
                if (code === "APPOINTMENT_CONFLICT") onClose();
            }
        }
    );

    return (
        <Modal
            open
            title="Confirm appointment"
            onClose={onClose}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button loading={book.isPending} onClick={submit}>
                        Book appointment
                    </Button>
                </>
            }
        >
            <dl className="details">
                <div>
                    <dt>Doctor</dt>
                    <dd>
                        Dr. {doctor.firstName} {doctor.lastName}
                    </dd>
                </div>
                <div>
                    <dt>Specialty</dt>
                    <dd>{doctor.specialty}</dd>
                </div>
                <div>
                    <dt>When</dt>
                    <dd>{formatClinicDateTime(slot.startsAt)}</dd>
                </div>
                <div>
                    <dt>Duration</dt>
                    <dd>{doctor.slotDurationMinutes} min</dd>
                </div>
            </dl>

            <div>
                <label htmlFor="reason" className="field__label">
                    Reason for visit (optional)
                </label>
                <div className="field__control" style={{ marginTop: 6 }}>
                    <textarea
                        id="reason"
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


