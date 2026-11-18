import type { ReactNode } from "react";

const PageHeader = ({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="mb-10 flex flex-col gap-6 border-b border-forest/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="muted mt-4 max-w-2xl text-lg">{description}</p>
      )}
    </div>
    {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
  </div>
);

export default PageHeader;
