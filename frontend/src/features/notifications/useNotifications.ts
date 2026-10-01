import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "./notificationsApi";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "list"] as const,
    queryFn: () => fetchNotifications({ page: 1, limit: 10 }),
    refetchOnWindowFocus: true, // a safety net in case a socket event was missed
  });
}

function useNotificationMutation<TVars>(fn: (vars: TVars) => Promise<void>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export const useMarkNotificationRead = () => useNotificationMutation(markNotificationRead);
export const useMarkAllNotificationsRead = () => useNotificationMutation(markAllNotificationsRead);