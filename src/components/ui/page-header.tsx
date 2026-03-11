import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  as?: "h1" | "h2" | "h3";
};

export default function PageHeader({ title, description, actions, as = "h1" }: PageHeaderProps) {
  const HeadingTag = as;

  return (
    <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <HeadingTag className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {title}
        </HeadingTag>
        {description ? <p className="mt-2 text-sm text-gray-400 sm:text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
