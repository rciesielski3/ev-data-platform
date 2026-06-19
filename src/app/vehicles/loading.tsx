export default function VehiclesLoading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="h-9 w-36 animate-pulse rounded bg-slate-200" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-10 w-72 animate-pulse rounded-md bg-slate-100" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-6 w-36 animate-pulse rounded bg-slate-200" />
            <div className="mt-8 grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((__, itemIndex) => (
                <div key={itemIndex}>
                  <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                  <div className="mt-2 h-4 w-20 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
