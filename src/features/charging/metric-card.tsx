export type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

export const MetricCard = ({ label, value, helper }: MetricCardProps) => (
  <section className="card">
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
    <p className="muted mt-1 text-sm">{helper}</p>
  </section>
);
