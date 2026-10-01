import type { Role } from "../types/auth";
import { CalendarCheck, LayoutDashboard, ShieldCheck, Stethoscope, type LucideIcon, ScrollText } from "lucide-react";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles?: Role[]; // omit = visible to everyone
}

// export const NAV_ITEMS: NavItem[] = [
//   { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
//   { label: "Administration", to: "/admin", icon: ShieldCheck, roles: ["ADMIN"] },
// ];

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Doctors", to: "/doctors", icon: Stethoscope },
  { label: "Appointments", to: "/appointments", icon: CalendarCheck },
  { label: "Administration", to: "/admin", icon: ShieldCheck, roles: ["ADMIN"] },
  { label: "Audit log", to: "/audit-log", icon: ScrollText, roles: ["ADMIN"] },
]