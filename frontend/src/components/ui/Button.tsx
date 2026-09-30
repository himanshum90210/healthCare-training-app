import type { ButtonHTMLAttributes, ReactNode } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  icon,
  fullWidth = false,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: Props) {
  const classes = ["btn", `btn--${variant}`, fullWidth && "btn--block", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <span className="spinner spinner--sm" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}