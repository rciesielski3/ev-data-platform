import type { HomeFreshness } from "@/features/home/home-content";

import styles from "./home.module.css";

const DOT: Record<HomeFreshness["status"], string> = {
  SUCCESS: "bg-sun",
  PARTIAL: "bg-sun/60",
  FAILED: "bg-red-400",
  RUNNING: "bg-cream",
};

export const Freshness = ({ items }: { items: HomeFreshness[] }) => (
  <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-cream/80">
    {items.map((item) => (
      <li key={item.key} className="flex cursor-default select-none items-center gap-2.5 rounded-full bg-cream/10 px-4 py-2">
        <span
          className={`${item.status === "SUCCESS" || item.status === "RUNNING" ? styles.live : ""} relative h-2 w-2 rounded-full ${DOT[item.status]}`}
        />
        <span className="font-medium text-cream">{item.label}</span>
        <span className="text-cream/70">{item.relative}</span>
      </li>
    ))}
  </ul>
);
