import { prisma } from "@/lib/db/prisma";

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
        <span className="badge">Milestone 1 · Data Foundation</span>
        <h1 className="text-4xl font-semibold tracking-tight">EV Data Platform</h1>
        <p className="muted max-w-2xl text-lg">
          Normalized EV models and Polish charging infrastructure imported from
          OpenEV Data and EIPA with idempotent upserts and ingestion logging.
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
