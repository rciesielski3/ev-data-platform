"use client";

import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export type ImportStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export interface ImportStatusBadgeProps {
  source: string;
  status: ImportStatus;
  completedAt: string | null;
}

const getStatusColor = (status: ImportStatus): string => {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-100 text-emerald-800 border-emerald-400 shadow-sm";
    case "PARTIAL":
      return "bg-amber-100 text-amber-800 border-amber-400 shadow-sm";
    case "FAILED":
      return "bg-red-100 text-red-800 border-red-400 shadow-sm";
    case "RUNNING":
      return "bg-blue-100 text-blue-800 border-blue-400 shadow-sm";
  }
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

  const relativeTime = getRelativeTime(
    completedAt,
    locale,
    tCommon("notAvailable"),
  );

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${getStatusColor(status)}`}
    >
      {status === "RUNNING" && <Loader2 className="h-4 w-4 animate-spin" />}

      <span>{source}</span>

      <span className="text-xs opacity-75">
        {status === "RUNNING"
          ? t(`importStatus.${status.toLowerCase()}`)
          : relativeTime}
      </span>
    </div>
  );
};
