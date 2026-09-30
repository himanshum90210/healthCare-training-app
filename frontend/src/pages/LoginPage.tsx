import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate, useLocation } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  Eye,
  EyeOff,
  HeartPulse,
  ShieldCheck,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { login } from "../features/auth/authSlice";
import { loginSchema, type LoginFormValues } from "../features/auth/loginSchema";
import { Loader } from "../components/Loader";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";

gsap.registerPlugin(useGSAP);

const PARTICLES = Array.from({ length: 18 }, (_, i) => i);

// Development-only quick-fill for the seeded synthetic accounts
const DEMO_PASSWORD = "Demo@12345";
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@demo.test" },
  { label: "Doctor", email: "doctor@demo.test" },
  { label: "Reception", email: "reception@demo.test" },
  { label: "Patient", email: "patient@demo.test" },
];

export default function LoginPage() {
  const { user, initialized } = useAppSelector((s) => s.auth);
  const location = useLocation();
  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/dashboard";

  if (!initialized) return <Loader />;
  if (user) return <Navigate to={from} replace />;
  return <LoginView />;
}

function LoginView() {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((s) => s.auth);
  const [showPassword, setShowPassword] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  // Background + entrance animations
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Entrance
        gsap.from(".brand-anim", { y: 24, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out" });
        gsap.from(".form-anim", { y: 20, opacity: 0, duration: 0.7, stagger: 0.07, delay: 0.2, ease: "power3.out" });

        // Drifting gradient orbs
        gsap.utils.toArray<HTMLElement>(".orb").forEach((orb, i) => {
          gsap.to(orb, {
            x: () => gsap.utils.random(-90, 90),
            y: () => gsap.utils.random(-70, 70),
            scale: () => gsap.utils.random(0.9, 1.25),
            duration: gsap.utils.random(6, 10),
            repeat: -1,
            yoyo: true,
            repeatRefresh: true,
            ease: "sine.inOut",
            delay: i * 0.6,
          });
        });

        // Rising particles
        gsap.utils.toArray<HTMLElement>(".particle").forEach((p) => {
          gsap.fromTo(
            p,
            { y: 0, opacity: 0 },
            {
              y: -gsap.utils.random(80, 200),
              opacity: gsap.utils.random(0.3, 0.8),
              duration: gsap.utils.random(4, 8),
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut",
              delay: gsap.utils.random(0, 4),
            }
          );
        });

        // ECG line that draws itself, fades, and repeats
        gsap
          .timeline({ repeat: -1, repeatDelay: 0.3 })
          .fromTo(".ecg__line", { strokeDashoffset: 1, opacity: 1 }, { strokeDashoffset: 0, duration: 2.6, ease: "power1.inOut" })
          .to(".ecg__line", { opacity: 0, duration: 0.8 }, "+=0.6");

        // Mouse parallax on the background layer
        const panel = brandRef.current;
        const layer = bgRef.current;
        if (panel && layer) {
          const xTo = gsap.quickTo(layer, "x", { duration: 1.2, ease: "power3" });
          const yTo = gsap.quickTo(layer, "y", { duration: 1.2, ease: "power3" });
          const onMove = (e: MouseEvent) => {
            const r = panel.getBoundingClientRect();
            xTo(((e.clientX - r.left) / r.width - 0.5) * 40);
            yTo(((e.clientY - r.top) / r.height - 0.5) * 40);
          };
          panel.addEventListener("mousemove", onMove);
          return () => panel.removeEventListener("mousemove", onMove);
        }
      });
    },
    { scope: rootRef }
  );

  // Shake the card when a login attempt fails
  useGSAP(
    () => {
      if (status !== "idle" || !error) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo(".login-card", { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1, 0.3)", clearProps: "transform" });
    },
    { scope: rootRef, dependencies: [status, error] }
  );

  const onSubmit = (values: LoginFormValues) => {
    void dispatch(login(values));
  };

  const fillDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", DEMO_PASSWORD, { shouldValidate: true });
  };

  return (
    <div className="login" ref={rootRef}>
      <aside className="login__brand" ref={brandRef}>
        <div className="login__bg" ref={bgRef} aria-hidden="true">
          <span className="orb orb--1" />
          <span className="orb orb--2" />
          <span className="orb orb--3" />
          {PARTICLES.map((i) => (
            <span
              key={i}
              className="particle"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
            />
          ))}
          <svg className="ecg" viewBox="0 0 600 120">
            <path
              className="ecg__line"
              pathLength={1}
              d="M0 60 H110 L128 60 L142 28 L160 96 L178 44 L192 60 H300 L318 60 L332 34 L350 88 L366 52 L378 60 H600"
            />
          </svg>
        </div>

        <div className="login__brandContent">
          <div className="login__logo brand-anim">
            <HeartPulse size={28} aria-hidden="true" />
          </div>
          <h1 className="brand-anim">Healthcare Training Platform</h1>
          <p className="brand-anim">
            Practise clinical scheduling and patient workflows in a safe, synthetic-data sandbox.
          </p>
          <ul className="login__features">
            <li className="brand-anim">
              <ShieldCheck size={20} aria-hidden="true" /> Role-based access control
            </li>
            <li className="brand-anim">
              <CalendarCheck size={20} aria-hidden="true" /> Scheduling and patient workflow practice
            </li>
            <li className="brand-anim">
              <Activity size={20} aria-hidden="true" /> Synthetic data only, nothing real is stored
            </li>
          </ul>
        </div>
      </aside>

      <main className="login__panel">
        <div className="login-card">
          <h2 className="form-anim">Sign in</h2>
          <p className="login-card__sub form-anim">Use your training account to continue.</p>

          {error && (
            <div className="alert alert--danger" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="form-anim">
              <TextField
                label="Email"
                type="email"
                autoComplete="username"
                error={errors.email?.message}
                {...register("email")}
              />
            </div>
            <div className="form-anim">
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                error={errors.password?.message}
                trailing={
                  <Button
                    variant="ghost"
                    className="btn--icon btn--sm"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    icon={showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    onClick={() => setShowPassword((v) => !v)}
                  />
                }
                {...register("password")}
              />
            </div>
            <div className="form-anim">
              <Button type="submit" fullWidth loading={status === "loading"}>
                {status === "loading" ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          {import.meta.env.DEV && (
            <div className="demo form-anim">
              <p className="demo__label">Development quick-fill (synthetic accounts)</p>
              <div className="demo__chips">
                {DEMO_ACCOUNTS.map((a) => (
                  <Button
                    key={a.email}
                    variant="secondary"
                    className="btn--sm"
                    onClick={() => fillDemo(a.email)}
                  >
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <p className="login-card__note form-anim">
            Training environment. Never enter real patient information.
          </p>
        </div>
      </main>
    </div>
  );
}