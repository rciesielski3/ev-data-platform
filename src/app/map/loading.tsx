const MapLoading = () => {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6 space-y-3">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-[34rem] max-w-full animate-pulse rounded bg-slate-200" />
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
