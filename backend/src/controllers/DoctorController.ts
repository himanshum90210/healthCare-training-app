import type { Request, Response } from "express";
import { DoctorService } from "../services/DoctorService";
import { UnauthorizedError } from "../errors";
import type { CreateDoctorInput, DoctorListQuery, UpdateDoctorInput } from "../types/doctor";
import type { Role } from "../types/role";
import { Actor } from "../types/appointment";

export class DoctorController {
  constructor(private readonly service: DoctorService) {}

  private role(req: Request): Role {
    if (!req.user) throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
    return req.user.role;
  }

  private actor(req: Request): Actor {
  if (!req.user) throw new UnauthorizedError("Authentication required", "AUTH_REQUIRED");
  return { id: req.user.id, role: req.user.role };
}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = res.locals.query as DoctorListQuery;
    const result = await this.service.list(query, this.role(req));
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

  filterOptions = async (_req: Request, res: Response): Promise<void> => {
    res.status(200).json({ success: true, data: await this.service.getFilterOptions() });
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const doctor = await this.service.getById(req.params.id as string, this.role(req));
    res.status(200).json({ success: true, data: doctor });
  };

  availability = async (req: Request, res: Response): Promise<void> => {
    const { date } = res.locals.query as { date: string };
    const data = await this.service.getAvailability(req.params.id as string, date, this.role(req));
    res.status(200).json({ success: true, data });
  };

  // create = async (req: Request, res: Response): Promise<void> => {
  //   const doctor = await this.service.create(req.body as CreateDoctorInput);
  //   res.status(201).json({ success: true, data: doctor });
  // };

  create = async (req: Request, res: Response): Promise<void> => {
  const doctor = await this.service.create(this.actor(req), req.body as CreateDoctorInput);
  res.status(201).json({ success: true, data: doctor });
};

  // update = async (req: Request, res: Response): Promise<void> => {
  //   const doctor = await this.service.update(req.params.id as string, req.body as UpdateDoctorInput);
  //   res.status(200).json({ success: true, data: doctor });
  // };

  update = async (req: Request, res: Response): Promise<void> => {
  const doctor = await this.service.update(this.actor(req), req.params.id as string, req.body as UpdateDoctorInput);
  res.status(200).json({ success: true, data: doctor });
};
}