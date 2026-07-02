export const DetailsSkeleton = ({ columns = 3 }: { columns?: number } = {}) => (
  <div className={`grid animate-pulse gap-6 lg:grid-cols-${columns}`}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="card h-64 rounded-xl bg-slate-100" />
    ))}
  </div>
);
