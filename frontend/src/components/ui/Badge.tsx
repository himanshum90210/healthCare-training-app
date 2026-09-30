import type { ReactNode } from "react";

interface Props {
  tone?: "neutral" | "info" | "success" | "warning" | "primary";
  children: ReactNode;
}

export function Badge({ tone = "neutral", children }: Props) {
  return <span className={`badge${tone === "neutral" ? "" : ` badge--${tone}`}`}>{children}</span>;
}