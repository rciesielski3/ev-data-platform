const DetailsSkeleton = () => (
  <div className="grid animate-pulse gap-6 lg:grid-cols-2">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="card h-64 rounded-xl bg-slate-100" />
    ))}
  </div>
);

export default DetailsSkeleton;
