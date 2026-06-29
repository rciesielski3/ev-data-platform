const TrendsLoading = () => {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-80 max-w-full animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded bg-slate-200" />
      </div>
      <div className="mb-4 h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="h-96 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </main>
  );
};

export default TrendsLoading;
