const StationsLoading = () => {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mb-8 h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"
          />
        ))}
      </div>
    </main>
  );
};

export default StationsLoading;
