const ProvincesLoading = () => {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </main>
  );
};

export default ProvincesLoading;
