import {keepPreviousData, useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {Appointment, AppointmentListParams} from "../../types/appointment";
import { bookAppointment, cancelAppointment, completeAppointment, confirmAppointment, fetchAppointments, rescheduleAppointment } from "./appointmentsApi";


export const appointmentKeys = {
    list: (params: AppointmentListParams) => ["appointments", "list", params] as const,
}

export function useAppointments(params: AppointmentListParams) {
    return useQuery({
        queryKey: appointmentKeys.list(params),
        queryFn: () => fetchAppointments(params),
        placeholderData: keepPreviousData,
    })
}


function useInvalidatingMutation <TVars>(fn: (vars: TVars) => Promise<Appointment>) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSettled: () => {
            void queryClient.invalidateQueries({queryKey: ["appointments"]});
            void queryClient.invalidateQueries({queryKey: ["doctors", "Availability"]});
        }
    });
}


export const useBookAppointment = () => useInvalidatingMutation(bookAppointment);
export const useRescheduleAppointment = () => useInvalidatingMutation(rescheduleAppointment);
export const useCancelAppointment = () => useInvalidatingMutation(cancelAppointment);
export const useConfirmAppointment = () => useInvalidatingMutation(confirmAppointment);
export const useCompleteAppointment = () => useInvalidatingMutation(completeAppointment);
