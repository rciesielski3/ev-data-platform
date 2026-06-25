import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayNumber } from "@/lib/display/data-display";

export const revalidate = 3600;

const getStats = async () => {
  const [stationCount, operatorCount, provinces] = await Promise.all([
    prisma.chargingStation.count(),
    prisma.chargingOperator.count(),
    prisma.chargingStation.groupBy({
      by: ["province"],
      where: { province: { not: null } },
    }),
  ]);

  return {
    stationCount,
    operatorCount,
    provinceCount: provinces.length,
  };
};

export default async function OperatorFeaturedPage() {
  const t = await getTranslations("operatorFeatured");

  let stats;
  try {
    stats = await getStats();
  } catch {
    stats = null;
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="hero-surface relative overflow-hidden px-6 py-16 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-col items-center gap-6 text-center">
            <span className="badge">{t("heroBadge")}</span>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-slate-600 sm:text-xl">
              {t("heroSubtitle")}
            </p>

            {stats && (
              <div className="mt-6 flex flex-col gap-2 text-sm text-slate-700">
                <p className="font-medium">
                  {t("heroStats", {
                    stations: formatDisplayNumber(stats.stationCount),
                    operators: formatDisplayNumber(stats.operatorCount),
                    provinces: stats.provinceCount,
                  })}
                </p>
              </div>
            )}

            <div className="mt-8">
              <Button
                as={Link}
                href="/contact?interest=FEATURED_LISTING"
                variant="primary"
                className="px-8 py-3 text-base"
              >
                {t("ctaButton")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">
            {t("valuePropsTitle")}
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Visibility */}
          <Card className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("visibilityTitle")}
            </h3>
            <p className="text-slate-600">{t("visibilityBody")}</p>
          </Card>

          {/* Trust */}
          <Card className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("trustTitle")}
            </h3>
            <p className="text-slate-600">{t("trustBody")}</p>
          </Card>

          {/* Simple */}
          <Card className="flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Check className="h-6 w-6 text-emerald-700" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              {t("simpleTitle")}
            </h3>
            <p className="text-slate-600">{t("simpleBody")}</p>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-accent mx-auto w-full max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">
            {t("pricingTitle")}
          </h2>
        </div>

        <Card className="mx-auto max-w-md border-2 border-emerald-200">
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-center">
                <div className="text-4xl font-bold text-slate-900">
                  290 <span className="text-lg text-slate-600">zł</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{t("pricingPeriod")}</p>
              </div>
            </div>

            <div className="space-y-3 border-t pt-6">
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span className="text-slate-700">{t("pricingFeature1")}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span className="text-slate-700">{t("pricingFeature2")}</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                <span className="text-slate-700">{t("pricingFeature3")}</span>
              </div>
            </div>

            <Button
              as={Link}
              href="/contact?interest=FEATURED_LISTING"
              variant="primary"
              className="w-full"
            >
              {t("ctaButton")}
            </Button>
          </div>
        </Card>
      </section>

      {/* FAQ or additional info */}
      <section className="mx-auto w-full max-w-5xl px-6 py-16">
        <div className="rounded-lg bg-emerald-50 p-8">
          <h2 className="text-xl font-bold text-slate-900">
            {t("nextStepsTitle")}
          </h2>
          <p className="mt-3 text-slate-700">{t("nextStepsBody")}</p>
        </div>
      </section>
    </main>
  );
}
