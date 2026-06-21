import { prisma } from "@/lib/db/prisma";
import Link from "next/link";

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

const formatDate = (value: Date | null | undefined) => {
  if (!value) {
    return "unknown";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(value);
};

const HomePage = async () => {
  let status:
    | Awaited<ReturnType<typeof getStatus>>
    | { error: string };

  try {
    status = await getStatus();
  } catch {
    status = {
      error:
        "Database is not configured yet. Copy .env.example to .env and run prisma db push.",
    };
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <span className="badge">Milestone 2 - Searchable MVP</span>
        <h1 className="text-4xl font-semibold tracking-tight">EV Data Platform</h1>
        <p className="muted max-w-2xl text-lg">
          Search normalized EV models and Polish charging infrastructure with
          source attribution, import freshness, and simple filters.
        </p>
      </header>

      {"error" in status ? (
        <section className="card border-amber-200 bg-amber-50 text-amber-900">
          <h2 className="mb-2 text-lg font-medium">Setup required</h2>
          <p>{status.error}</p>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="card">
              <p className="muted text-sm">EV models</p>
              <p className="mt-2 text-3xl font-semibold">{status.evCount}</p>
            </div>
            <div className="card">
              <p className="muted text-sm">Charging stations</p>
              <p className="mt-2 text-3xl font-semibold">{status.stationCount}</p>
            </div>
            <div className="card">
              <p className="muted text-sm">Connectors</p>
              <p className="mt-2 text-3xl font-semibold">{status.connectorCount}</p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Link
              href="/vehicles"
              className="card transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-sky-700">EV catalog</p>
              <h2 className="mt-2 text-xl font-semibold">Browse vehicle models</h2>
              <p className="muted mt-2 text-sm">
                Search brands and models, then open detail pages for battery,
                range, charging, source, and freshness.
              </p>
            </Link>
            <Link
              href="/stations"
              className="card transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-sky-700">Station search</p>
              <h2 className="mt-2 text-xl font-semibold">
                Find charging infrastructure
              </h2>
              <p className="muted mt-2 text-sm">
                Filter stations by location, connector, minimum power, and
                operator using imported EIPA data.
              </p>
            </Link>
            <Link
              href="/map"
              className="card transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-sky-700">Station map</p>
              <h2 className="mt-2 text-xl font-semibold">
                Explore chargers on a map
              </h2>
              <p className="muted mt-2 text-sm">
                View grouped Polish charging stations with province, connector,
                and minimum-power filters.
              </p>
            </Link>
            <Link
              href="/connectors"
              className="card transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-sky-700">
                Connector knowledge
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Understand connector types
              </h2>
              <p className="muted mt-2 text-sm">
                Review CCS2, Type 2, CHAdeMO, and unknown connector records with
                AC/DC context and typical power ranges.
              </p>
            </Link>
            <Link
              href="/insights"
              className="card transition-shadow hover:shadow-md"
            >
              <p className="text-sm font-medium text-sky-700">
                Charging insights
              </p>
              <h2 className="mt-2 text-xl font-semibold">
                Explore infrastructure metrics
              </h2>
              <p className="muted mt-2 text-sm">
                See top operators, connector distribution, strongest stations,
                and province coverage from imported station data.
              </p>
            </Link>
          </section>

          <section className="card">
            <h2 className="mb-4 text-xl font-medium">Latest ingestion runs</h2>
            {status.latestRuns.length === 0 ? (
              <p className="muted">
                No imports yet. Run <code>npm run import:all</code> after configuring
                the database.
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
                      <span className="badge">{run.status}</span>
                    </div>
                    <p className="muted text-sm">
                      fetched {run.recordsFetched} · upserted {run.recordsUpserted} ·
                      failed {run.recordsFailed}
                    </p>
                    <p className="muted text-sm">
                      started {formatDate(run.startedAt)}
                      {run.completedAt
                        ? ` / completed ${formatDate(run.completedAt)}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <section className="card">
        <h2 className="mb-3 text-xl font-medium">Local commands</h2>
        <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-100">
{`cp .env.example .env
npm run db:push
npm run import:eipa
npm run import:openev`}
        </pre>
      </section>
    </main>
  );
};

export default HomePage;
