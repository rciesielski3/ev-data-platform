import type { ReactNode } from "react";

const BOLT = "M62 8 30 56h22l-8 36 34-50H54z";

const Bolt = ({
  x,
  y,
  s = 1,
  fill = "#f2a65a",
}: {
  x: number;
  y: number;
  s?: number;
  fill?: string;
}) => (
  <path d={BOLT} fill={fill} transform={`translate(${x} ${y}) scale(${s})`} />
);

const Plug = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-22" y="-30" width="44" height="46" rx="12" fill="#f6f1e7" />
    <rect x="-10" y="-52" width="6" height="24" rx="3" fill="#f6f1e7" />
    <rect x="4" y="-52" width="6" height="24" rx="3" fill="#f6f1e7" />
    <path
      d="M0 16v24c0 14 12 18 28 18"
      stroke="#f6f1e7"
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
  </g>
);

const Car = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M0 40 8 18c3-8 9-12 18-12h44c9 0 15 4 20 11l12 14c8 1 12 5 12 12v5H0z"
      fill="#f6f1e7"
    />
    <path
      d="M18 18h24v16H12zM48 18h22l12 16H48z"
      fill="#0d2b22"
      opacity=".35"
    />
    <circle
      cx="28"
      cy="52"
      r="11"
      fill="#0d2b22"
      stroke="#f6f1e7"
      strokeWidth="4"
    />
    <circle
      cx="96"
      cy="52"
      r="11"
      fill="#0d2b22"
      stroke="#f6f1e7"
      strokeWidth="4"
    />
  </g>
);

const HomeScene = () => (
  <>
    <path d="M120 230V120l120-70 120 70v110z" fill="#f6f1e7" />
    <path
      d="M100 124 240 44l140 80"
      stroke="#f2a65a"
      strokeWidth="10"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="215" y="160" width="50" height="70" rx="6" fill="#0d2b22" />
    <rect x="410" y="110" width="56" height="96" rx="14" fill="#f6f1e7" />
    <Bolt x={402} y={118} s={0.8} />
    <path
      d="M438 206v24c0 12-14 16-30 16h-40"
      stroke="#f6f1e7"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
    />
    <Car x={480} y={170} s={1.1} />
  </>
);

const CoinsScene = () => (
  <>
    {[0, 1, 2, 3].map((i) => (
      <ellipse
        key={i}
        cx="170"
        cy={210 - i * 22}
        rx="62"
        ry="18"
        fill="#f2a65a"
        stroke="#0d2b22"
        strokeWidth="3"
      />
    ))}
    {[0, 1, 2].map((i) => (
      <ellipse
        key={i}
        cx="300"
        cy={210 - i * 22}
        rx="62"
        ry="18"
        fill="#f6f1e7"
        stroke="#0d2b22"
        strokeWidth="3"
      />
    ))}
    <circle cx="430" cy="130" r="64" fill="#f2a65a" />
    <circle
      cx="430"
      cy="130"
      r="50"
      fill="none"
      stroke="#0d2b22"
      strokeWidth="4"
    />
    <Bolt x={400} y={90} s={0.6} fill="#0d2b22" />
    <path
      d="M90 240h420"
      stroke="#f6f1e7"
      strokeWidth="4"
      strokeLinecap="round"
      opacity=".5"
    />
  </>
);

const GaugeScene = () => (
  <>
    <path
      d="M130 220a170 170 0 0 1 340 0"
      stroke="#f6f1e7"
      strokeWidth="26"
      strokeLinecap="round"
      fill="none"
      opacity=".25"
    />
    <path
      d="M130 220a170 170 0 0 1 250-150"
      stroke="#f2a65a"
      strokeWidth="26"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M300 220 380 110"
      stroke="#f6f1e7"
      strokeWidth="10"
      strokeLinecap="round"
    />
    <circle cx="300" cy="220" r="20" fill="#f6f1e7" />
    <Bolt x={270} y={130} s={0.45} />
    <path
      d="M110 250h380"
      stroke="#f6f1e7"
      strokeWidth="4"
      opacity=".4"
      strokeLinecap="round"
    />
  </>
);

