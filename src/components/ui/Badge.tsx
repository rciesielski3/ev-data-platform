import type { ReactNode } from "react";

const Badge = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <span className={`badge ${className}`.trim()}>{children}</span>;

export default Badge;
