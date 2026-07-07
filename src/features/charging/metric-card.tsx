import AnimatedCount from "@/components/ui/CountUp";

export type MetricCardProps = {
  label: string;
  value: number | string;
  helper: string;
  index?: number;
};

export const MetricCard = ({
  label,
  value,
  helper,
  index = 0,
}: MetricCardProps) => (
  <section
    className="card stat-card bg-slate-50 shadow-xl"
    style={{ "--stat-card-delay": `${index * 90}ms` } as React.CSSProperties}
  >
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-950">
      {typeof value === "number" ? (
        <AnimatedCount start={value} end={value} className="stat-card-value" />
      ) : (
        <span className="stat-card-value">{value}</span>
      )}
    </p>
    <p className="muted mt-1 text-sm">{helper}</p>
  </section>
);
