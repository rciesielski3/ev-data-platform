import type { ReactNode } from "react";

const COLORS = {
  forest: "#0d2b22",
  moss: "#3f6a58",
  cream: "#f6f1e7",
  sun: "#f2a65a",
};

const BOLT = "M62 8 30 56h22l-8 36 34-50H54z";

const Bolt = ({
  x,
  y,
  s = 1,
  fill = COLORS.sun,
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
    <rect x="-22" y="-30" width="44" height="46" rx="12" fill={COLORS.cream} />
    <rect x="-10" y="-52" width="6" height="24" rx="3" fill={COLORS.cream} />
    <rect x="4" y="-52" width="6" height="24" rx="3" fill={COLORS.cream} />
    <path
      d="M0 16v24c0 14 12 18 28 18"
      stroke={COLORS.cream}
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
      fill={COLORS.cream}
    />
    <path
      d="M18 18h24v16H12zM48 18h22l12 16H48z"
      fill={COLORS.forest}
      opacity=".35"
    />
    <circle
      cx="28"
      cy="52"
      r="11"
      fill={COLORS.forest}
      stroke={COLORS.cream}
      strokeWidth="4"
    />
    <circle
      cx="96"
      cy="52"
      r="11"
      fill={COLORS.forest}
      stroke={COLORS.cream}
      strokeWidth="4"
    />
  </g>
);

const HomeScene = () => (
  <>
    <path d="M120 230V120l120-70 120 70v110z" fill={COLORS.cream} />
    <path
      d="M100 124 240 44l140 80"
      stroke={COLORS.sun}
      strokeWidth="10"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="215" y="160" width="50" height="70" rx="6" fill={COLORS.forest} />
    <rect x="410" y="110" width="56" height="96" rx="14" fill={COLORS.cream} />
    <Bolt x={402} y={118} s={0.8} />
    <path
      d="M438 206v24c0 12-14 16-30 16h-40"
      stroke={COLORS.cream}
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
        fill={COLORS.sun}
        stroke={COLORS.forest}
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
        fill={COLORS.cream}
        stroke={COLORS.forest}
        strokeWidth="3"
      />
    ))}
    <circle cx="430" cy="130" r="64" fill={COLORS.sun} />
    <circle
      cx="430"
      cy="130"
      r="50"
      fill="none"
      stroke={COLORS.forest}
      strokeWidth="4"
    />
    <Bolt x={400} y={90} s={0.6} fill={COLORS.forest} />
    <path
      d="M90 240h420"
      stroke={COLORS.cream}
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
      stroke={COLORS.cream}
      strokeWidth="26"
      strokeLinecap="round"
      fill="none"
      opacity=".25"
    />
    <path
      d="M130 220a170 170 0 0 1 250-150"
      stroke={COLORS.sun}
      strokeWidth="26"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M300 220 380 110"
      stroke={COLORS.cream}
      strokeWidth="10"
      strokeLinecap="round"
    />
    <circle cx="300" cy="220" r="20" fill={COLORS.cream} />
    <Bolt x={270} y={130} s={0.45} />
    <path
      d="M110 250h380"
      stroke={COLORS.cream}
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
        fill={COLORS.cream}
        opacity=".7"
      />
    ))}
    <g
      transform="translate(300 120)"
      stroke={COLORS.cream}
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
      fill={COLORS.cream}
      opacity=".85"
    />
  </>
);

const RoadScene = () => (
  <>
    <path
      d="M40 250c120-20 100-110 230-110s110 90 290-70"
      stroke={COLORS.cream}
      strokeWidth="22"
      strokeLinecap="round"
      fill="none"
      opacity=".25"
    />
    <path
      d="M40 250c120-20 100-110 230-110s110 90 290-70"
      stroke={COLORS.sun}
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
        <circle cx={cx} cy={cy} r="24" fill={COLORS.cream} />
        <Bolt x={cx - 14} y={cy - 18} s={0.35} fill={COLORS.forest} />
      </g>
    ))}
    <Car x={50} y={150} s={0.8} />
  </>
);

const VersusScene = () => (
  <>
    <rect x="90" y="60" width="170" height="170" rx="28" fill={COLORS.cream} />
    <rect x="340" y="60" width="170" height="170" rx="28" fill={COLORS.sun} />
    <Bolt x={118} y={98} s={1.1} fill={COLORS.forest} />
    <Plug x={425} y={135} s={1.2} />
    <circle
      cx="300"
      cy="145"
      r="30"
      fill={COLORS.forest}
      stroke={COLORS.cream}
      strokeWidth="5"
    />
    <path
      d="M286 133l28 24M314 133l-28 24"
      stroke={COLORS.cream}
      strokeWidth="5"
      strokeLinecap="round"
    />
  </>
);

const SuperchargerScene = () => (
  <>
    <circle cx="300" cy="140" r="100" fill={COLORS.cream} opacity=".15" />
    <circle cx="300" cy="140" r="70" fill={COLORS.cream} opacity=".25" />
    <Bolt x={240} y={60} s={1.5} />
    <rect x="70" y="200" width="70" height="40" rx="8" fill={COLORS.cream} />
    <rect x="460" y="200" width="70" height="40" rx="8" fill={COLORS.cream} />
    <path
      d="M140 220h30M430 220h30"
      stroke={COLORS.sun}
      strokeWidth="6"
      strokeLinecap="round"
    />
  </>
);

