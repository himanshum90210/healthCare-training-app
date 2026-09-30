import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../services/api";

export interface HealthResponse {
  success: boolean;
  message: string;
  timestamp: string;
  database: "up" | "down";
}

async function fetchHealth(): Promise<HealthResponse> {
  try {
    const res = await api.get<HealthResponse>("/health");
    return res.data;
  } catch (err) {
    // The backend returns 503 *with* a body when the DB is down; that's data, not a failure
    if (axios.isAxiosError<HealthResponse>(err) && err.response?.data?.database) {
      return err.response.data;
    }
    throw err;
  }
}

export function useHealth() {
  return useQuery({ queryKey: ["health"], queryFn: fetchHealth, refetchInterval: 30_000 });
}