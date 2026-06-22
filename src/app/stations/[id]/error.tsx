"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";

const StationDetailsError = ({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  const t = useTranslations("stationDetailError");
  const tCommon = useTranslations("common");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      >
        <Link
          href="/stations"
          className="rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          {t("backLink")}
        </Link>
      </ErrorState>
    </main>
  );
};

export default StationDetailsError;
