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
  ArrowRight,
} from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Hero from "@/components/ui/Hero";
import Notice from "@/components/ui/Notice";
import StatStrip from "@/components/ui/StatStrip";
import { ImportStatusBadge } from "@/components/ui/ImportStatusBadge";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayNumber } from "@/lib/display/data-display";
import type { SupportedLocale } from "@/lib/i18n/constants";

export const revalidate = 3600;

const getStatus = async () => {
  const [evCount, stationCount, operatorCount, provinces, ingestionRuns] =
    await Promise.all([
      prisma.evModel.count(),
      prisma.chargingStation.count(),
      prisma.chargingOperator.count(),
      prisma.chargingStation.groupBy({
        by: ["province"],
        where: { province: { not: null } },
      }),
      prisma.ingestionRun.findMany({
        include: { source: true },
        where: {
          completedAt: { not: null },
          status: { in: ["SUCCESS", "PARTIAL"] },
        },
        orderBy: { completedAt: "desc" },
        take: 10,
      }),
    ]);

  const latestBySource: Record<string, (typeof ingestionRuns)[0]> = {};
  for (const run of ingestionRuns) {
    if (!run.source) continue;
    const sourceKey = run.source.key?.toLowerCase() || "";
    if (!sourceKey) continue;
    if (!(sourceKey in latestBySource)) {
      latestBySource[sourceKey] = run;
    }
  }

  return {
    evCount,
    stationCount,
    operatorCount,
    provinceCount: provinces.length,
    ingestionRuns: latestBySource,
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
              size="lg"
              className="transition-transform hover:translate-y-[-4px] active:translate-y-[2px]"
            >
              {t("heroPrimaryCta")}
            </Button>
            <Button
              as={Link}
              href="/contact"
              variant="ghost"
              size="lg"
              className="hero-cta-secondary transition-transform hover:translate-y-[-4px] active:translate-y-[2px]"
            >
              {t("heroSecondaryCta")}
            </Button>
          </>
        }
        importStatusBadges={
          !("error" in status) &&
          (status.ingestionRuns.eipa || status.ingestionRuns.openev) ? (
            <>
              {status.ingestionRuns.eipa && (
                <ImportStatusBadge
                  source="EIPA"
                  status={status.ingestionRuns.eipa.status}
                  completedAt={
                    status.ingestionRuns.eipa.completedAt?.toISOString() ?? null
                  }
                />
              )}
              {status.ingestionRuns.openev && (
                <ImportStatusBadge
                  source="OpenEV"
                  status={status.ingestionRuns.openev.status}
                  completedAt={
                    status.ingestionRuns.openev.completedAt?.toISOString() ??
                    null
                  }
                />
              )}
            </>
          ) : undefined
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
              }),
              label: t("statProvinces"),
            },
          ]}
        />
      )}

      <section className="section-accent mx-auto max-w-5xl px-6 py-16">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="font-display text-2xl font-bold">
            {t("valuePropsTitle")}
          </h2>
          <p className="muted mt-2 text-sm">{t("valuePropsSubtitle")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <Card className="border border-[var(--card-border)] bg-emerald-50">
            <ShieldCheck className="h-6 w-6 text-[var(--accent)] transition-transform duration-300 group-hover:scale-110" />
            <h3 className="mt-4 font-semibold">{t("valueQualityTitle")}</h3>
            <p className="muted mt-2 text-sm">{t("valueQualityBody")}</p>
          </Card>
          <Card className="border border-[var(--card-border)] bg-emerald-50">
            <Database className="h-6 w-6 text-[var(--accent)] transition-transform duration-300 group-hover:scale-110" />
            <h3 className="mt-4 font-semibold">{t("valueNormalizedTitle")}</h3>
            <p className="muted mt-2 text-sm">{t("valueNormalizedBody")}</p>
          </Card>
          <Card className="border border-[var(--card-border)] bg-emerald-50">
            <FileBarChart className="h-6 w-6 text-[var(--accent)] transition-transform duration-300 group-hover:scale-110" />
            <h3 className="mt-4 font-semibold">{t("valueBenchmarkTitle")}</h3>
            <p className="muted mt-2 text-sm">{t("valueBenchmarkBody")}</p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-16 pt-6">
        <div className="mx-auto mb-10 max-w-xl text-center">
          <h2 className="font-display text-2xl font-bold">
            {t("exploreTitle")}
          </h2>
          <p className="muted mt-2 text-sm">{t("exploreSubtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            as={Link}
            href="/vehicles"
            interactive
            className="group relative bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
            <CarFront className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("evCatalogEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("evCatalogTitle")}
            </h3>
            <p className="muted mt-2 text-sm">{t("evCatalogDescription")}</p>
          </Card>
          <Card
            as={Link}
            href="/stations"
            interactive
            className="group relative bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
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
          <Card
            as={Link}
            href="/map"
            interactive
            className="group relative bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
            <MapPinned className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("stationMapEyebrow")}
            </p>
            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("stationMapTitle")}
            </h3>
            <p className="muted mt-2 text-sm">{t("stationMapDescription")}</p>
          </Card>
          <Card
            as={Link}
            href="/connectors"
            interactive
            className="group relative bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
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
          <Card
            as={Link}
            href="/insights"
            interactive
            className="group relative bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
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
          <Card
            as={Link}
            href="/reports"
            interactive
            className="group relative bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <ArrowRight className="absolute right-5 top-5 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--accent)]" />
            <FileBarChart className="h-6 w-6 text-[var(--accent)]" />
            <p className="mt-4 text-sm font-medium text-emerald-700">
              {t("reportsEyebrow")}
            </p>

            <h3 className="font-display mt-2 text-xl font-semibold">
              {t("reportsTitle")}
            </h3>

            <p className="muted mt-2 text-sm">{t("reportsDescription")}</p>
          </Card>
        </div>
      </section>

      <section className="bg-[var(--accent-soft-bg)] py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 text-center">
          <h2 className="font-display text-2xl font-semibold text-[var(--accent-soft-text)]">
            {t("b2bCtaTitle")}
          </h2>
          <p className="muted max-w-xl">{t("b2bCtaBody")}</p>
          <Button as={Link} href="/contact" variant="primary" size="lg">
            {t("b2bCtaButton")}
          </Button>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
