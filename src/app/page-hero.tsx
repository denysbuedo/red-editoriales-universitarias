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
      <div className={`mx-auto ${maxWidth} px-6 py-10 md:py-12`}>
        <p className="text-xs font-bold uppercase tracking-normal text-blue-200">{eyebrow}</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight md:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-blue-50 md:text-lg">{description}</p>
        {children === undefined ? null : <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}
