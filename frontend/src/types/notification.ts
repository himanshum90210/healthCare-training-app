import type { PageMeta } from "./pagination";

export const NOTIFICATION_TYPES = [
  "appointment.created",
  "appointment.confirmed",
  "appointment.rescheduled",
  "appointment.cancelled",
  "appointment.completed",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export type NotificationMeta = PageMeta & { unread: number };