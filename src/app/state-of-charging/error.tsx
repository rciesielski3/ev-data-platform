"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";

export default function StateOfChargingError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("stateOfCharging");
  const tCommon = useTranslations("common");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <ErrorState
        title={tCommon("setupRequiredTitle")}
        body={t("setupRequiredMessage")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      />
    </main>
  );
}
