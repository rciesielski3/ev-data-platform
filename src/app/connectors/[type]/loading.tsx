export default function ConnectorDetailLoading() {
  return (
    <main className="page-shell max-w-4xl pb-20 pt-12 sm:pt-16">
      <div className="mb-8 h-10 w-36 animate-pulse rounded-full bg-forest/10" />

      <header className="mb-10">
        <div className="h-6 w-16 animate-pulse rounded-full bg-forest/10" />
        <div className="mt-4 h-12 w-64 animate-pulse rounded-2xl bg-forest/10" />
        <div className="mt-4 h-6 w-full max-w-xl animate-pulse rounded-2xl bg-forest/10" />
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <section className="card">
          <div className="h-4 w-24 animate-pulse rounded-2xl bg-forest/10" />
          <div className="mt-4 h-48 animate-pulse rounded-2xl bg-forest/10" />
        </section>

        <section className="card">
          <div className="mb-6 h-6 w-44 animate-pulse rounded-2xl bg-forest/10" />
          <div className="space-y-5">
            {Array.from({ length: 6 }).map((_, rowIndex) => (
              <div
                key={rowIndex}
                className="border-b border-forest/10 pb-3 last:border-none"
              >
                <div className="h-4 w-36 animate-pulse rounded-2xl bg-forest/10" />
                <div className="mt-2 h-5 w-48 animate-pulse rounded-2xl bg-forest/10" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
