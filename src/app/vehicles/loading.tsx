export default function VehiclesLoading() {
  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="h-12 w-64 animate-pulse rounded-2xl bg-forest/10" />
          <div className="mt-4 h-5 w-80 max-w-full animate-pulse rounded-2xl bg-forest/10" />
        </div>
        <div className="h-11 w-full max-w-xl animate-pulse rounded-xl bg-forest/10" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="card">
            <div className="h-3 w-20 animate-pulse rounded-2xl bg-forest/10" />
            <div className="mt-3 h-7 w-40 animate-pulse rounded-2xl bg-forest/10" />
            <div className="mt-4 h-6 w-28 animate-pulse rounded-full bg-forest/10" />
            <div className="mt-8 grid grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((__, itemIndex) => (
                <div key={itemIndex}>
                  <div className="h-3 w-16 animate-pulse rounded-2xl bg-forest/10" />
                  <div className="mt-2 h-4 w-20 animate-pulse rounded-2xl bg-forest/10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
