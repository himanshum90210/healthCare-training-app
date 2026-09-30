import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { AuthPayload } from "../types/auth";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export const api = axios.create({ baseURL, withCredentials: true });

interface ApiHandlers {
  getAccessToken: () => string | null;
  onTokenRefreshed: (payload: AuthPayload) => void;
  onAuthFailure: () => void;
}

// Injected from app/setupApi.ts so this file never imports the store (avoids a circular import)
let handlers: ApiHandlers | null = null;
export function configureApi(h: ApiHandlers): void {
  handlers = h;
}

// Single-flight refresh: concurrent callers share one request.
// This matters because the server rotates refresh tokens, so two parallel refreshes
// with the same cookie would look like token theft and kill the session.
let refreshPromise: Promise<AuthPayload> | null = null;

export function refreshSession(): Promise<AuthPayload> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ success: boolean; data: AuthPayload }>(`${baseURL}/api/auth/refresh`, null, {
        withCredentials: true,
      })
      .then((res) => res.data.data)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = handlers?.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as RetriableConfig | undefined;

    if (
      original &&
      !original._retry &&
      error.response?.status === 401 &&
      error.response.data?.code === "TOKEN_EXPIRED"
    ) {
      original._retry = true;
      try {
        const payload = await refreshSession();
        handlers?.onTokenRefreshed(payload);
        original.headers.Authorization = `Bearer ${payload.accessToken}`;
        return api(original); // replay the original request
      } catch (refreshError) {
        handlers?.onAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);