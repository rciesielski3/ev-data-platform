import Link from "next/link";
import { getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { GaMetricsCard } from "@/components/analytics/GaMetricsCard";
import { getGaMetrics } from "@/lib/analytics/server";
import {
  ArrowRight,
  Building2,
  Check,
  FileBarChart,
  TrendingUp,
} from "lucide-react";

const FeatureItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-2">
    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

    <span>{children}</span>
  </li>
);

export default async function ReportsPage() {
  const t = await getTranslations("reports");
  
  // Fetch GA metrics for current user (mock implementation for now)
  const gaMetrics = await getGaMetrics("professional");

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <PageHeader title={t("title")} description={t("description")} />

      {/* GA Metrics Section (if user has GA linked) */}
      {gaMetrics && (
        <section className="mt-10">
          <GaMetricsCard
            metrics={gaMetrics.metrics}
            dateRange={gaMetrics.dateRange}
            title={t("gaMetricsTitle")}
          />
        </section>
      )}

      <section className="mt-10 grid gap-6 sm:grid-cols-3">
        <Card
          as="article"
          className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <FileBarChart className="mb-3 h-6 w-6 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold">{t("starterName")}</h2>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {t("starterPrice")}
          </p>
          <p className="muted text-xs">{t("starterPriceNote")}</p>
          <p className="muted mt-3 text-sm">{t("starterDescription")}</p>
          <ul className="muted mt-4 flex-1 space-y-2 text-sm">
            <FeatureItem>{t("starterFeature1")}</FeatureItem>
            <FeatureItem>{t("starterFeature2")}</FeatureItem>
            <FeatureItem>{t("starterFeature3")}</FeatureItem>
            <FeatureItem>{t("starterFeature4")}</FeatureItem>
            <FeatureItem>{t("starterFeature5")}</FeatureItem>
          </ul>
          <Button as={Link} href="/contact" className="mt-6">
            {t("starterCta")}
          </Button>
        </Card>

        <Card
          as="article"
          className="flex flex-col border-emerald-200 ring-1 ring-emerald-100 shadow-lg scale-[1.02] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
        >
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-200 text-emerald-700">
            {t("professionalBadge")}
          </Badge>
          <TrendingUp className="mb-3 h-6 w-6 text-[var(--accent)]" />
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">{t("professionalName")}</h2>
          </div>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {t("professionalPrice")}
          </p>
          <p className="muted text-xs">{t("professionalPriceNote")}</p>
          <p className="muted mt-3 text-sm">{t("professionalDescription")}</p>
          <ul className="muted mt-4 flex-1 space-y-2 text-sm">
            <FeatureItem>{t("professionalFeature1")}</FeatureItem>
            <FeatureItem>{t("professionalFeature2")}</FeatureItem>
            <FeatureItem>{t("professionalFeature3")}</FeatureItem>
            <FeatureItem>{t("professionalFeature4")}</FeatureItem>
            <FeatureItem>{t("professionalFeature5")}</FeatureItem>
          </ul>
          <Button as={Link} href="/contact" className="mt-6">
            {t("professionalCta")}
          </Button>
        </Card>

        <Card
          as="article"
          className="flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <Building2 className="mb-3 h-6 w-6 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold">{t("enterpriseName")}</h2>
          <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
            {t("enterprisePriceNote")}
          </p>
          <p className="muted mt-3 text-sm">{t("enterpriseDescription")}</p>
          <Button
            as={Link}
            href="/contact"
            variant="secondary"
            className="mt-6 text-center"
          >
            {t("enterpriseCta")}
          </Button>
        </Card>
      </section>

      <section className="mt-10">
        <Card
          as="article"
          className="flex flex-col gap-4 border-emerald-200 bg-emerald-50 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2 className="text-xl font-semibold">{t("listingTitle")}</h2>
            <p className="muted mt-1 max-w-2xl text-sm">
              {t("listingDescription")}
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--foreground)]">
              {t("listingPrice")}
            </p>
            <p className="muted text-xs">{t("listingPriceNote")}</p>
          </div>
          <Button as={Link} href="/contact" variant="cta">
            <ArrowRight className="h-4 w-4" />
            {t("listingCta")}
          </Button>
        </Card>
      </section>

      <section className="mt-10">
        <Card
          as="article"
          className="flex flex-col items-center gap-3 border-emerald-200 bg-emerald-50 text-center"
        >
          <FileBarChart className="h-8 w-8 text-[var(--accent)]" />
          <h2 className="text-xl font-semibold">{t("sampleTitle")}</h2>
          <p className="muted max-w-2xl text-sm">{t("sampleDescription")}</p>
          <Button
            as={Link}
            href="/reports/sample"
            variant="cta"
            className="mt-2"
          >
            {t("sampleCta")}
          </Button>
        </Card>
      </section>

      <section className="mt-10 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          {t("closingTitle")}
        </h2>
        <p className="muted mx-auto mt-2 max-w-xl">{t("closingBody")}</p>
        <Button as={Link} href="/contact" className="mt-6">
          {t("closingCta")}
        </Button>
      </section>
    </main>
  );
}
