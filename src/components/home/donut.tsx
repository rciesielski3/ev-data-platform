import styles from "./home.module.css";

export type DonutSegment = { share: number; className: string };

export const Donut = ({
  segments,
  trackClassName,
  className,
  pulse = false,
  children,
}: {
  segments: DonutSegment[];
  trackClassName: string;
  className?: string;
  pulse?: boolean;
  children?: React.ReactNode;
}) => {
  let offset = 0;

  return (
    <div className={`relative ${className ?? ""}`}>
      <svg viewBox="0 0 100 100" className={`${styles.donut} -rotate-90`} fill="none" aria-hidden="true">
        <circle cx="50" cy="50" r="40" strokeWidth="13" className={trackClassName} />
        {segments.map((segment, index) => {
          const length = Math.max(segment.share * 100 - 1.2, 0);
          const start = offset;
          offset += segment.share * 100;
          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r="40"
              strokeWidth="13"
              pathLength="100"
              strokeDasharray={`${length} ${100 - length}`}
              strokeDashoffset={-start}
              strokeLinecap="butt"
              className={`${segment.className} ${pulse ? styles.segPulse : ""}`}
              style={pulse ? ({ "--i": index } as React.CSSProperties) : undefined}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">{children}</div>
    </div>
  );
};
