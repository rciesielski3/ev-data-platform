import type { ReactNode } from "react";

export const filterInputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

const FilterField = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={`flex flex-col gap-1 text-sm ${className}`.trim()}>
    <span className="font-medium text-slate-700">{label}</span>
    {children}
  </label>
);

export default FilterField;
