import { Types } from "mongoose";
import type { IAuditRepository } from "../interfaces/IAuditRepository";
import { AuditLogModel } from "../../models/auditLog.model";
import { UserModel } from "../../models/user.model";
import type { AuditListQuery, AuditLog, CreateAuditRecord } from "../../types/audit";
import type { Paginated } from "../../types/pagination";

const q = (value: Record<string, unknown>): never => value as never;

export class MongoAuditRepository implements IAuditRepository {
  async create(record: CreateAuditRecord): Promise<void> {
    await AuditLogModel.create({
      ...record,
      actorId: record.actorId ? new Types.ObjectId(record.actorId) : null,
    });
  }

  async list(query: AuditListQuery): Promise<Paginated<AuditLog>> {
    const filter: Record<string, unknown> = {};
    if (query.action) filter.action = query.action;
    if (query.entityType) filter.entityType = query.entityType;
    if (query.entityId) filter.entityId = query.entityId;
    if (query.actorId) filter.actorId = query.actorId;
    if (query.from || query.to) {
      filter.createdAt = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lt: query.to } : {}),
      };
    }

    const [docs, total] = await Promise.all([
      AuditLogModel.find(q(filter))
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      AuditLogModel.countDocuments(q(filter)),
    ]);

    // Resolve actor names in one batched query
    const actorIds = [...new Set(docs.flatMap((d) => (d.actorId ? [d.actorId.toString()] : [])))];
    const actors = actorIds.length
      ? await UserModel.find(q({ _id: { $in: actorIds.map((id) => new Types.ObjectId(id)) } })).select("firstName lastName")
      : [];
    const nameById = new Map(actors.map((a): [string, string] => [String(a.id), `${a.firstName} ${a.lastName}`]));

    const items: AuditLog[] = docs.map((d) => ({
      id: d.id,
      actorId: d.actorId ? d.actorId.toString() : null,
      actorRole: d.actorRole ?? null,
      actorName: d.actorId ? (nameById.get(d.actorId.toString()) ?? "Deleted user") : null,
      action: d.action,
      entityType: d.entityType,
      entityId: d.entityId ?? null,
      summary: d.summary,
      before: d.before ?? null,
      after: d.after ?? null,
      metadata: d.metadata ?? null,
      requestId: d.requestId ?? null,
      ip: d.ip ?? null,
      userAgent: d.userAgent ?? null,
      createdAt: d.createdAt,
    }));

    return { items, total, page: query.page, limit: query.limit };
  }
}