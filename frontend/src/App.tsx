import { useEffect } from "react";
import { useAppDispatch } from "./app/hooks";
import { restoreSession } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  return <AppRoutes />;
}