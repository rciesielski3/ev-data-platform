"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export type ImportStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export interface ImportStatusBadgeProps {
  source: string;
  status: ImportStatus;
  completedAt: string | null;
  translations: {
    success: string;
    partial: string;
    failed: string;
    running: string;
    never: string;
    justNow: string;
    minutesAgo: (mins: number) => string;
    hoursAgo: (hours: number) => string;
    daysAgo: (days: number) => string;
  };
}

const getStatusColor = (status: ImportStatus): string => {
  switch (status) {
    case "SUCCESS":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PARTIAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";
    case "RUNNING":
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
};

const getStatusLabel = (status: ImportStatus, t: ImportStatusBadgeProps["translations"]): string => {
  switch (status) {
    case "SUCCESS":
      return t.success;
    case "PARTIAL":
      return t.partial;
    case "FAILED":
      return t.failed;
    case "RUNNING":
      return t.running;
  }
};

const getRelativeTime = (isoDateString: string | null, t: ImportStatusBadgeProps["translations"]): string => {
  if (!isoDateString) return t.never;

  const date = new Date(isoDateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return t.justNow;
  if (diffMins < 60) return t.minutesAgo(diffMins);
  if (diffHours < 24) return t.hoursAgo(diffHours);
  return t.daysAgo(diffDays);
};

export const ImportStatusBadge = ({
  source,
  status,
  completedAt,
  translations,
}: ImportStatusBadgeProps) => {
  const [relativeTime, setRelativeTime] = useState<string>("");
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setRelativeTime(status === "RUNNING" ? "" : getRelativeTime(completedAt, translations));
  }, [completedAt, status, translations]);

  if (!isClient) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${getStatusColor(status)}`}>
      {status === "RUNNING" && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      <span>{source}</span>
      <span className="text-xs opacity-75">
        {status === "RUNNING" ? getStatusLabel(status, translations) : relativeTime}
      </span>
    </div>
  );
};
