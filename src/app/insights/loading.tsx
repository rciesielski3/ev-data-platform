import MetricCardSkeleton from "@/components/ui/MetricCardSkeleton";

const InsightsLoading = () => {
  return (
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <div className="mb-8 space-y-3">
        <div className="h-6 w-44 animate-pulse rounded-2xl bg-forest/10" />
        <div className="h-9 w-72 max-w-full animate-pulse rounded-2xl bg-forest/10" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-2xl bg-forest/10" />
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <MetricCardSkeleton key={index} />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-72 animate-pulse rounded-[1.5rem] bg-forest/10"
          />
        ))}
      </div>
    </main>
  );
};

export default InsightsLoading;
