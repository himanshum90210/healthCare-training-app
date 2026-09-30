import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api, refreshSession } from "../../services/api";
import { getApiError } from "../../services/apiError";
import type { AuthPayload, User } from "../../types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  initialized: boolean; // true once the startup session check has finished
  status: "idle" | "loading";
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  initialized: false,
  status: "idle",
  error: null,
};

export interface LoginCredentials {
  email: string;
  password: string;
}

export const login = createAsyncThunk<AuthPayload, LoginCredentials, { rejectValue: string }>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const res = await api.post<{ data: AuthPayload }>("/api/auth/login", credentials);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(getApiError(err).message);
    }
  }
);

// Runs once at startup: uses the HttpOnly cookie to get a fresh access token
export const restoreSession = createAsyncThunk<AuthPayload | null>("auth/restore", async () => {
  try {
    return await refreshSession();
  } catch {
    return null; // no valid session; the user just sees the login page
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await api.post("/api/auth/logout");
  } catch {
    // clear the local session regardless
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthPayload>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    clearSession(state) {
      state.user = null;
      state.accessToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "idle";
        state.initialized = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "idle";
        state.error = action.payload ?? "Login failed";
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.initialized = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
        }
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
      });
  },
});

export const { setCredentials, clearSession } = authSlice.actions;
export default authSlice.reducer;