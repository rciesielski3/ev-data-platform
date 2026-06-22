"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";

export default function MapError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("mapError");
  const tCommon = useTranslations("common");

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      />
    </main>
  );
}
