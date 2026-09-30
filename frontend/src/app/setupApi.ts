import { store } from "./store";
import { configureApi } from "../services/api";
import { clearSession, setCredentials } from "../features/auth/authSlice";

configureApi({
  getAccessToken: () => store.getState().auth.accessToken,
  onTokenRefreshed: (payload) => store.dispatch(setCredentials(payload)),
  onAuthFailure: () => store.dispatch(clearSession()),
});