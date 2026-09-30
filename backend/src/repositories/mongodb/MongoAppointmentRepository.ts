import { isValidObjectId, Types } from "mongoose";
import type {
  IAppointmentRepository,
  OverlapQuery,
  TimeRange,
} from "../interfaces/IAppointmentRepository";
import { AppointmentModel, type AppointmentDocument } from "../../models/appointment.model";
import { DoctorModel } from "../../models/doctor.model";
import { UserModel } from "../../models/user.model";
import { ConflictError } from "../../errors";
import {
  ACTIVE_STATUSES,
  type Appointment,
  type AppointmentListQuery,
  type AppointmentStatus,
  type CreateAppointmentRecord,
} from "../../types/appointment";
import type { Paginated } from "../../types/pagination";

// Filters and updates here mix string ids with ObjectId fields, which Mongoose casts at runtime.
// The type escape is confined to this file and only ever receives server-built objects.
const q = (value: Record<string, unknown>): never => value as never;

const activeStatuses = (): AppointmentStatus[] => [...ACTIVE_STATUSES];

/** A duplicate-key error on the unique slot index means someone else just took the slot */
function translateDuplicate(err: unknown): never {
  if (typeof err === "object" && err !== null && (err as { code?: unknown }).code === 11000) {
    throw new ConflictError("Appointment slot is no longer available", "APPOINTMENT_CONFLICT");
  }
  throw err;
}

const uniqueIds = (ids: Types.ObjectId[]): Types.ObjectId[] => [
  ...new Map(ids.map((id): [string, Types.ObjectId] => [id.toString(), id])).values(),
];

/** Attach doctor and patient display info with two batched queries (no N+1) */
async function hydrate(docs: AppointmentDocument[]): Promise<Appointment[]> {
  if (docs.length === 0) return [];

  const [doctors, patients] = await Promise.all([
    DoctorModel.find(q({ _id: { $in: uniqueIds(docs.map((d) => d.doctorId)) } })).select(
      "firstName lastName specialty department"
    ),
    UserModel.find(q({ _id: { $in: uniqueIds(docs.map((d) => d.patientId)) } })).select("firstName lastName"),
  ]);

  const doctorById = new Map(doctors.map((d): [string, typeof d] => [String(d.id), d]));
  const patientById = new Map(patients.map((p): [string, typeof p] => [String(p.id), p]));

  return docs.map((doc) => {
    const doctorId = doc.doctorId.toString();
    const patientId = doc.patientId.toString();
    const d = doctorById.get(doctorId);
    const p = patientById.get(patientId);

    return {
      id: doc.id,
      doctorId,
      patientId,
      doctor: {
        id: doctorId,
        firstName: d?.firstName ?? "Unknown",
        lastName: d?.lastName ?? "",
        specialty: d?.specialty ?? "",
        department: d?.department ?? "",
      },
      patient: { id: patientId, firstName: p?.firstName ?? "Unknown", lastName: p?.lastName ?? "" },
      startTime: doc.startTime,
      endTime: doc.endTime,
      status: doc.status,
      reason: doc.reason,
      bookedById: doc.bookedById.toString(),
      cancelledById: doc.cancelledById ? doc.cancelledById.toString() : null,
      cancelReason: doc.cancelReason ?? null,
      cancelledAt: doc.cancelledAt ?? null,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  });
}

export class MongoAppointmentRepository implements IAppointmentRepository {
  private async one(doc: AppointmentDocument): Promise<Appointment> {
    return (await hydrate([doc]))[0];
  }

  async create(record: CreateAppointmentRecord): Promise<Appointment> {
    try {
      const doc = await AppointmentModel.create({
        doctorId: new Types.ObjectId(record.doctorId),
        patientId: new Types.ObjectId(record.patientId),
        startTime: record.startTime,
        endTime: record.endTime,
        reason: record.reason,
        bookedById: new Types.ObjectId(record.bookedById),
      });
      return this.one(doc);
    } catch (err) {
      return translateDuplicate(err);
    }
  }

  async findById(id: string): Promise<Appointment | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await AppointmentModel.findById(id);
    return doc ? this.one(doc) : null;
  }

  async list(query: AppointmentListQuery): Promise<Paginated<Appointment>> {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.doctorId) filter.doctorId = query.doctorId;
    if (query.patientId) filter.patientId = query.patientId;
    if (query.from || query.to) {
      filter.startTime = {
        ...(query.from ? { $gte: query.from } : {}),
        ...(query.to ? { $lt: query.to } : {}),
      };
    }

    const direction = query.order === "asc" ? 1 : -1;
    const [docs, total] = await Promise.all([
      AppointmentModel.find(q(filter))
        .sort({ startTime: direction, _id: 1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      AppointmentModel.countDocuments(q(filter)),
    ]);

    return { items: await hydrate(docs), total, page: query.page, limit: query.limit };
  }

  async findActiveForDoctorBetween(doctorId: string, from: Date, to: Date): Promise<TimeRange[]> {
    const docs = await AppointmentModel.find(
      q({ doctorId, status: { $in: activeStatuses() }, startTime: { $lt: to }, endTime: { $gt: from } })
    ).select("startTime endTime");
    return docs.map((d) => ({ startTime: d.startTime, endTime: d.endTime }));
  }

  async hasActiveOverlap(query: OverlapQuery): Promise<boolean> {
    const filter: Record<string, unknown> = {
      status: { $in: activeStatuses() },
      startTime: { $lt: query.end },
      endTime: { $gt: query.start },
    };
    if (query.doctorId) filter.doctorId = query.doctorId;
    if (query.patientId) filter.patientId = query.patientId;
    if (query.excludeId) filter._id = { $ne: query.excludeId };
    return (await AppointmentModel.exists(q(filter))) !== null;
  }

  async reschedule(id: string, range: TimeRange): Promise<Appointment | null> {
    if (!isValidObjectId(id)) return null;
    try {
      const doc = await AppointmentModel.findOneAndUpdate(
        q({ _id: id, status: { $in: activeStatuses() } }),
        q({ $set: { startTime: range.startTime, endTime: range.endTime, status: "SCHEDULED" } }),
        { new: true }
      );
      return doc ? await this.one(doc) : null;
    } catch (err) {
      return translateDuplicate(err);
    }
  }

  async cancel(
    id: string,
    details: { cancelledById: string; reason: string | null; at: Date }
  ): Promise<Appointment | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await AppointmentModel.findOneAndUpdate(
      q({ _id: id, status: { $in: activeStatuses() } }),
      q({
        $set: {
          status: "CANCELLED",
          cancelledById: details.cancelledById,
          cancelReason: details.reason,
          cancelledAt: details.at,
        },
      }),
      { new: true }
    );
    return doc ? this.one(doc) : null;
  }

  async transition(id: string, from: AppointmentStatus[], to: AppointmentStatus): Promise<Appointment | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await AppointmentModel.findOneAndUpdate(
      q({ _id: id, status: { $in: from } }),
      q({ $set: { status: to } }),
      { new: true }
    );
    return doc ? this.one(doc) : null;
  }
}