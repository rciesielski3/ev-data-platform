import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { prisma } from "@/lib/db/prisma";
import { formatDisplayDate } from "@/lib/display/data-display";
import type { SupportedLocale } from "@/lib/i18n/constants";

export const dynamic = "force-dynamic";

const getStatus = async () => {
  const [evCount, stationCount, connectorCount, latestRuns] = await Promise.all([
    prisma.evModel.count(),
    prisma.chargingStation.count(),
    prisma.chargingConnector.count(),
    prisma.ingestionRun.findMany({
      orderBy: { startedAt: "desc" },
      take: 5,
      include: { source: true },
    }),
  ]);

  return { evCount, stationCount, connectorCount, latestRuns };
};

const HomePage = async () => {
  const locale = (await getLocale()) as SupportedLocale;
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  let status:
    | Awaited<ReturnType<typeof getStatus>>
    | { error: string };

  try {
    status = await getStatus();
  } catch {
    status = { error: t("setupMessage") };
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <PageHeader title={t("title")} description={t("description")} />

      {"error" in status ? (
        <Notice title={tCommon("setupRequiredTitle")} tone="warning">
          <p>{status.error}</p>
        </Notice>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="muted text-sm">{t("evModelsLabel")}</p>
              <p className="mt-2 text-3xl font-semibold">{status.evCount}</p>
            </Card>
            <Card>
              <p className="muted text-sm">{t("chargingStationsLabel")}</p>
              <p className="mt-2 text-3xl font-semibold">{status.stationCount}</p>
            </Card>
            <Card>
              <p className="muted text-sm">{t("connectorsLabel")}</p>
              <p className="mt-2 text-3xl font-semibold">{status.connectorCount}</p>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card as={Link} href="/vehicles" interactive>
              <p className="text-sm font-medium text-emerald-700">
                {t("evCatalogEyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{t("evCatalogTitle")}</h2>
              <p className="muted mt-2 text-sm">{t("evCatalogDescription")}</p>
            </Card>
            <Card as={Link} href="/stations" interactive>
              <p className="text-sm font-medium text-emerald-700">
                {t("stationSearchEyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {t("stationSearchTitle")}
              </h2>
              <p className="muted mt-2 text-sm">{t("stationSearchDescription")}</p>
            </Card>
            <Card as={Link} href="/map" interactive>
              <p className="text-sm font-medium text-emerald-700">
                {t("stationMapEyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{t("stationMapTitle")}</h2>
              <p className="muted mt-2 text-sm">{t("stationMapDescription")}</p>
            </Card>
            <Card as={Link} href="/connectors" interactive>
              <p className="text-sm font-medium text-emerald-700">
                {t("connectorKnowledgeEyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {t("connectorKnowledgeTitle")}
              </h2>
              <p className="muted mt-2 text-sm">
                {t("connectorKnowledgeDescription")}
              </p>
            </Card>
            <Card as={Link} href="/insights" interactive>
              <p className="text-sm font-medium text-emerald-700">
                {t("chargingInsightsEyebrow")}
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                {t("chargingInsightsTitle")}
              </h2>
              <p className="muted mt-2 text-sm">
                {t("chargingInsightsDescription")}
              </p>
            </Card>
          </section>

          <Card>
            <h2 className="mb-4 text-xl font-medium">{t("latestRunsTitle")}</h2>
            {status.latestRuns.length === 0 ? (
              <p className="muted">
                {t("noImportsYetPrefix")} <code>npm run import:all</code>{" "}
                {t("noImportsYetSuffix")}
              </p>
            ) : (
              <ul className="space-y-3">
                {status.latestRuns.map((run) => (
                  <li
                    key={run.id}
                    className="flex flex-col gap-1 border-b border-slate-100 pb-3 last:border-none last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <strong>{run.source.label}</strong>
                      <Badge>{run.status}</Badge>
                    </div>
                    <p className="muted text-sm">
                      {t("runStats", {
                        fetched: run.recordsFetched,
                        upserted: run.recordsUpserted,
                        failed: run.recordsFailed,
                      })}
                    </p>
                    <p className="muted text-sm">
                      {run.completedAt
                        ? t("runStartedCompleted", {
                            date: formatDisplayDate(run.startedAt, locale),
                            completedDate: formatDisplayDate(
                              run.completedAt,
                              locale,
                            ),
                          })
                        : t("runStarted", {
                            date: formatDisplayDate(run.startedAt, locale),
                          })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      <Card>
        <h2 className="mb-3 text-xl font-medium">{t("localCommandsTitle")}</h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
{`cp .env.example .env
npm run db:push
npm run import:eipa
npm run import:openev`}
        </pre>
      </Card>
    </main>
  );
};

export default HomePage;
