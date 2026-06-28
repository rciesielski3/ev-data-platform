"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";
import BackLink from "@/components/ui/BackLink";

export default function VehicleDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("vehicleDetailError");
  const tCommon = useTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      >
        <BackLink href="/vehicles" label={t("backLink")} variant="amber" />
      </ErrorState>
    </main>
  );
}
