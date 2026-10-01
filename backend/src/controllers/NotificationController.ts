import type { Request, Response } from "express";
import { UnauthorizedError } from "../errors";
import { NotificationService } from "../services/NotificationService";
import type { NotificationListQuery } from "../types/notification";

export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  // Everything is scoped to the signed-in user; no user id is ever taken from the request
  private userId(req: Request): string {
    if (!req.user) throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    return req.user.id;
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const query = res.locals.query as NotificationListQuery;
    const result = await this.service.list(this.userId(req), query);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
        unread: result.unread,
      },
    });
  };

  markRead = async (req: Request, res: Response): Promise<void> => {
    const notification = await this.service.markRead(this.userId(req), req.params.id as string);
    res.status(200).json({ success: true, data: notification });
  };

  markAllRead = async (req: Request, res: Response): Promise<void> => {
    const updated = await this.service.markAllRead(this.userId(req));
    res.status(200).json({ success: true, data: { updated } });
  };
}