import { api } from "../../services/api";
import type { Appointment, AppointmentListParams } from "../../types/appointment";
import type { PageMeta, Paginated } from "../../types/pagination";
import { cleanParams } from "../../utils/params";


type One = { data: Appointment };

export async function fetchAppointments(params: AppointmentListParams): Promise<Paginated<Appointment>> {
    const res = await api.get<{ data: Appointment[]; meta: PageMeta }>("/api/appointments", {
        params: cleanParams(params)
    })
    return { items: res.data.data, meta: res.data.meta };
}

export async function bookAppointment(payload: {
    doctorId: string;
    startTime: string;
    reason?: string;

}): Promise<Appointment> {
    return (await api.post<One>("/api/appointments", payload)).data.data;
}

export async function rescheduleAppointment(vars: { id: string, startTime: string }): Promise<Appointment> {
    return (await api.post<One>(`/api/appointments/${vars.id}/reschedule`, { startTime: vars.startTime })).data.data;
}

export async function cancelAppointment(vars: { id: string; reason?: string }): Promise<Appointment> {
    return (await api.post<One>(`/api/appointments/${vars.id}/camcel`, vars.reason ? { reason: vars.reason } : undefined))
        .data.data
}

export async function confirmAppointment(id: string): Promise<Appointment> {
    return (await api.post<One>(`/api/appointments/${id}/confirm`)).data.data;
}

export async function completeAppointment(id: string): Promise<Appointment> {
    return (await api.post<One>(`/api/appointments/${id}/complete`)).data.data;
}

