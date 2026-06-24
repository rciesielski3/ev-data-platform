"use client";

import { Loader2 } from "lucide-react";

export type ImportStatus = "RUNNING" | "SUCCESS" | "PARTIAL" | "FAILED";

export interface ImportStatusBadgeProps {
  source: string;
  status: ImportStatus;
  completedAt: Date | null;
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

const getStatusLabel = (status: ImportStatus): string => {
  switch (status) {
    case "SUCCESS":
      return "Success";
    case "PARTIAL":
      return "Partial";
    case "FAILED":
      return "Failed";
    case "RUNNING":
      return "Running";
  }
};

const getRelativeTime = (date: Date | null): string => {
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const ImportStatusBadge = ({
  source,
  status,
  completedAt,
}: ImportStatusBadgeProps) => {
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${getStatusColor(status)}`}>
      {status === "RUNNING" && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      <span>{source}</span>
      <span className="text-xs opacity-75">
        {status === "RUNNING" ? getStatusLabel(status) : getRelativeTime(completedAt)}
      </span>
    </div>
  );
};
