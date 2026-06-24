import Link from "next/link";
import {
  ShieldCheck,
  Database,
  FileBarChart,
  CarFront,
  Search,
  MapPinned,
  Plug,
  BarChart3,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Hero from "@/components/ui/Hero";
import Notice from "@/components/ui/Notice";
import StatStrip from "@/components/ui/StatStrip";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayNumber } from "@/lib/display/data-display";
import type { SupportedLocale } from "@/lib/i18n/constants";

export const revalidate = 3600;

const TOTAL_PROVINCES_IN_POLAND = 16;

const getStatus = async () => {
  const [evCount, stationCount, operatorCount, provinces] = await Promise.all([
    prisma.evModel.count(),
    prisma.chargingStation.count(),
    prisma.chargingOperator.count(),
    prisma.chargingStation.groupBy({
      by: ["province"],
      where: { province: { not: null } },
    }),
  ]);

  return {
    evCount,
    stationCount,
    operatorCount,
    provinceCount: provinces.length,
  };
};

const HomePage = async () => {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  let status: Awaited<ReturnType<typeof getStatus>> | { error: string };

  try {
    status = await getStatus();
  } catch {
    status = { error: t("setupMessage") };
  }

  return (
    <main className="flex flex-1 flex-col">
      <Hero
        badge={t("heroBadge")}
        title={t("heroHeadline")}
        subhead={t("heroSubhead")}
        actions={
          <>
            <Button
              as={Link}
              href="/map"
              variant="primary"
              className="px-6 py-3 text-base"
            >
              {t("heroPrimaryCta")}
            </Button>
            <Button
              as={Link}
              href="/contact"
              variant="ghost"
              className="hero-cta-secondary px-6 py-3 text-base"
            >
              {t("heroSecondaryCta")}
            </Button>
          </>
        }
      />

      {"error" in status ? (
        <div className="mx-auto w-full max-w-5xl px-6 pb-16">
          <Notice title={tCommon("setupRequiredTitle")} tone="warning">
            <p>{status.error}</p>
          </Notice>
        </div>
      ) : (
        <StatStrip
          stats={[
            {
              value: formatDisplayNumber(status.stationCount, locale),
              label: t("statStations"),
            },
            {
              value: formatDisplayNumber(status.operatorCount, locale),
              label: t("statOperators"),
            },
            {
              value: formatDisplayNumber(status.evCount, locale),
              label: t("statEvModels"),
            },
            {
              value: t("statProvincesValue", {
                count: status.provinceCount,
                total: TOTAL_PROVINCES_IN_POLAND,
              }),
              label: t("statProvinces"),
            },
          ]}
        />
      )}

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="font-display text-2xl font-bold">
            {t("valuePropsTitle")}
          </h2>
          <p className="muted mt-2 text-sm">{t("valuePropsSubtitle")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <ShieldCheck className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-semibold">{t("valueQualityTitle")}</h3>
            <p className="muted mt-2 text-sm">{t("valueQualityBody")}</p>
          </Card>
          <Card>
            <Database className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-semibold">
              {t("valueNormalizedTitle")}
            </h3>
            <p className="muted mt-2 text-sm">{t("valueNormalizedBody")}</p>
          </Card>
          <Card>
            <FileBarChart className="h-6 w-6 text-[var(--accent)]" />
            <h3 className="mt-4 font-semibold">{t("valueBenchmarkTitle")}</h3>
            <p className="muted mt-2 text-sm">{t("valueBenchmarkBody")}</p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display mb-6 text-2xl font-semibold">
          {t("exploreTitle")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card as={Link} href="/vehicles" interactive>
            <CarFront className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("evCatalogEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("evCatalogTitle")}
            </h3>
            <p className="muted mt-2 text-sm">{t("evCatalogDescription")}</p>
          </Card>
          <Card as={Link} href="/stations" interactive>
            <Search className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("stationSearchEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("stationSearchTitle")}
            </h3>
            <p className="muted mt-2 text-sm">
              {t("stationSearchDescription")}
            </p>
          </Card>
          <Card as={Link} href="/map" interactive>
            <MapPinned className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("stationMapEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("stationMapTitle")}
            </h3>
            <p className="muted mt-2 text-sm">{t("stationMapDescription")}</p>
          </Card>
          <Card as={Link} href="/connectors" interactive>
            <Plug className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("connectorKnowledgeEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("connectorKnowledgeTitle")}
            </h3>
            <p className="muted mt-2 text-sm">
              {t("connectorKnowledgeDescription")}
            </p>
          </Card>
          <Card as={Link} href="/insights" interactive>
            <BarChart3 className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("chargingInsightsEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("chargingInsightsTitle")}
            </h3>
            <p className="muted mt-2 text-sm">
              {t("chargingInsightsDescription")}
            </p>
          </Card>
        </div>
      </section>

      <section className="bg-[var(--accent-soft-bg)] py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--accent-soft-text)]">
            {t("b2bCtaTitle")}
          </h2>
          <p className="muted max-w-xl">{t("b2bCtaBody")}</p>
          <Button
            as={Link}
            href="/contact"
            variant="primary"
            className="px-6 py-3 text-base"
          >
            {t("b2bCtaButton")}
          </Button>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
