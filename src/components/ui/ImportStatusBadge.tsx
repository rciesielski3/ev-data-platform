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
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "PARTIAL":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";
    case "RUNNING":
      return "bg-blue-50 text-blue-700 border-blue-200";
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
