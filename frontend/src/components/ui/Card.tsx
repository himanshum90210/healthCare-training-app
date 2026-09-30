import type { ReactNode } from "react";

interface Props {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function Card({ title, action, children }: Props) {
  return (
    <section className="card">
      {(title || action) && (
        <header className="card__header">
          <h2 className="card__title">{title}</h2>
          {action}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}