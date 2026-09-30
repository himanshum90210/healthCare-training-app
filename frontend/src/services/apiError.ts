import axios from "axios";

export interface ApiErrorInfo {
  message: string;
  code?: string;
  details?: { field?: string; message: string }[];
}

interface ApiErrorBody {
  message?: string;
  code?: string;
  details?: { field?: string; message: string }[];
}

export function getApiError(err: unknown): ApiErrorInfo {
  if (axios.isAxiosError<ApiErrorBody>(err)) {
    const body = err.response?.data;
    if (body?.message) {
      return { message: body.message, code: body.code, details: body.details };
    }
    return { message: "Cannot reach the server", code: "NETWORK_ERROR" };
  }
  return { message: "Unexpected error" };
}