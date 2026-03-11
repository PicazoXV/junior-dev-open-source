import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  as?: "h1" | "h2" | "h3";
  showAccent?: boolean;
};

export default function PageHeader({
  title,
  description,
  actions,
  as = "h1",
  showAccent = true,
}: PageHeaderProps) {
  const HeadingTag = as;

  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-3xl">
        {showAccent && as !== "h3" ? (
          <div className="mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-300/90 shadow-[0_0_10px_rgba(251,146,60,0.65)]" />
            <span className="h-px w-12 bg-gradient-to-r from-orange-400/70 to-transparent" />
          </div>
        ) : null}
        <HeadingTag className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </HeadingTag>
        {description ? <p className="mt-2 text-sm text-gray-400 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
