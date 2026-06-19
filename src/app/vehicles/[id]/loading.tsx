export default function VehicleDetailLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="mb-8 h-5 w-32 animate-pulse rounded bg-slate-100" />

      <header className="mb-10">
        <div className="h-5 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-6 w-44 animate-pulse rounded bg-slate-100" />
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, sectionIndex) => (
          <section
            key={sectionIndex}
            className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 h-6 w-40 animate-pulse rounded bg-slate-200" />
            <div className="space-y-5">
              {Array.from({ length: 5 }).map((__, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex justify-between border-b border-slate-100 pb-2"
                >
                  <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-16 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
