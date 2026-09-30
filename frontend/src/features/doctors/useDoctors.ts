import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { DoctorListParams } from "../../types/doctor";
import { fetchAvailability, fetchDoctor, fetchDoctorFilters, fetchDoctors } from "./doctorsApi";

export const doctorKeys = {
  list: (params: DoctorListParams) => ["doctors", "list", params] as const,
  filters: ["doctors", "filters"] as const,
  detail: (id: string) => ["doctors", "detail", id] as const,
  availability: (id: string, date: string) => ["doctors", "availability", id, date] as const,
};

export function useDoctors(params: DoctorListParams) {
  return useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () => fetchDoctors(params),
    placeholderData: keepPreviousData, // no flicker while paging or filtering
  });
}

export function useDoctorFilters() {
  return useQuery({ queryKey: doctorKeys.filters, queryFn: fetchDoctorFilters, staleTime: 5 * 60_000 });
}

export function useDoctor(id: string | undefined) {
  return useQuery({
    queryKey: doctorKeys.detail(id ?? ""),
    queryFn: () => fetchDoctor(id as string),
    enabled: !!id,
  });
}

export function useAvailability(id: string | undefined, date: string) {
  return useQuery({
    queryKey: doctorKeys.availability(id ?? "", date),
    queryFn: () => fetchAvailability(id as string, date),
    enabled: !!id && !!date,
  });
}