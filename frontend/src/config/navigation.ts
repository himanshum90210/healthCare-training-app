import type { Role } from "../types/auth";
import { LayoutDashboard, ShieldCheck, Stethoscope, type LucideIcon } from "lucide-react";

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
  {label: "Dashboard", to: "/dashboard", icon: LayoutDashboard},
  {label: "Doctors", to: "/doctors", icon: Stethoscope},
  {label: "Administration", to: "/admin", icon: ShieldCheck, roles: ["ADMIN"]},
]