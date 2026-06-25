"use client";

import { useLocale, useTranslations } from "next-intl";
import { CarFront, Loader2, MapPinned } from "lucide-react";

export type ImportStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export interface ImportStatusBadgeProps {
  source: string;
  status: ImportStatus;
  completedAt: string | null;
}

const SOURCE_CONFIG = {
  eipa: {
    translationKey: "stationData",
    icon: MapPinned,
  },
  openev: {
    translationKey: "evCatalog",
    icon: CarFront,
  },
} as const;

const STATUS_DOT_CLASSES: Record<ImportStatus, string> = {
  SUCCESS: "bg-emerald-500",
  PARTIAL: "bg-amber-500",
  FAILED: "bg-red-500",
  RUNNING: "bg-blue-500 animate-pulse",
};

const getRelativeTime = (
  dateInput: string | null,
  locale: string,
  fallbackText: string,
): string => {
  if (!dateInput) {
    return fallbackText;
  }

  const date = new Date(dateInput);

  if (Number.isNaN(date.getTime())) {
    return fallbackText;
  }

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  });

  if (diffSecs < 60) {
    return rtf.format(0, "second");
  }

  if (diffMins < 60) {
    return rtf.format(-diffMins, "minute");
  }

  if (diffHours < 24) {
    return rtf.format(-diffHours, "hour");
  }

  return rtf.format(-diffDays, "day");
};

export const ImportStatusBadge = ({
  source,
  status,
  completedAt,
}: ImportStatusBadgeProps) => {
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const config =
    SOURCE_CONFIG[source.toLowerCase() as keyof typeof SOURCE_CONFIG];

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  const relativeTime = getRelativeTime(
    completedAt,
    locale,
    tCommon("notAvailable"),
  );

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/50 px-3 py-2 text-xs backdrop-blur-sm">
      {status === "RUNNING" ? (
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      ) : (
        <Icon className="h-4 w-4 text-[var(--accent)]" />
      )}

      <span className="font-medium text-slate-800">
        {t(`importStatus.${config.translationKey}`)}
      </span>

      <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASSES[status]}`} />

      <span className="text-xs text-slate-500">
        {status === "RUNNING" ? t("importStatus.running") : relativeTime}
      </span>
    </div>
  );
};
