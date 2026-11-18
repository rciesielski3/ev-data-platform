const OperatorsLoading = () => {
  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mb-10 space-y-4">
        <div className="h-12 w-80 max-w-full animate-pulse rounded-2xl bg-forest/10" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-2xl bg-forest/10" />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-[1.5rem] bg-forest/10"
          />
        ))}
      </div>
      <div className="mb-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="h-64 animate-pulse rounded-[1.5rem] bg-forest/10" />
        <div className="h-64 animate-pulse rounded-[1.5rem] bg-forest/10" />
      </div>
      <div className="h-96 animate-pulse rounded-[1.5rem] bg-forest/10" />
    </main>
  );
};

export default OperatorsLoading;
