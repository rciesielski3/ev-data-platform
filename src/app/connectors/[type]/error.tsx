"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import ErrorState from "@/components/ui/ErrorState";
import { ArrowLeft } from "lucide-react";
import BackLink from "@/components/ui/BackLink";

export default function ConnectorDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("connectorDetailError");
  const tCommon = useTranslations("common");

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <ErrorState
        title={t("title")}
        body={t("body")}
        retryLabel={tCommon("retry")}
        onRetry={reset}
      >
        <BackLink href="/connectors" label={t("backLink")} variant="amber" />
      </ErrorState>
    </main>
  );
}