const ChooseScene = () => (
  <>
    <path
      d="M300 240v-70M300 170 170 90M300 170 430 90M300 170V70"
      stroke={COLORS.cream}
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
        <circle
          cx={cx}
          cy={cy}
          r="34"
          fill={i === 1 ? COLORS.sun : COLORS.cream}
        />
        <Bolt x={cx - 20} y={cy - 26} s={0.45} fill={COLORS.forest} />
      </g>
    ))}
    <circle cx="300" cy="240" r="16" fill={COLORS.sun} />
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
            stroke={COLORS.cream}
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
        fill={i % 3 === 0 ? COLORS.sun : COLORS.cream}
      />
    ))}
  </>
);

const RegionScene = () => (
  <>
    <path
      d="M200 40l90-10 80 30 60 50-10 70-60 50-90 20-70-40-30-80z"
      fill={COLORS.cream}
      opacity=".9"
    />
    <path
      d="M200 40l90-10 80 30 60 50-10 70-60 50-90 20-70-40-30-80z"
      fill="none"
      stroke={COLORS.sun}
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
        fill={COLORS.forest}
        opacity=".85"
      />
    ))}
    <rect x="470" y="150" width="20" height="60" rx="4" fill={COLORS.sun} />
    <rect x="500" y="110" width="20" height="100" rx="4" fill={COLORS.cream} />
    <rect x="530" y="70" width="20" height="140" rx="4" fill={COLORS.sun} />
  </>
);

const FleetScene = () => (
  <>
    <Car x={60} y={90} s={1.3} />
    <Car x={330} y={90} s={1.3} />
    <Car x={190} y={180} s={1} />
    <path
      d="M40 250h520"
      stroke={COLORS.cream}
      strokeWidth="4"
      opacity=".4"
      strokeLinecap="round"
    />
    <Bolt x={265} y={30} s={0.5} />
  </>
);

const HowToScene = () => (
  <>
    <Car x={70} y={140} s={1.7} />
    <path
      d="M250 200c40 40 80 20 110-10"
      stroke={COLORS.cream}
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
    />
    <Plug x={400} y={150} s={1.5} />
    {[0, 1, 2].map((i) => (
      <circle
        key={i}
        cx={250 + i * 50}
        cy="50"
        r="15"
        fill={i === 2 ? COLORS.sun : COLORS.cream}
        opacity={i === 2 ? 1 : 0.8}
      />
    ))}
    <path
      d="M270 50h10M320 50h10"
      stroke={COLORS.cream}
      strokeWidth="4"
      strokeLinecap="round"
    />
  </>
);

const HomeVsPublicScene = () => (
  <>
    <path d="M60 230V140l80-50 80 50v90z" fill={COLORS.cream} />
    <path
      d="M44 144 140 80l96 64"
      stroke={COLORS.sun}
      strokeWidth="8"
      strokeLinecap="round"
      fill="none"
    />
    <rect x="118" y="180" width="44" height="50" rx="6" fill={COLORS.forest} />
    <path
      d="M300 40v200"
      stroke={COLORS.cream}
      strokeWidth="4"
      strokeDasharray="10 12"
      strokeLinecap="round"
      opacity=".5"
    />
    <circle cx="300" cy="140" r="22" fill={COLORS.sun} />
    <Bolt x={288} y={124} s={0.4} fill={COLORS.forest} />
    <rect
      x="360"
      y="150"
      width="40"
      height="80"
      fill={COLORS.cream}
      opacity=".35"
    />
    <rect
      x="500"
      y="130"
      width="50"
      height="100"
      fill={COLORS.cream}
      opacity=".25"
    />
    <rect x="420" y="110" width="56" height="120" rx="14" fill={COLORS.cream} />
    <rect
      x="432"
      y="124"
      width="32"
      height="22"
      rx="4"
      fill={COLORS.forest}
      opacity=".4"
    />
    <Bolt x={418} y={146} s={0.8} />
    <path
      d="M448 230v-10"
      stroke={COLORS.cream}
      strokeWidth="6"
      strokeLinecap="round"
    />
  </>
);

const DefaultScene = () => (
  <>
    <circle cx="300" cy="140" r="96" fill={COLORS.cream} opacity=".12" />
    <Plug x={240} y={130} s={1.3} />
    <Bolt x={300} y={70} s={1.4} />
  </>
);

const SCENES: Record<string, () => ReactNode> = {
  "home-ev-charging": HomeScene,
  "how-to-charge-ev": HowToScene,
  "ev-charging-costs": CoinsScene,
  "ev-home-vs-public": HomeVsPublicScene,
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

export const PostIllustration = ({
  slug,
  className = "",
}: {
  slug: string;
  className?: string;
}) => {
  const Illustration = SCENES[slug] ?? DefaultScene;
  const id = `pi-${slug.replace(/[^a-z0-9]/gi, "")}`;
  return (
    <svg
      viewBox="0 0 600 280"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className={`block aspect-[600/280] w-full ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={COLORS.forest} />
          <stop offset="1" stopColor={COLORS.moss} />
        </linearGradient>
      </defs>
      <rect width="600" height="280" fill={`url(#${id})`} />
      <circle cx="540" cy="20" r="70" fill={COLORS.sun} opacity=".18" />
      <Illustration />
    </svg>
  );
};
