import { api } from "../../services/api";
import type { NotificationItem, NotificationMeta } from "../../types/notification";

export async function fetchNotifications(params: {
  page: number;
  limit: number;
}): Promise<{ items: NotificationItem[]; meta: NotificationMeta }> {
  const res = await api.get<{ data: NotificationItem[]; meta: NotificationMeta }>("/api/notifications", { params });
  return { items: res.data.data, meta: res.data.meta };
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post("/api/notifications/read-all");
}