import { useEffect } from "react";
import axios from "axios";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "react-redux";
import { useNavigate } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";
import type { RootState } from "../../app/store";
import { baseURL, refreshSession } from "../../services/api";
import { NOTIFICATION_TYPES, type NotificationItem } from "../../types/notification";
import { clearSession, setCredentials } from "../auth/authSlice";

export function RealtimeProvider() {
  const store = useStore<RootState>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    // The auth callback runs on every (re)connection, so it always sends the current token
    const socket: Socket = io(baseURL, {
      autoConnect: false,
      auth: (cb) => cb({ token: store.getState().auth.accessToken }),
    });

    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const reconnectWithFreshToken = async (): Promise<void> => {
      try {
        store.dispatch(setCredentials(await refreshSession()));
        socket.connect();
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          store.dispatch(clearSession()); // the session is really gone
        } else {
          retryTimer = setTimeout(() => void reconnectWithFreshToken(), 3000); // server unreachable: try again
        }
      }
    };

    socket.on("connect_error", (err: Error & { data?: { code?: string } }) => {
      if (err.data?.code === "TOKEN_EXPIRED") void reconnectWithFreshToken();
    });

    // The server drops the socket when the access token expires
    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") void reconnectWithFreshToken();
    });

    const onNotification = (n: NotificationItem) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["doctors", "availability"] });
      toast(n.title, {
        description: n.message,
        action: { label: "View", onClick: () => navigate("/appointments") },
      });
    };
    NOTIFICATION_TYPES.forEach((type) => socket.on(type, onNotification));

    socket.connect();

    return () => {
      clearTimeout(retryTimer);
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [store, queryClient, navigate]);

  return null;
}