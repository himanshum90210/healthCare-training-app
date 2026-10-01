import type { Request, Response } from "express";
import { AuditService } from "../services/AuditService";
import type { AuditListQuery } from "../types/audit";

export class AuditController {
  constructor(private readonly service: AuditService) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const query = res.locals.query as AuditListQuery;
    const result = await this.service.list(query);
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
}