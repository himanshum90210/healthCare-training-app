import type { CreateDoctorInput, Doctor, DoctorFilterOptions, DoctorListQuery, UpdateDoctorInput } from "../../types/doctor";
import type { Paginated } from "../../types/pagination";

export interface IDoctorRepository {
  findById(id: string): Promise<Doctor | null>;
  list(query: DoctorListQuery): Promise<Paginated<Doctor>>;
  create(input: CreateDoctorInput): Promise<Doctor>;
  update(id: string, patch: UpdateDoctorInput): Promise<Doctor | null>;
  getFilterOptions(): Promise<DoctorFilterOptions>;
  findByUserId(userId: string): Promise<Doctor | null>;
}