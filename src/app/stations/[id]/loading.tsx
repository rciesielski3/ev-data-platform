const StationDetailsLoading = () => {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8 h-5 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mb-10 space-y-3">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-96 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-[32rem] max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
        <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
      </div>
    </main>
  );
};

export default StationDetailsLoading;
