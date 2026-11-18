const CoverageLoading = () => {
  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mb-8 space-y-3">
        <div className="h-6 w-56 animate-pulse rounded-2xl bg-forest/10" />
        <div className="h-9 w-80 max-w-full animate-pulse rounded-2xl bg-forest/10" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-2xl bg-forest/10" />
      </div>
      <div className="mb-8 h-28 animate-pulse rounded-[1.5rem] bg-forest/10" />
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-[1.5rem] bg-forest/10"
          />
        ))}
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-[1.5rem] bg-forest/10"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-[1.5rem] bg-forest/10" />
    </main>
  );
};

export default CoverageLoading;
