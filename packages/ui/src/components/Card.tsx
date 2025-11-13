import { PropsWithChildren } from "react";
import clsx from "clsx";

interface CardProps extends PropsWithChildren {
  title: string;
  description?: string;
  className?: string;
}

export function Card({ title, description, className, children }: CardProps) {
  return (
    <article
      className={clsx(
        "rounded-2xl border border-slate-100 bg-white p-6 shadow-sm",
        className
      )}
    >
      <header className="flex flex-col gap-1">
        <p className="text-sm font-medium text-slate-500">{description}</p>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      </header>
      <div className="mt-4">{children}</div>
    </article>
  );
}
