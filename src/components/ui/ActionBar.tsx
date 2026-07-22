import { ReactNode } from "react";

export type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

export const ActionBar = ({ children, className }: ActionBarProps) => (
  <nav
    className={`mb-8 rounded-lg bg-gray-50 border border-[var(--card-border)] py-6 px-6 ${className || ""}`}
  >
    <div className="flex flex-wrap gap-4 items-center justify-end">
      {children}
    </div>
  </nav>
);

export default ActionBar;
