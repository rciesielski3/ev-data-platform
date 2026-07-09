import { ReactNode } from "react";

export type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

export const ActionBar = ({ children, className }: ActionBarProps) => (
  <nav
    className={`border-b border-[var(--card-border)] bg-white py-5 ${className || ""}`}
  >
    <div className="flex flex-wrap gap-4 items-center justify-end px-6">
      {children}
    </div>
  </nav>
);

export default ActionBar;
