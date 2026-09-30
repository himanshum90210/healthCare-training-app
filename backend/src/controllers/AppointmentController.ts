import type { Request, Response } from "express";
import { AppointmentService, type BookAppointmentInput } from "../services/AppointmentService";
import { UnauthorizedError } from "../errors";
import type { Actor, AppointmentListQuery } from "../types/appointment";

export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  private actor(req: Request): Actor {
    if (!req.user) throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    return { id: req.user.id, role: req.user.role };
  }

  book = async (req: Request, res: Response): Promise<void> => {
    const appointment = await this.service.book(this.actor(req), req.body as BookAppointmentInput);
    res.status(201).json({ success: true, data: appointment });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const query = res.locals.query as AppointmentListQuery;
    const result = await this.service.list(this.actor(req), query);
    res.status(200).json({
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const appointment = await this.service.getById(this.actor(req), req.params.id as string);
    res.status(200).json({ success: true, data: appointment });
  };

  reschedule = async (req: Request, res: Response): Promise<void> => {
    const { startTime } = req.body as { startTime: Date };
    const appointment = await this.service.reschedule(this.actor(req), req.params.id as string, startTime);
    res.status(200).json({ success: true, data: appointment });
  };

  cancel = async (req: Request, res: Response): Promise<void> => {
    const { reason } = req.body as { reason?: string };
    const appointment = await this.service.cancel(this.actor(req), req.params.id as string, reason);
    res.status(200).json({ success: true, data: appointment });
  };

  confirm = async (req: Request, res: Response): Promise<void> => {
    const appointment = await this.service.confirm(this.actor(req), req.params.id as string);
    res.status(200).json({ success: true, data: appointment });
  };

  complete = async (req: Request, res: Response): Promise<void> => {
    const appointment = await this.service.complete(this.actor(req), req.params.id as string);
    res.status(200).json({ success: true, data: appointment });
  };
}