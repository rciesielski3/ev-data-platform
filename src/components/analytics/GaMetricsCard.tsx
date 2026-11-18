import { GaMetric } from "@/lib/analytics/types";

type GaMetricsCardProps = {
  metrics: GaMetric[];
  dateRange: { startDate: string; endDate: string };
  isLoading?: boolean;
  title?: string;
};

export const GaMetricsCard = ({
  metrics,
  dateRange,
  isLoading = false,
  title = "Your Performance",
}: GaMetricsCardProps) => {
  if (isLoading) {
    return <div className="card p-6 animate-pulse">Loading metrics...</div>;
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold text-forest mb-4">
        {title} ({dateRange.startDate} to {dateRange.endDate})
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="flex flex-col">
            <span className="text-xs font-medium text-forest/70 uppercase">
              {metric.name}
            </span>
            <span className="text-2xl font-bold text-forest mt-1">
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
