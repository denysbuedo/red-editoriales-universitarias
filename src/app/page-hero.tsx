import type { ReactNode } from "react";

export function PageHero({
  children,
  description,
  eyebrow,
  maxWidth = "max-w-6xl",
  title,
}: {
  readonly children?: ReactNode;
  readonly description: string;
  readonly eyebrow: string;
  readonly maxWidth?: string;
  readonly title: string;
}) {
  return (
    <section className="border-b border-blue-950 bg-blue-950 text-white">
      <div className={`mx-auto ${maxWidth} px-4 py-8 sm:px-6 md:py-12`}>
        <p className="text-xs font-bold uppercase tracking-normal text-blue-200">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl break-words text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-blue-50 sm:text-base md:text-lg">
          {description}
        </p>
        {children === undefined ? null : <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
