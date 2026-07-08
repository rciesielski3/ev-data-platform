import { ReactNode } from "react";

export type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

export const ActionBar = ({ children, className }: ActionBarProps) => (
  <nav
    className={`border-b border-[var(--card-border)] bg-white py-4 ${className || ""}`}
  >
    <div className="flex flex-wrap gap-3 items-center justify-end">
      {children}
    </div>
  </nav>
);

export default ActionBar;
