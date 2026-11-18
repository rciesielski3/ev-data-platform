const StationsLoading = () => {
  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mb-8 space-y-3">
        <div className="h-10 w-72 animate-pulse rounded-2xl bg-forest/10" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-2xl bg-forest/10" />
      </div>
      <div className="mb-10 h-44 animate-pulse rounded-[2rem] bg-forest/10" />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-[1.5rem] bg-forest/10"
          />
        ))}
      </div>
    </main>
  );
};

export default StationsLoading;
