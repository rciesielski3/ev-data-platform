import type { ReactNode } from "react";

interface DisclosureProps {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

const Disclosure = ({
  summary,
  children,
  defaultOpen = false,
  className = "",
}: DisclosureProps) => {
  return (
    <details open={defaultOpen} className={`group ${className}`}>
      <summary className="cursor-pointer select-none font-medium text-slate-700 hover:text-slate-900">
        {summary}
      </summary>
      <div className="mt-3 text-slate-600">{children}</div>
    </details>
  );
};

export default Disclosure;
