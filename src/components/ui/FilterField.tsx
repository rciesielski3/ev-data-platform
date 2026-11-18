import type { ReactNode } from "react";

const FilterField = ({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) => (
  <label className={`flex flex-col gap-1.5 text-sm ${className}`.trim()}>
    <span className="font-medium text-forest">{label}</span>
    {children}
  </label>
);

export default FilterField;
