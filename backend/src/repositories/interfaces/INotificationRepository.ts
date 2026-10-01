import type {
  CreateNotificationRecord,
  Notification,
  NotificationListQuery,
} from "../../types/notification";
import type { Paginated } from "../../types/pagination";

export type NotificationPage = Paginated<Notification> & { unread: number };

export interface INotificationRepository {
  create(record: CreateNotificationRecord): Promise<Notification>;
  list(userId: string, query: NotificationListQuery): Promise<NotificationPage>;
  /** Scoped to the owner; idempotent. Returns null if it isn't theirs or doesn't exist. */
  markRead(userId: string, id: string): Promise<Notification | null>;
  markAllRead(userId: string): Promise<number>;
}