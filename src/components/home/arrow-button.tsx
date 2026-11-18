import { ArrowUpRight } from "lucide-react";

import styles from "./home.module.css";

export const ArrowButton = ({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "cream";
  className?: string;
}) => (
  <span
    aria-hidden="true"
    className={`${styles.go} flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
      tone === "dark" ? "bg-forest text-cream" : "bg-cream text-forest"
    } ${className}`}
  >
    <ArrowUpRight size={16} />
  </span>
);
