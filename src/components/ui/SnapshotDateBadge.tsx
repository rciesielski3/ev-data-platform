import { formatDistanceToNow } from "date-fns";
import { enUS, pl } from "date-fns/locale";

interface SnapshotDateBadgeProps {
  date: Date | null;
  locale?: "en" | "pl";
  className?: string;
}

export default function SnapshotDateBadge({
  date,
  locale = "en",
  className = "",
}: SnapshotDateBadgeProps) {
  if (!date) return null;

  const fnsLocale = locale === "pl" ? pl : enUS;
  const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: fnsLocale });

  return (
    <p className={`text-sm text-gray-500 ${className}`}>
      Data updated {timeAgo}
    </p>
  );
}
