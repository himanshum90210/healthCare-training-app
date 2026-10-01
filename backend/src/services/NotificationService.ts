import { Config } from "../config/config";
import { NotFoundError } from "../errors";
import type { IRealtimePublisher } from "../realtime/IRealtimePublisher";
import type { IDoctorRepository } from "../repositories/interfaces/IDoctorRepository";
import type {
  INotificationRepository,
  NotificationPage,
} from "../repositories/interfaces/INotificationRepository";
import type { Actor, Appointment } from "../types/appointment";
import type {
  AppointmentEvent,
  Notification,
  NotificationListQuery,
  NotificationType,
} from "../types/notification";
import { formatClinicDateTime } from "../utils/clinicTime";

type Audience = "patient" | "doctor";

function compose(
  event: AppointmentEvent,
  audience: Audience,
  a: Appointment,
  when: string
): { title: string; message: string } {
  const doctor = `Dr. ${a.doctor.firstName} ${a.doctor.lastName}`;
  const patient = `${a.patient.firstName} ${a.patient.lastName}`;
  const forPatient = audience === "patient";

  switch (event) {
    case "created":
      return forPatient
        ? { title: "Appointment booked", message: `Your appointment with ${doctor} is booked for ${when}.` }
        : { title: "New appointment", message: `${patient} booked an appointment for ${when}.` };
    case "confirmed":
      return forPatient
        ? { title: "Appointment confirmed", message: `${doctor} confirmed your appointment on ${when}.` }
        : { title: "Appointment confirmed", message: `The appointment with ${patient} on ${when} was confirmed.` };
    case "rescheduled":
      return forPatient
        ? { title: "Appointment rescheduled", message: `Your appointment with ${doctor} moved to ${when}.` }
        : { title: "Appointment rescheduled", message: `${patient} moved their appointment to ${when}.` };
    case "cancelled":
      return forPatient
        ? { title: "Appointment cancelled", message: `Your appointment with ${doctor} on ${when} was cancelled.` }
        : { title: "Appointment cancelled", message: `The appointment with ${patient} on ${when} was cancelled.` };
    case "completed":
      return forPatient
        ? { title: "Visit completed", message: `Your visit with ${doctor} on ${when} is marked as completed.` }
        : { title: "Visit completed", message: `The appointment with ${patient} on ${when} was marked as completed.` };
  }
}

export class NotificationService {
  constructor(
    private readonly notifications: INotificationRepository,
    private readonly doctors: IDoctorRepository,
    private readonly publisher: IRealtimePublisher
  ) {}

  /** Best-effort: a notification problem must never fail the appointment action */
  async appointmentEvent(event: AppointmentEvent, appointment: Appointment, actor: Actor): Promise<void> {
    try {
      const doctor = await this.doctors.findById(appointment.doctorId);
      const when = formatClinicDateTime(appointment.startTime, Config.getInstance().clinicTimezone);

      const recipients: { userId: string; audience: Audience }[] = [];
      if (appointment.patientId !== actor.id) recipients.push({ userId: appointment.patientId, audience: "patient" });
      if (doctor?.userId && doctor.userId !== actor.id) recipients.push({ userId: doctor.userId, audience: "doctor" });

      const type = `appointment.${event}` as NotificationType;

      for (const { userId, audience } of recipients) {
        const { title, message } = compose(event, audience, appointment, when);
        const saved = await this.notifications.create({
          userId,
          type,
          title,
          message,
          entityType: "APPOINTMENT",
          entityId: appointment.id,
          data: { appointmentId: appointment.id, doctorId: appointment.doctorId, patientId: appointment.patientId },
        });
        this.publisher.emitToUser(userId, type, saved);
      }
    } catch (err) {
      console.error("NOTIFICATION FAILED", { event, appointmentId: appointment.id, err });
    }
  }

  list(userId: string, query: NotificationListQuery): Promise<NotificationPage> {
    return this.notifications.list(userId, query);
  }

  async markRead(userId: string, id: string): Promise<Notification> {
    const notification = await this.notifications.markRead(userId, id);
    if (!notification) throw new NotFoundError("Notification not found", "NOTIFICATION_NOT_FOUND");
    return notification;
  }

  markAllRead(userId: string): Promise<number> {
    return this.notifications.markAllRead(userId);
  }
}