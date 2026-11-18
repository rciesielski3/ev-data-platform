import styles from "./home.module.css";

const PINS = [
  { x: 120, y: 86, r: 5 },
  { x: 86, y: 110, r: 7 },
  { x: 154, y: 110, r: 7 },
  { x: 74, y: 142, r: 7 },
  { x: 166, y: 142, r: 7 },
  { x: 98, y: 170, r: 7 },
  { x: 142, y: 170, r: 7 },
];

export const ConnectorArt = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 240 240" className={className} fill="none" aria-hidden="true">
    <circle cx="120" cy="120" r="112" stroke="#f6f1e7" strokeOpacity="0.18" strokeDasharray="2 8" className={styles.spin} />
    {[0, 1.2, 2.4].map((delay) => (
      <circle
        key={delay}
        cx="120"
        cy="120"
        r="82"
        className={styles.ring}
        style={{ "--d": `${delay}s` } as React.CSSProperties}
      />
    ))}
    <path
      d="M62 58 H178 A12 12 0 0 1 190 70 V122 A70 70 0 0 1 50 122 V70 A12 12 0 0 1 62 58 Z"
      stroke="#f6f1e7"
      strokeWidth="3"
      fill="#0d2b22"
    />
    <path
      d="M72 70 H168 A6 6 0 0 1 174 76 V122 A54 54 0 0 1 66 122 V76 A6 6 0 0 1 72 70 Z"
      stroke="#f6f1e7"
      strokeOpacity="0.3"
      strokeWidth="1.5"
    />
    {PINS.map((pin, index) => (
      <circle
        key={`${pin.x}-${pin.y}`}
        cx={pin.x}
        cy={pin.y}
        r={pin.r}
        className={styles.pin}
        style={{ "--d": `${index * 0.3}s` } as React.CSSProperties}
      />
    ))}
  </svg>
);
