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
      <summary className="cursor-pointer select-none rounded-lg font-medium text-forest transition-colors hover:text-forest/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sun">
        {summary}
      </summary>
      <div className="mt-3 text-forest/70">{children}</div>
    </details>
  );
};

export default Disclosure;
