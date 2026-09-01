import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface SnapshotUnavailableFallbackProps {
  message?: string;
  className?: string;
}

export default function SnapshotUnavailableFallback({
  message,
  className = "",
}: SnapshotUnavailableFallbackProps) {
  const t = useTranslations("common");

  return (
    <div className={`rounded-lg border border-yellow-200 bg-yellow-50 p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600" />
        <p className="text-sm text-yellow-800">
          {message || t("snapshotUnavailable") || "Data is currently unavailable. Please try again in a moment."}
        </p>
      </div>
    </div>
  );
}
