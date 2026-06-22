export default function ConnectorDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 h-5 w-36 animate-pulse rounded bg-slate-100" />

      <header className="mb-8">
        <div className="h-6 w-16 animate-pulse rounded-full bg-emerald-100" />
        <div className="mt-4 h-10 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-6 w-full max-w-xl animate-pulse rounded bg-slate-100" />
      </header>

      <div className="grid gap-8 md:grid-cols-[1fr_1.4fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-48 animate-pulse rounded-lg bg-slate-100" />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 h-6 w-44 animate-pulse rounded bg-slate-200" />
          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="border-b border-slate-100 pb-3 last:border-none"
              >
                <div className="h-4 w-36 animate-pulse rounded bg-slate-100" />
                <div className="mt-2 h-5 w-48 animate-pulse rounded bg-slate-200" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
