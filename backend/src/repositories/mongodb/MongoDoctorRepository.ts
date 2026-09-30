import { isValidObjectId, Types } from "mongoose";
import type { IDoctorRepository } from "../interfaces/IDoctorRepository";
import { DoctorModel, type DoctorDocument } from "../../models/doctor.model";
import type {
  CreateDoctorInput,
  Doctor,
  DoctorFilterOptions,
  DoctorListQuery,
  UpdateDoctorInput,
} from "../../types/doctor";
import type { Paginated } from "../../types/pagination";

// type MongoFilter = NonNullable<Parameters<typeof DoctorModel.countDocuments>[0]>;

const escapeRegex = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function toDoctor(doc: DoctorDocument): Doctor {
  return {
    id: doc.id,
    userId: doc.userId ? doc.userId.toString() : null,
    firstName: doc.firstName,
    lastName: doc.lastName,
    specialty: doc.specialty,
    department: doc.department,
    yearsOfExperience: doc.yearsOfExperience,
    bio: doc.bio,
    slotDurationMinutes: doc.slotDurationMinutes,
    weeklySchedule: doc.weeklySchedule.map((b) => ({
      dayOfWeek: b.dayOfWeek,
      startTime: b.startTime,
      endTime: b.endTime,
    })),
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class MongoDoctorRepository implements IDoctorRepository {
  async findById(id: string): Promise<Doctor | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await DoctorModel.findById(id);
    return doc ? toDoctor(doc) : null;
  }

  async list(query: DoctorListQuery): Promise<Paginated<Doctor>> {
    const filter: Record<string, unknown> = {};
    if (!query.includeInactive) filter.isActive = true;
    if (query.specialty) filter.specialty = query.specialty;
    if (query.department) filter.department = query.department;

    if (query.search) {
      // Every word must match at least one field, so "dev doc" finds "Dev Doctor"
      const tokens = query.search.split(/\s+/).filter(Boolean).slice(0, 5);
      filter.$and = tokens.map((token) => {
        const rx = new RegExp(escapeRegex(token), "i");
        return { $or: [{ firstName: rx }, { lastName: rx }, { specialty: rx }, { department: rx }] };
      });
    }

    // const mongoFilter = filter as MongoFilter;
    const mongoFilter = filter as unknown as Parameters<typeof DoctorModel.find>[0];
    const direction = query.order === "asc" ? 1 : -1;

    const [docs, total] = await Promise.all([
      DoctorModel.find(mongoFilter)
        .sort({ [query.sort]: direction, _id: 1 }) // _id keeps pagination stable
        .skip((query.page - 1) * query.limit)
        .limit(query.limit),
      DoctorModel.countDocuments(mongoFilter),
    ]);

    return { items: docs.map(toDoctor), total, page: query.page, limit: query.limit };
  }

  async create(input: CreateDoctorInput): Promise<Doctor> {
    const doc = await DoctorModel.create(input);
    return toDoctor(doc);
  }

  async update(id: string, patch: UpdateDoctorInput): Promise<Doctor | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await DoctorModel.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true });
    return doc ? toDoctor(doc) : null;
  }

  async getFilterOptions(): Promise<DoctorFilterOptions> {
    const [specialties, departments] = await Promise.all([
      DoctorModel.distinct("specialty", { isActive: true }),
      DoctorModel.distinct("department", { isActive: true }),
    ]);
    const sorted = (values: unknown[]): string[] => values.map(String).sort((a, b) => a.localeCompare(b));
    return { specialties: sorted(specialties), departments: sorted(departments) };
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    if (!isValidObjectId(userId)) return null;
    const doc = await DoctorModel.findOne({ userId: new Types.ObjectId(userId) });
    return doc ? toDoctor(doc) : null;
  }
}