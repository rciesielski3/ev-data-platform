type Stat = {
  value: string;
  label: string;
};

const StatStrip = ({ stats }: { stats: Stat[] }) => (
  <section className="border-y border-[var(--card-border)] bg-white py-10">
    <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            {stat.value}
          </p>
          <p className="muted mt-1 text-sm">{stat.label}</p>
        </div>
      ))}
    </div>
  </section>
);

export default StatStrip;
