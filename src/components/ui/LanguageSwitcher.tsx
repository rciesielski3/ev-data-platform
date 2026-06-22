"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import type { SupportedLocale } from "@/lib/i18n/constants";
import { setLocale } from "@/lib/i18n/set-locale";

const LOCALE_LABELS: Record<SupportedLocale, string> = {
  pl: "PL",
  en: "EN",
};

const LanguageSwitcher = ({
  currentLocale,
  ariaLabel,
}: {
  currentLocale: SupportedLocale;
  ariaLabel: string;
}) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitch = (locale: SupportedLocale) => {
    if (locale === currentLocale || isPending) {
      return;
    }

    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold"
    >
      {(Object.keys(LOCALE_LABELS) as SupportedLocale[]).map((locale) => (
        <button
          key={locale}
          type="button"
          onClick={() => handleSwitch(locale)}
          aria-pressed={locale === currentLocale}
          className={`rounded-full px-2.5 py-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
            locale === currentLocale
              ? "bg-emerald-600 text-white"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {LOCALE_LABELS[locale]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
