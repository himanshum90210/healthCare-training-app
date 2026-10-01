import { useAvailability } from "../doctors/useDoctors";
import { getApiError } from "../../services/apiError";
import type { BookableSlot } from "../../types/doctor";
import { todayInClinic } from "../../utils/format";

interface Props {
  doctorId: string;
  date: string;
  onDateChange: (date: string) => void;
  selected?: string | null; // startsAt of the selected slot
  onSelect?: (slot: BookableSlot) => void;
}

export function SlotPicker({ doctorId, date, onDateChange, selected, onSelect }: Props) {
  const availability = useAvailability(doctorId, date);

  return (
    <div>
      <div className="date-row">
        <label htmlFor="slot-date" className="field__label">
          Date
        </label>
        <input
          id="slot-date"
          type="date"
          className="select"
          min={todayInClinic()}
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {!date && <p className="hint" style={{ marginTop: 16 }}>Pick a date to see open slots.</p>}
      {availability.isLoading && <p className="hint" style={{ marginTop: 16 }}>Loading slots...</p>}
      {availability.isError && (
        <div className="alert alert--danger" role="alert" style={{ marginTop: 16 }}>
          {getApiError(availability.error).message}
        </div>
      )}

      {availability.data &&
        (availability.data.slots.length === 0 ? (
          <p style={{ marginTop: 16, color: "var(--text-muted)" }}>No open slots on this date.</p>
        ) : (
          <>
            <div className="slots" role="group" aria-label="Available time slots">
              {availability.data.slots.map((slot) =>
                onSelect ? (
                  <button
                    type="button"
                    key={slot.startsAt}
                    className={`slot slot--button${selected === slot.startsAt ? " is-selected" : ""}`}
                    aria-pressed={selected === slot.startsAt}
                    onClick={() => onSelect(slot)}
                  >
                    {slot.start}
                  </button>
                ) : (
                  <span key={slot.startsAt} className="slot">
                    {slot.start}
                  </span>
                )
              )}
            </div>
            <p className="hint" style={{ marginTop: 12 }}>
              Times shown in clinic time ({availability.data.timezone}).
            </p>
          </>
        ))}
    </div>
  );
}