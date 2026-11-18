import {
  BarChart3,
  Building2,
  CarFront,
  FileBarChart,
  Layers,
  Mail,
  Map,
  MapPinned,
  Megaphone,
  Search,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import styles from "./home.module.css";

const CARD_ICONS: Record<string, LucideIcon> = {
  map: MapPinned,
  search: Search,
  insights: BarChart3,
  vehicles: CarFront,
  coverage: Layers,
  operators: Building2,
  provinces: Map,
  trends: TrendingUp,
  reports: FileBarChart,
  featured: Megaphone,
  contact: Mail,
};

export const CardIcon = ({
  name,
  tone,
  className,
}: {
  name: string;
  tone: "dark" | "amber";
  className?: string;
}) => {
  const Icon = CARD_ICONS[name];
  if (!Icon) return null;

  return (
    <span
      className={`${styles.iconTile} flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
        tone === "dark" ? "bg-forest text-sun" : "bg-sun text-forest"
      } ${className ?? ""}`}
    >
      <Icon size={22} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
};
