import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAppSelector } from "../app/hooks";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Loader } from "../components/Loader";
import { BookingDialog } from "../features/appointments/BookingDialog";
import { SlotPicker } from "../features/appointments/SlotPicker";
import { useDoctor } from "../features/doctors/useDoctors";
import { getApiError } from "../services/apiError";
import type { BookableSlot, ScheduleBlock } from "../types/doctor";
import { todayInClinic } from "../utils/format";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function nextWorkingDate(blocks: ScheduleBlock[]): string | null {
  const workDays = new Set(blocks.map((b) => b.dayOfWeek));
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (workDays.has(d.getDay())) return d.toLocaleDateString("sv-SE");
  }
  return null;
}

function blocksForDay(blocks: ScheduleBlock[], day: number): string {
  const hours = blocks
    .filter((b) => b.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((b) => `${b.startTime} - ${b.endTime}`);
  return hours.length ? hours.join(", ") : "Not available";
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const user = useAppSelector((s) => s.auth.user);
  const doctor = useDoctor(id);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<BookableSlot | null>(null);

  if (doctor.isPending) return <Loader />;

  if (doctor.isError) {
    return (
      <>
        <Link to="/doctors" className="back-link">
          <ArrowLeft size={16} /> Back to doctors
        </Link>
        <div className="alert alert--danger" role="alert">
          {getApiError(doctor.error).message}
        </div>
      </>
    );
  }

  const d = doctor.data;
  const date = pickedDate ?? nextWorkingDate(d.weeklySchedule) ?? todayInClinic();
  const canBook = user?.role === "PATIENT";

  return (
    <>
      <Link to="/doctors" className="back-link">
        <ArrowLeft size={16} /> Back to doctors
      </Link>

      <PageHeader
        title={`Dr. ${d.firstName} ${d.lastName}`}
        description={`${d.specialty} · ${d.department}`}
        actions={<Badge tone={d.isActive ? "success" : "warning"}>{d.isActive ? "Active" : "Inactive"}</Badge>}
      />

      <div className="grid grid--detail">
        <Card title="Profile">
          <dl className="details">
            <div>
              <dt>Specialty</dt>
              <dd>{d.specialty}</dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{d.department}</dd>
            </div>
            <div>
              <dt>Experience</dt>
              <dd>{d.yearsOfExperience} years</dd>
            </div>
            <div>
              <dt>Appointment length</dt>
              <dd>{d.slotDurationMinutes} min</dd>
            </div>
          </dl>
          {d.bio && <p style={{ marginTop: 16, color: "var(--text-muted)" }}>{d.bio}</p>}

          <h3 style={{ margin: "24px 0 12px", fontSize: 14 }}>Weekly schedule</h3>
          <ul className="schedule">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const text = blocksForDay(d.weeklySchedule, day);
              return (
                <li key={day} className={text === "Not available" ? "is-off" : undefined}>
                  <span>{DAYS[day]}</span>
                  <span>{text}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title={canBook ? "Book an appointment" : "Availability"}>
          <SlotPicker
            doctorId={d.id}
            date={date}
            onDateChange={(next) => {
              setPickedDate(next);
              setSlot(null);
            }}
            selected={slot?.startsAt ?? null}
            onSelect={canBook ? setSlot : undefined}
          />
          {!canBook && (
            <p className="hint" style={{ marginTop: 16 }}>
              Patients book from this page. Booking on behalf of a patient arrives with the Patients module.
            </p>
          )}
        </Card>
      </div>

      {canBook && slot && <BookingDialog doctor={d} slot={slot} onClose={() => setSlot(null)} />}
    </>
  );
}