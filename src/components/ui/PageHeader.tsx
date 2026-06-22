import type { ReactNode } from "react";

import Badge from "@/components/ui/Badge";

const PageHeader = ({
  badge,
  title,
  description,
  actions,
}: {
  badge: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div>
      <Badge>{badge}</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>
      {description && <p className="muted mt-2 max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-4">{actions}</div>}
  </div>
);

export default PageHeader;
