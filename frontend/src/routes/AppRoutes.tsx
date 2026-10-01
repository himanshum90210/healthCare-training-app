import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader } from "../components/Loader";
import { ErrorBoundary } from "../components/ErrorBoundary";
import AuthLayout from "../layouts/AuthLayout";
import AppLayout from "../layouts/AppLayout";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";
import AuditLogPage from "../pages/AuditLogPage";

const LoginPage = lazy(() => import("../pages/LoginPage"));
const DashboardPage = lazy(() => import("../pages/DashboardPage"));
const AdminPage = lazy(() => import("../pages/AdminPage"));
const ForbiddenPage = lazy(() => import("../pages/ForbiddenPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));
const DoctorsPage = lazy(() => import("../pages/DoctorsPage"));
const DoctorDetailPage = lazy(() => import("../pages/DoctorDetailPage"));
const AppointmentsPage = lazy(() => import("../pages/AppointmentsPage"));



export default function AppRoutes() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorDetailPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route element={<RequireRole roles={["ADMIN"]} />}>
                <Route path="/admin" element={<AdminPage />} />
                 <Route path="/audit-log" element={<AuditLogPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}