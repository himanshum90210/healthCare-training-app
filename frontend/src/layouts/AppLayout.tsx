import { useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { HeartPulse, LogOut, Menu, Moon, Sun } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { logout } from "../features/auth/authSlice";
import { Button } from "../components/ui/Button";
import { NAV_ITEMS } from "../config/navigation";
import { useTheme } from "../hooks/useTheme";
import { initials, roleLabel } from "../utils/format";
import {Toaster} from "sonner";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { RealtimeProvider } from "../features/notifications/RealtimeProvider";

gsap.registerPlugin(useGSAP);

export default function AppLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Subtle page transition on every route change
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          mainRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" }
        );
      });
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  const items = NAV_ITEMS.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  return (
    <>
     <Toaster theme={theme} position="top-right" richColors closeButton />
      <RealtimeProvider />
    <div className="shell">
      <aside className={`sidebar${navOpen ? " is-open" : ""}`} aria-label="Primary">
        <div className="sidebar__brand">
          <HeartPulse size={22} aria-hidden="true" />
          <span>Healthcare Training</span>
        </div>
        <nav className="sidebar__nav">
          {items.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
              onClick={() => setNavOpen(false)}
            >
              <Icon size={18} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>
        <p className="sidebar__footer">
          Training environment
          <br />
          Synthetic data only
        </p>
      </aside>

      {navOpen && (
        <button className="shell__backdrop" aria-label="Close menu" onClick={() => setNavOpen(false)} />
      )}

      <div className="shell__body">
        <header className="topbar">
          <Button
            variant="ghost"
            className="btn--icon topbar__menu"
            aria-label="Open menu"
            icon={<Menu size={20} />}
            onClick={() => setNavOpen(true)}
          />
          <div className="topbar__spacer" />
          <NotificationBell />
          <Button
            variant="ghost"
            className="btn--icon"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            onClick={toggle}
          />
          {user && (
            <div className="userchip">
              <span className="avatar" aria-hidden="true">
                {initials(user)}
              </span>
              <div className="userchip__meta">
                <strong>
                  {user.firstName} {user.lastName}
                </strong>
                <span>{roleLabel(user.role)}</span>
              </div>
            </div>
          )}
          <Button
            variant="secondary"
            icon={<LogOut size={16} />}
            onClick={() => void dispatch(logout())}
          >
            Log out
          </Button>
        </header>

        <main className="content" ref={mainRef}>
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}