const MapLoading = () => {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6">
        <span className="badge">Milestone 4 - Map Experience</span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Charging Station Map
        </h1>
        <p className="muted mt-2 max-w-2xl">
          Explore Polish charging stations by province, connector type, and
          minimum charging power.
        </p>
      </div>
      <div className="card mb-6 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-md bg-slate-200"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="h-[32rem] animate-pulse rounded-lg border border-slate-200 bg-white lg:h-[42rem]" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default MapLoading;
