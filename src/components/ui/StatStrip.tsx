type Stat = {
  value: string;
  label: string;
  detail?: string;
};

const StatStrip = ({ stats }: { stats: Stat[] }) => (
  <section className="border-y border-[var(--card-border)] bg-white py-10">
    <div
      className={`mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 sm:grid-cols-2 ${
        stats.length > 4 ? "lg:grid-cols-5" : "lg:grid-cols-4"
      }`}
    >
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="stat-card text-center"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <p className="stat-card-value font-display text-2xl font-semibold text-[var(--foreground)]">
            {stat.value}
          </p>
          <p className="muted mt-1 text-sm">{stat.label}</p>
          {stat.detail && <p className="muted mt-1 text-xs">{stat.detail}</p>}
        </div>
      ))}
    </div>
  </section>
);

export default StatStrip;
