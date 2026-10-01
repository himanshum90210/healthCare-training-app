export const NOTIFICATION_TYPES = [
  "appointment.created",
  "appointment.confirmed",
  "appointment.rescheduled",
  "appointment.cancelled",
  "appointment.completed",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export type CreateNotificationRecord = Omit<Notification, "id" | "readAt" | "createdAt">;

export interface NotificationListQuery {
  page: number;
  limit: number;
  unreadOnly: boolean;
}

export type AppointmentEvent = "created" | "confirmed" | "rescheduled" | "cancelled" | "completed";