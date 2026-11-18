"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { useTranslations } from "next-intl";

import Button from "@/components/ui/Button";

const AppError = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page-shell flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sun text-forest">
        <TriangleAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl">
        {t("setupRequiredTitle")}
      </h1>
      <p className="muted mt-3 max-w-lg text-lg">{t("unavailableBody")}</p>
      <Button type="button" size="lg" className="mt-8" onClick={reset}>
        {t("retry")}
      </Button>
    </main>
  );
};

export default AppError;
