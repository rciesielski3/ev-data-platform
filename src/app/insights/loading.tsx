const InsightsLoading = () => {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-6 w-44 animate-pulse rounded bg-slate-200" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </main>
  );
};

export default InsightsLoading;
