import Link from "next/link";
import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import AnimatedCount from "@/components/ui/CountUp";
import { prisma } from "@/lib/db/prisma";

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
          <div className="flex flex-col items-center gap-8 text-center">
            <span className="badge">{t("heroBadge")}</span>
            <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft-text)] bg-clip-text text-transparent">
              {t("heroTitle")}
            </h1>
            <p className="text-lg text-slate-600 sm:text-xl max-w-2xl">
              {t("heroSubtitle")}
            </p>

            {stats && (
              <div className="mt-10 grid w-full max-w-3xl gap-6 sm:grid-cols-3">
                <div className="card stat-card group relative bg-gradient-to-br from-slate-50 to-white shadow-lg hover:shadow-xl text-center" style={{ "--stat-card-delay": "0ms" } as React.CSSProperties}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-glow)] to-transparent opacity-0 group-hover:opacity-5 rounded-[18px] transition-opacity duration-300" />
                  <p className="text-4xl font-bold text-[var(--accent)]">
                    <AnimatedCount end={stats.stationCount} />
                  </p>
                  <p className="muted text-sm mt-3 font-medium">{t("heroStatStations")}</p>
                </div>
                <div className="card stat-card group relative bg-gradient-to-br from-slate-50 to-white shadow-lg hover:shadow-xl text-center" style={{ "--stat-card-delay": "90ms" } as React.CSSProperties}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-glow)] to-transparent opacity-0 group-hover:opacity-5 rounded-[18px] transition-opacity duration-300" />
                  <p className="text-4xl font-bold text-[var(--accent)]">
                    <AnimatedCount end={stats.operatorCount} />
                  </p>
                  <p className="muted text-sm mt-3 font-medium">{t("heroStatOperators")}</p>
                </div>
                <div className="card stat-card group relative bg-gradient-to-br from-slate-50 to-white shadow-lg hover:shadow-xl text-center" style={{ "--stat-card-delay": "180ms" } as React.CSSProperties}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-glow)] to-transparent opacity-0 group-hover:opacity-5 rounded-[18px] transition-opacity duration-300" />
                  <p className="text-4xl font-bold text-[var(--accent)]">
                    <AnimatedCount end={stats.provinceCount} />
                  </p>
                  <p className="muted text-sm mt-3 font-medium">{t("heroStatProvinces")}</p>
                </div>
              </div>
            )}

            <div className="mt-12">
              <Button
                as={Link}
                href="/contact?interest=FEATURED_LISTING"
                variant="primary"
                className="px-10 py-4 text-base font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl active:scale-95"
              >
                {t("ctaButton")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">
            {t("valuePropsTitle")}
          </h2>
          <div className="mx-auto mt-6 h-1.5 w-40 rounded-full bg-gradient-to-r from-[var(--accent-glow)] via-[var(--accent)] to-[var(--accent-deep)]" />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Visibility */}
          <div className="group relative">
            <div className="card flex flex-col gap-5 h-full bg-gradient-to-br from-white to-slate-50 hover:to-slate-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-glow)] to-[var(--accent)] shadow-md">
                <Check className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-125" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t("visibilityTitle")}
              </h3>
              <p className="text-slate-600 leading-relaxed flex-grow">{t("visibilityBody")}</p>
            </div>
          </div>

          {/* Trust */}
          <div className="group relative">
            <div className="card flex flex-col gap-5 h-full bg-gradient-to-br from-white to-slate-50 hover:to-slate-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-glow)] to-[var(--accent)] shadow-md">
                <Check className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-125" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t("trustTitle")}
              </h3>
              <p className="text-slate-600 leading-relaxed flex-grow">{t("trustBody")}</p>
            </div>
          </div>

          {/* Simple */}
          <div className="group relative">
            <div className="card flex flex-col gap-5 h-full bg-gradient-to-br from-white to-slate-50 hover:to-slate-100 transition-all duration-300 hover:shadow-lg">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent-glow)] to-[var(--accent)] shadow-md">
                <Check className="h-7 w-7 text-white transition-transform duration-300 group-hover:scale-125" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {t("simpleTitle")}
              </h3>
              <p className="text-slate-600 leading-relaxed flex-grow">{t("simpleBody")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-accent mx-auto w-full max-w-5xl px-6 py-20">
        <div className="mb-16 text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900">
            {t("pricingTitle")}
          </h2>
          <div className="mx-auto mt-6 h-1.5 w-40 rounded-full bg-gradient-to-r from-[var(--accent-glow)] via-[var(--accent)] to-[var(--accent-deep)]" />
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="card relative overflow-hidden border-2 border-[var(--accent)] bg-gradient-to-br from-white to-slate-50 shadow-2xl">
              {/* Accent bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent-glow)] to-[var(--accent-deep)]" />

              <div className="flex flex-col gap-8">
                {/* Pricing Display */}
                <div className="text-center pt-4">
                  <div className="text-5xl font-bold text-[var(--accent)]">
                    290 <span className="text-xl text-slate-600 font-normal">zł</span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-600 uppercase tracking-wide">{t("pricingPeriod")}</p>
                </div>

                {/* Features */}
                <div className="space-y-4 border-t-2 border-slate-200 pt-6">
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--accent)] font-bold" />
                    <span className="text-slate-700 font-medium">{t("pricingFeature1")}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--accent)] font-bold" />
                    <span className="text-slate-700 font-medium">{t("pricingFeature2")}</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 h-5 w-5 flex-shrink-0 text-[var(--accent)] font-bold" />
                    <span className="text-slate-700 font-medium">{t("pricingFeature3")}</span>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  as={Link}
                  href="/contact?interest=FEATURED_LISTING"
                  variant="primary"
                  className="w-full py-3 font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
                >
                  {t("ctaButton")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment/Next Steps Section */}
      <section className="mx-auto w-full max-w-5xl px-6 py-20">
        <div className="card bg-gradient-to-br from-[var(--accent-soft-bg)] to-[color-mix(in_srgb,var(--accent-soft-bg)_70%,transparent)] border-2 border-[var(--accent-glow)]">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-slate-900">
              {t("nextStepsTitle")}
            </h2>
            <p className="mt-4 text-slate-700 leading-relaxed">{t("nextStepsBody")}</p>

            <div className="mt-6 pt-4 border-t border-[var(--accent)] opacity-60">
              <p className="text-sm font-medium text-[var(--accent-soft-text)] uppercase tracking-wide">
                Gotowy do rozpoczęcia?
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
