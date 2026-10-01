import { isValidObjectId, Types } from "mongoose";
import type { INotificationRepository, NotificationPage } from "../interfaces/INotificationRepository";
import { NotificationModel, type NotificationDocument } from "../../models/notification.model";
import type {
  CreateNotificationRecord,
  Notification,
  NotificationListQuery,
} from "../../types/notification";

const q = (value: Record<string, unknown>): never => value as never;

function toNotification(doc: NotificationDocument): Notification {
  return {
    id: doc.id,
    userId: doc.userId.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    entityType: doc.entityType,
    entityId: doc.entityId,
    data: doc.data ?? {},
    readAt: doc.readAt ?? null,
    createdAt: doc.createdAt,
  };
}

export class MongoNotificationRepository implements INotificationRepository {
  async create(record: CreateNotificationRecord): Promise<Notification> {
    const doc = await NotificationModel.create({ ...record, userId: new Types.ObjectId(record.userId) });
    return toNotification(doc);
  }

  async list(userId: string, query: NotificationListQuery): Promise<NotificationPage> {
    const filter: Record<string, unknown> = { userId };
    if (query.unreadOnly) filter.readAt = null;

    const [docs, total, unread] = await Promise.all([
      NotificationModel.find(q(filter))
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      NotificationModel.countDocuments(q(filter)),
      NotificationModel.countDocuments(q({ userId, readAt: null })),
    ]);

    return { items: docs.map(toNotification), total, page: query.page, limit: query.limit, unread };
  }

  async markRead(userId: string, id: string): Promise<Notification | null> {
    if (!isValidObjectId(id)) return null;

    const updated = await NotificationModel.findOneAndUpdate(
      q({ _id: id, userId, readAt: null }),
      q({ $set: { readAt: new Date() } }),
      { new: true }
    );
    if (updated) return toNotification(updated);

    // Already read (fine) or not theirs (null)
    const existing = await NotificationModel.findOne(q({ _id: id, userId }));
    return existing ? toNotification(existing) : null;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await NotificationModel.updateMany(q({ userId, readAt: null }), q({ $set: { readAt: new Date() } }));
    return result.modifiedCount;
  }
}