import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PageHeader } from "../components/ui/PageHeader";
import { Loader } from "../components/Loader";
import { useAvailability, useDoctor } from "../features/doctors/useDoctors";
import { getApiError } from "../services/apiError";
import type { ScheduleBlock } from "../types/doctor";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Local calendar date as YYYY-MM-DD
const todayLocal = (): string => new Date().toLocaleDateString("sv-SE");

function blocksForDay(blocks: ScheduleBlock[], day: number): string {
  const hours = blocks
    .filter((b) => b.dayOfWeek === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map((b) => `${b.startTime} - ${b.endTime}`);
  return hours.length ? hours.join(", ") : "Not available";
}

// First upcoming date (within 14 days) on which the doctor works
function nextWorkingDate(blocks: ScheduleBlock[]): string | null {
  const workDays = new Set(blocks.map((b) => b.dayOfWeek));
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    if (workDays.has(d.getDay())) return d.toLocaleDateString("sv-SE");
  }
  return null;
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  // const [date, setDate] = useState(todayLocal);const [pickedDate, setPickedDate] = useState<string | null>(null);
  const doctor = useDoctor(id);
  // const availability = useAvailability(id, date);
  const date = pickedDate ?? (doctor.data ? nextWorkingDate(doctor.data.weeklySchedule) : null) ?? todayLocal();
  const availability = useAvailability(doctor.isSuccess ? id : undefined, date);

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

        <Card title="Availability">
          <div className="date-row">
            <label htmlFor="avail-date" className="field__label">
              Date
            </label>
            <input
              id="avail-date"
              type="date"
              className="select"
              value={date}
              onChange={(e) => setPickedDate(e.target.value)}
            />
          </div>

          {availability.isPending && <p style={{ marginTop: 16 }}>Loading slots...</p>}
          {availability.isError && (
            <div className="alert alert--danger" role="alert" style={{ marginTop: 16 }}>
              {getApiError(availability.error).message}
            </div>
          )}
          {availability.data &&
            (availability.data.slots.length === 0 ? (
              <p style={{ marginTop: 16, color: "var(--text-muted)" }}>No slots on this date.</p>
            ) : (
              <div className="slots" aria-label="Available time slots">
                {availability.data.slots.map((slot) => (
                  <span key={slot.start} className="slot">
                    {slot.start}
                  </span>
                ))}
              </div>
            ))}
        </Card>
      </div>
    </>
  );
}