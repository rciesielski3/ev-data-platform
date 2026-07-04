const GRID_COLS_CLASS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

export const DetailsSkeleton = ({ columns = 3 }: { columns?: number } = {}) => (
  <div
    className={`grid animate-pulse gap-6 ${GRID_COLS_CLASS[columns] ?? GRID_COLS_CLASS[3]}`}
  >
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="card h-64 rounded-xl bg-slate-100" />
    ))}
  </div>
);
