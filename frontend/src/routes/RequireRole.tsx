import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../app/hooks";
import type { Role } from "../types/auth";

interface Props {
  roles: Role[];
  children?: ReactNode;
}

// UX layer only. The real enforcement is the backend's authorize() middleware.
export default function RequireRole({ roles, children }: Props) {
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return <>{children ?? <Outlet />}</>;
}