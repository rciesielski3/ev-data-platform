"use client";

import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";

const AppError = ({ reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  const t = useTranslations("common");

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <ErrorState
        title={t("setupRequiredTitle")}
        body={t("unavailableBody")}
        retryLabel={t("retry")}
        onRetry={reset}
      />
    </main>
  );
};

export default AppError;
