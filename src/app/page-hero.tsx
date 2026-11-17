import type { ReactNode } from "react";

export function PageHero({
  children,
  description,
  eyebrow,
  homeTagline,
  hideTitle = false,
  home = false,
  maxWidth = "max-w-6xl",
  title,
}: {
  readonly children?: ReactNode;
  readonly description: string;
  readonly eyebrow?: string;
  readonly homeTagline?: string;
  readonly hideTitle?: boolean;
  readonly home?: boolean;
  readonly maxWidth?: string;
  readonly title: string;
}) {
  return (
    <section
      className={`border-b border-blue-950 text-white ${home ? "cataloga-home-hero" : "bg-blue-950"}`}
    >
      <div
        className={`mx-auto ${maxWidth} px-4 py-8 sm:px-6 md:py-12 ${home ? "flex min-h-[420px] items-center py-10 md:min-h-[440px] md:py-12" : ""}`}
      >
        <div className={home ? "max-w-2xl" : ""}>
          {eyebrow === undefined ? null : (
            <p
              className={`text-xs font-bold uppercase tracking-normal ${home ? "text-[#49DCCB]" : "text-blue-200"}`}
            >
              {eyebrow}
            </p>
          )}
          {hideTitle ? null : (
            <h1
              className={`${eyebrow === undefined ? "mt-0" : "mt-4"} max-w-4xl break-words text-3xl font-bold leading-tight sm:text-4xl md:text-5xl`}
            >
              {title}
            </h1>
          )}
          {homeTagline === undefined ? null : (
            <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-tight text-white sm:mt-4 sm:text-3xl md:text-4xl">
              {homeTagline}
            </h1>
          )}
          <p
            className={`${home ? "mt-3 sm:mt-4" : "mt-5"} max-w-3xl text-sm leading-7 text-blue-50 sm:text-base md:text-lg`}
          >
            {description}
          </p>
          {children === undefined ? null : (
            <div className={home ? "mt-4 sm:mt-5" : "mt-6"}>{children}</div>
          )}
        </div>
      </div>
    </section>
  );
}
