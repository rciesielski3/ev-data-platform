import { pickMapBeacons } from "@/features/home/map-beacons";
import type { StationDotMap } from "@/features/home/station-dots";

import styles from "./home.module.css";

export const DotMap = ({
  map,
  minRadius,
  maxRadius,
  dotClassName,
  hotClassName,
  hotThreshold = 0.35,
  staggerSeconds = 0,
  beaconCount = 0,
  className,
}: {
  map: StationDotMap;
  minRadius: number;
  maxRadius: number;
  dotClassName?: string;
  hotClassName?: string;
  hotThreshold?: number;
  staggerSeconds?: number;
  beaconCount?: number;
  className?: string;
}) => (
  <svg
    viewBox={`0 0 ${map.width} ${map.height}`}
    className={className}
    aria-hidden="true"
  >
    {map.dots.map((dot) => {
      const weight = Math.sqrt(dot.count / map.maxCount);
      const hot = hotClassName && weight >= hotThreshold;

      return (
        <circle
          key={`${dot.x}-${dot.y}`}
          cx={dot.x}
          cy={dot.y}
          r={(minRadius + (maxRadius - minRadius) * weight).toFixed(1)}
          className={hot ? hotClassName : dotClassName}
          style={
            staggerSeconds
              ? { animationDelay: `${((dot.y / map.height) * staggerSeconds).toFixed(2)}s` }
              : undefined
          }
        />
      );
    })}
    {pickMapBeacons(map.dots, beaconCount).map((beacon) => {
      const timing = {
        "--s": beacon.scale.toFixed(2),
        "--dur": `${beacon.durationSeconds.toFixed(2)}s`,
        "--delay": `${beacon.delaySeconds.toFixed(2)}s`,
      } as React.CSSProperties;

      return (
        <g key={`beacon-${beacon.x}-${beacon.y}`} style={timing}>
          <circle cx={beacon.x} cy={beacon.y} r={beacon.radius.toFixed(1)} className={styles.beaconRing} />
          <circle cx={beacon.x} cy={beacon.y} r={(beacon.radius * 0.45).toFixed(1)} className={styles.beaconCore} />
        </g>
      );
    })}
  </svg>
);
