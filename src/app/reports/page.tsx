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

const IconTile = ({
  children,
  tone = "forest",
}: {
  children: React.ReactNode;
  tone?: "forest" | "sun";
}) => (
  <div
    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 motion-safe:group-hover:-rotate-6 ${
      tone === "forest" ? "bg-forest text-sun" : "bg-sun text-forest"
    }`}
  >
    {children}
  </div>
);

const FeatureItem = ({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) => (
  <li className="flex gap-3">
    <span
      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        dark ? "bg-sun text-forest" : "bg-forest/10 text-forest"
      }`}
    >
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
    <span>{children}</span>
  </li>
);

const tierCard =
  "group relative flex flex-col p-7 transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] sm:p-8";

export default async function ReportsPage() {
  const t = await getTranslations("reports");

  const gaMetrics = await getGaMetrics("professional");

  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader title={t("title")} description={t("description")} />

      {gaMetrics && (
        <section className="mt-10">
          <GaMetricsCard
            metrics={gaMetrics.metrics}
            dateRange={gaMetrics.dateRange}
            title={t("gaMetricsTitle")}
          />
        </section>
      )}

      <section className="mt-12 grid items-stretch gap-6 lg:grid-cols-3">
        <Card as="article" className={tierCard}>
          <IconTile>
            <FileBarChart className="h-[22px] w-[22px]" />
          </IconTile>
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-forest">
            {t("starterName")}
          </h2>
          <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-forest">
            {t("starterPrice")}
          </p>
          <p className="muted text-xs">{t("starterPriceNote")}</p>
          <p className="muted mt-4 text-sm">{t("starterDescription")}</p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-forest/80">
            <FeatureItem>{t("starterFeature1")}</FeatureItem>
            <FeatureItem>{t("starterFeature2")}</FeatureItem>
            <FeatureItem>{t("starterFeature3")}</FeatureItem>
            <FeatureItem>{t("starterFeature4")}</FeatureItem>
            <FeatureItem>{t("starterFeature5")}</FeatureItem>
          </ul>
          <Button as={Link} href="/contact" variant="secondary" className="mt-8">
            {t("starterCta")}
          </Button>
        </Card>

        <Card
          as="article"
          className={`${tierCard} !border-0 !bg-forest text-cream shadow-[var(--shadow-lift)] lg:-my-3`}
        >
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap">
            {t("professionalBadge")}
          </Badge>
          <IconTile tone="sun">
            <TrendingUp className="h-[22px] w-[22px]" />
          </IconTile>
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight">
            {t("professionalName")}
          </h2>
          <p className="mt-3 font-display text-4xl font-semibold tracking-tight">
            {t("professionalPrice")}
          </p>
          <p className="text-xs text-cream/70">{t("professionalPriceNote")}</p>
          <p className="mt-4 text-sm text-cream/80">
            {t("professionalDescription")}
          </p>
          <ul className="mt-6 flex-1 space-y-3 text-sm text-cream/90">
            <FeatureItem dark>{t("professionalFeature1")}</FeatureItem>
            <FeatureItem dark>{t("professionalFeature2")}</FeatureItem>
            <FeatureItem dark>{t("professionalFeature3")}</FeatureItem>
            <FeatureItem dark>{t("professionalFeature4")}</FeatureItem>
            <FeatureItem dark>{t("professionalFeature5")}</FeatureItem>
          </ul>
          <Button as={Link} href="/contact" variant="cta" className="mt-8">
            {t("professionalCta")}
          </Button>
        </Card>

        <Card as="article" className={tierCard}>
          <IconTile>
            <Building2 className="h-[22px] w-[22px]" />
          </IconTile>
          <h2 className="mt-6 font-display text-2xl font-semibold tracking-tight text-forest">
            {t("enterpriseName")}
          </h2>
          <p className="mt-3 font-display text-4xl font-semibold tracking-tight text-forest">
            {t("enterprisePriceNote")}
          </p>
          <p className="muted mt-4 flex-1 text-sm">
            {t("enterpriseDescription")}
          </p>
          <Button as={Link} href="/contact" variant="secondary" className="mt-8">
            {t("enterpriseCta")}
          </Button>
        </Card>
      </section>

      <section className="mt-16">
        <Card
          as="article"
          className="flex flex-col gap-6 p-7 sm:p-10 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">
              {t("listingTitle")}
            </h2>
            <p className="muted mt-2 max-w-2xl text-sm">
              {t("listingDescription")}
            </p>
            <p className="mt-4 font-display text-3xl font-semibold tracking-tight text-forest">
              {t("listingPrice")}
            </p>
            <p className="muted text-xs">{t("listingPriceNote")}</p>
          </div>
          <Button as={Link} href="/contact" variant="primary" size="lg">
            {t("listingCta")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>
      </section>

      <section className="mt-6">
        <Card
          as="article"
          className="group flex flex-col items-start gap-5 p-7 sm:flex-row sm:items-center sm:p-10"
        >
          <IconTile tone="sun">
            <FileBarChart className="h-[22px] w-[22px]" />
          </IconTile>
          <div className="flex-1">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-forest">
              {t("sampleTitle")}
            </h2>
            <p className="muted mt-2 max-w-2xl text-sm">
              {t("sampleDescription")}
            </p>
          </div>
          <Button as={Link} href="/reports/sample" variant="secondary">
            {t("sampleCta")}
          </Button>
        </Card>
      </section>

      <section className="mt-20 rounded-[2rem] bg-forest px-6 py-14 text-center text-cream sm:px-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("closingTitle")}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-cream/80">{t("closingBody")}</p>
        <Button as={Link} href="/contact" variant="cta" size="lg" className="mt-8">
          {t("closingCta")}
        </Button>
      </section>
    </main>
  );
}
