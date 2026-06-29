"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";

export default function TrendsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("trendsError");
  const tCommon = useTranslations("common");

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      />
    </main>
  );
}
