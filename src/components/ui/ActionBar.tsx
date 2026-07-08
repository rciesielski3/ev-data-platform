import { ReactNode } from "react";

export type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

export const ActionBar = ({ children, className }: ActionBarProps) => (
  <nav
    className={`border-b border-[var(--card-border)] bg-white py-4 px-6 ${className || ""}`}
  >
    <div className="mx-auto max-w-6xl flex flex-wrap gap-3 items-center justify-end">
      {children}
    </div>
  </nav>
);

export default ActionBar;
