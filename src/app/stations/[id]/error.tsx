"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";
import BackLink from "@/components/ui/BackLink";

const StationDetailsError = ({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) => {
  const t = useTranslations("stationDetailError");
  const tCommon = useTranslations("common");

  return (
    <main className="page-shell max-w-3xl pb-20 pt-12 sm:pt-16">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      >
        <BackLink href="/stations" label={t("backLink")} variant="amber" />
      </ErrorState>
    </main>
  );
};

export default StationDetailsError;
