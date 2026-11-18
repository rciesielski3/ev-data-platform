"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";

export default function CorridorsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("corridorsError");
  const tCommon = useTranslations("common");

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      />
    </main>
  );
}
