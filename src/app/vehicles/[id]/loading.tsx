export default function VehicleDetailLoading() {
  return (
    <main className="page-shell max-w-4xl pb-20 pt-12 sm:pt-16">
      <div className="mb-8 h-10 w-36 animate-pulse rounded-full bg-forest/10" />

      <header className="mb-10">
        <div className="h-4 w-28 animate-pulse rounded-2xl bg-forest/10" />
        <div className="mt-4 h-12 w-72 max-w-full animate-pulse rounded-2xl bg-forest/10" />
        <div className="mt-5 flex gap-2">
          <div className="h-8 w-28 animate-pulse rounded-full bg-forest/10" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-forest/10" />
        </div>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <section key={sectionIndex} className="card">
            <div className="mb-6 flex items-center gap-4">
              <div className="h-12 w-12 animate-pulse rounded-2xl bg-forest/10" />
              <div className="h-6 w-40 animate-pulse rounded-2xl bg-forest/10" />
            </div>
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((__, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex justify-between border-b border-forest/10 pb-3"
                >
                  <div className="h-4 w-28 animate-pulse rounded-2xl bg-forest/10" />
                  <div className="h-4 w-16 animate-pulse rounded-2xl bg-forest/10" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