const WinterScene = () => (
  <>
    {[
      [110, 70, 6],
      [200, 130, 4],
      [480, 80, 5],
      [540, 160, 4],
      [90, 190, 4],
      [380, 50, 4],
    ].map(([cx, cy, r]) => (
      <circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="#f6f1e7"
        opacity=".7"
      />
    ))}
    <g
      transform="translate(300 120)"
      stroke="#f6f1e7"
      strokeWidth="7"
      strokeLinecap="round"
    >
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a})`}>
          <path d="M0-70V70M-18-52 0-36 18-52M-18 52 0 36 18 52" fill="none" />
        </g>
      ))}
    </g>
    <Bolt x={270} y={80} s={0.55} />
    <path
      d="M60 250c80-26 160-26 240 0s160 26 240 0v10H60z"
      fill="#f6f1e7"
      opacity=".85"
    />
  </>
);

const RoadScene = () => (
  <>
    <path
      d="M40 250c120-20 100-110 230-110s110 90 290-70"
      stroke="#f6f1e7"
      strokeWidth="22"
      strokeLinecap="round"
      fill="none"
      opacity=".25"
    />
    <path
      d="M40 250c120-20 100-110 230-110s110 90 290-70"
      stroke="#f2a65a"
      strokeWidth="5"
      strokeDasharray="4 18"
      strokeLinecap="round"
      fill="none"
    />
    {[
      [150, 200],
      [330, 150],
      [500, 100],
    ].map(([cx, cy]) => (
      <g key={cx}>
        <circle cx={cx} cy={cy} r="24" fill="#f6f1e7" />
        <Bolt x={cx - 14} y={cy - 18} s={0.35} fill="#0d2b22" />
      </g>
    ))}
    <Car x={50} y={150} s={0.8} />
  </>
);

const VersusScene = () => (
  <>
    <rect x="90" y="60" width="170" height="170" rx="28" fill="#f6f1e7" />
    <rect x="340" y="60" width="170" height="170" rx="28" fill="#f2a65a" />
    <Bolt x={118} y={98} s={1.1} fill="#0d2b22" />
    <Plug x={425} y={135} s={1.2} />
    <circle
      cx="300"
      cy="145"
      r="30"
      fill="#0d2b22"
      stroke="#f6f1e7"
      strokeWidth="5"
    />
    <path
      d="M286 133l28 24M314 133l-28 24"
      stroke="#f6f1e7"
      strokeWidth="5"
      strokeLinecap="round"
    />
  </>
);

const SuperchargerScene = () => (
  <>
    <circle cx="300" cy="140" r="100" fill="#f6f1e7" opacity=".15" />
    <circle cx="300" cy="140" r="70" fill="#f6f1e7" opacity=".25" />
    <Bolt x={240} y={60} s={1.5} />
    <rect x="70" y="200" width="70" height="40" rx="8" fill="#f6f1e7" />
    <rect x="460" y="200" width="70" height="40" rx="8" fill="#f6f1e7" />
    <path
      d="M140 220h30M430 220h30"
      stroke="#f2a65a"
      strokeWidth="6"
      strokeLinecap="round"
    />
  </>
);

const ChooseScene = () => (
  <>
    <path
      d="M300 240v-70M300 170 170 90M300 170 430 90M300 170V70"
      stroke="#f6f1e7"
      strokeWidth="6"
      strokeLinecap="round"
      fill="none"
      opacity=".6"
    />
    {[
      [170, 90],
      [300, 60],
      [430, 90],
    ].map(([cx, cy], i) => (
      <g key={cx}>
        <circle cx={cx} cy={cy} r="34" fill={i === 1 ? "#f2a65a" : "#f6f1e7"} />
        <Bolt x={cx - 20} y={cy - 26} s={0.45} fill="#0d2b22" />
      </g>
    ))}
    <circle cx="300" cy="240" r="16" fill="#f2a65a" />
  </>
);

const NetworkScene = () => (
  <>
    {[
      [120, 90],
      [240, 60],
      [360, 110],
      [480, 70],
      [190, 200],
      [320, 220],
      [450, 190],
    ].map(([cx, cy], i, all) => (
      <g key={cx}>
        {i > 0 && (
          <path
            d={`M${all[i - 1][0]} ${all[i - 1][1]}L${cx} ${cy}`}
            stroke="#f6f1e7"
            strokeWidth="4"
            opacity=".4"
          />
        )}
      </g>
    ))}
    {[
      [120, 90],
      [240, 60],
      [360, 110],
      [480, 70],
      [190, 200],
      [320, 220],
      [450, 190],
    ].map(([cx, cy], i) => (
      <circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={i % 3 === 0 ? 24 : 16}
        fill={i % 3 === 0 ? "#f2a65a" : "#f6f1e7"}
      />
    ))}
  </>
);

const RegionScene = () => (
  <>
    <path
      d="M200 40l90-10 80 30 60 50-10 70-60 50-90 20-70-40-30-80z"
      fill="#f6f1e7"
      opacity=".9"
    />
    <path
      d="M200 40l90-10 80 30 60 50-10 70-60 50-90 20-70-40-30-80z"
      fill="none"
      stroke="#f2a65a"
      strokeWidth="4"
    />
    {[
      [250, 100, 14],
      [330, 150, 22],
      [280, 200, 10],
      [380, 100, 8],
    ].map(([cx, cy, r]) => (
      <circle
        key={`${cx}-${cy}`}
        cx={cx}
        cy={cy}
        r={r}
        fill="#0d2b22"
        opacity=".85"
      />
    ))}
    <rect x="470" y="150" width="20" height="60" rx="4" fill="#f2a65a" />
    <rect x="500" y="110" width="20" height="100" rx="4" fill="#f6f1e7" />
    <rect x="530" y="70" width="20" height="140" rx="4" fill="#f2a65a" />
  </>
);

const FleetScene = () => (
  <>
    <Car x={60} y={90} s={1.3} />
    <Car x={330} y={90} s={1.3} />
    <Car x={190} y={180} s={1} />
    <path
      d="M40 250h520"
      stroke="#f6f1e7"
      strokeWidth="4"
      opacity=".4"
      strokeLinecap="round"
    />
    <Bolt x={265} y={30} s={0.5} />
  </>
);

const DefaultScene = () => (
  <>
    <circle cx="300" cy="140" r="96" fill="#f6f1e7" opacity=".12" />
    <Plug x={240} y={130} s={1.3} />
    <Bolt x={300} y={70} s={1.4} />
  </>
);

const SCENES: Record<string, () => ReactNode> = {
  "home-ev-charging": HomeScene,
  "how-to-charge-ev": HomeScene,
  "ev-charging-costs": CoinsScene,
  "ev-home-vs-public": CoinsScene,
  "ev-charging-speed": GaugeScene,
  "ev-winter-charging": WinterScene,
  "ev-road-trip": RoadScene,
  "orlen-vs-energa": VersusScene,
  "tesla-supercharger-vs-others": SuperchargerScene,
  "choosing-charging-network": ChooseScene,
  "charging-network-comparison": NetworkScene,
  "ev-adoption-by-region": RegionScene,
  "fleet-operator-guide": FleetScene,
};

const GRADIENTS = ["#0d2b22", "#3f6a58"];

export const PostIllustration = ({
  slug,
  className = "",
  title,
}: {
  slug: string;
  className?: string;
  title?: string;
}) => {
  const Illustration = SCENES[slug] ?? DefaultScene;
  const id = `pi-${slug.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox="0 0 600 280"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      preserveAspectRatio="xMidYMid slice"
      className={`block aspect-[600/280] w-full ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={GRADIENTS[0]} />
          <stop offset="1" stopColor={GRADIENTS[1]} />
        </linearGradient>
      </defs>
      <rect width="600" height="280" fill={`url(#${id})`} />
      <circle cx="540" cy="20" r="70" fill="#f2a65a" opacity=".18" />
      <Illustration />
    </svg>
  );
};
