import { HydratedDocument, Schema, Types, model } from "mongoose";
import { NOTIFICATION_TYPES, type NotificationType } from "../types/notification";

export interface NotificationDoc {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  entityType: string;
  entityId: string;
  data?: Record<string, unknown> | null;
  readAt?: Date | null;
  createdAt: Date;
}

export type NotificationDocument = HydratedDocument<NotificationDoc>;

const notificationSchema = new Schema<NotificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: [...NOTIFICATION_TYPES], required: true },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 300 },
    entityType: { type: String, required: true },
    entityId: { type: String, required: true },
    data: { type: Schema.Types.Mixed, default: null },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });
// Notifications are transient: MongoDB removes them after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export const NotificationModel = model<NotificationDoc>("Notification", notificationSchema);