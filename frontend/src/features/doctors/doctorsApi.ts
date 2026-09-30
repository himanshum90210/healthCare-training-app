import { api } from "../../services/api";
import type { Availability, Doctor, DoctorFilterOptions, DoctorListParams } from "../../types/doctor";
import type { PageMeta, Paginated } from "../../types/pagination";

const clean = (params: object): Record<string, unknown> =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== undefined));

export async function fetchDoctors(params: DoctorListParams): Promise<Paginated<Doctor>> {
  const res = await api.get<{ data: Doctor[]; meta: PageMeta }>("/api/doctors", { params: clean(params) });
  return { items: res.data.data, meta: res.data.meta };
}

export async function fetchDoctorFilters(): Promise<DoctorFilterOptions> {
  const res = await api.get<{ data: DoctorFilterOptions }>("/api/doctors/filters");
  return res.data.data;
}

export async function fetchDoctor(id: string): Promise<Doctor> {
  const res = await api.get<{ data: Doctor }>(`/api/doctors/${id}`);
  return res.data.data;
}

export async function fetchAvailability(id: string, date: string): Promise<Availability> {
  const res = await api.get<{ data: Availability }>(`/api/doctors/${id}/availability`, { params: { date } });
  return res.data.data;
}