const numberFormatter = new Intl.NumberFormat("en");
const percentFormatter = new Intl.NumberFormat("en", {
  style: "percent",
  maximumFractionDigits: 0,
});

export type MetricCardProps = {
  label: string;
  value: number;
  unit?: "percent" | "kW" | string;
  helper: string;
  index?: number;
};

export const MetricCard = ({
  label,
  value,
  unit,
  helper,
  index = 0,
}: MetricCardProps) => {
  const formatValue = () => {
    if (unit === "percent") {
      return percentFormatter.format(value / 100);
    }
    if (unit === "kW") {
      return value === 0 ? "Unknown" : `${numberFormatter.format(value)} kW`;
    }
    if (unit) {
      return `${numberFormatter.format(value)} ${unit}`;
    }
    return numberFormatter.format(value);
  };

  return (
    <section
      className="card stat-card bg-slate-50 shadow-xl"
      style={{ "--stat-card-delay": `${index * 90}ms` } as React.CSSProperties}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-950">
        <span className="stat-card-value">{formatValue()}</span>
      </p>
      <p className="muted mt-1 text-sm">{helper}</p>
    </section>
  );
};
