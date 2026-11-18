import { ShieldCheck } from "lucide-react";

import type { HomeContent } from "@/features/home/home-content";

import CountUp from "@/components/ui/CountUp";
import { Donut } from "./donut";
import { CONNECTOR_LABELS } from "./labels";
import styles from "./home.module.css";

type Insights = HomeContent["insights"];

export const RecordVisual = ({ sample }: { sample: Insights["sample"] }) => {
  if (!sample) return null;

  return (
    <div className="relative rounded-2xl border border-forest/10 bg-white p-5 shadow-lg shadow-forest/10">
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl" aria-hidden="true">
        <span className={styles.scanCard} />
      </span>
      <span className={`${styles.badgePulse} absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-sun text-forest`}>
        <ShieldCheck size={20} />
      </span>
      <p className="font-display pr-6 text-lg font-semibold leading-snug">{sample.name}</p>
      <p className="mt-1 text-sm text-forest/70">
        {sample.city} · {sample.operator}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {sample.connectors.map((connector, index) => (
          <li
            key={`${connector.type}-${index}`}
            style={{ "--d": `${index * 0.35}s` } as React.CSSProperties}
            className={`${styles.chipIn} rounded-full bg-forest px-3 py-1 text-xs font-medium text-cream`}
          >
            {CONNECTOR_LABELS[connector.type]} · {connector.powerKw} kW
          </li>
        ))}
      </ul>
    </div>
  );
};

const FLOW_PATHS = ["M118 52 C 170 52, 170 100, 218 100", "M118 148 C 170 148, 170 100, 218 100"];

export const FlowVisual = () => (
  <svg viewBox="0 0 340 200" className="w-full" fill="none" aria-hidden="true">
    {FLOW_PATHS.map((path) => (
      <g key={path}>
        <path d={path} stroke="#f6f1e7" strokeOpacity="0.2" strokeWidth="2" />
        <path d={path} stroke="#f2a65a" strokeWidth="2.5" strokeLinecap="round" className={styles.flow} />
      </g>
    ))}
    {[
      { y: 30, label: "EIPA / UDT" },
      { y: 126, label: "OpenEV Data" },
    ].map((node) => (
      <g key={node.label}>
        <rect x="8" y={node.y} width="110" height="44" rx="22" fill="#f6f1e7" fillOpacity="0.1" stroke="#f6f1e7" strokeOpacity="0.35" />
        <text x="63" y={node.y + 27} textAnchor="middle" fill="#f6f1e7" fontSize="14" fontWeight="600">
          {node.label}
        </text>
      </g>
    ))}
    <circle cx="262" cy="100" r="46" fill="#f2a65a" className={styles.hub} />
    <text x="262" y="106" textAnchor="middle" fill="#0d2b22" fontSize="16" fontWeight="700">
      EVSource
    </text>
  </svg>
);

export const ShareVisual = ({ shares }: { shares: Insights["operatorShares"] }) => {
  const shades = ["stroke-forest", "stroke-sun", "stroke-forest/60", "stroke-forest/30"];
  const total = shares.reduce((sum, item) => sum + item.share, 0);

  return (
    <div className="flex flex-wrap items-center justify-center gap-5">
      <Donut
        className="w-32 shrink-0"
        pulse
        trackClassName="stroke-forest/10"
        segments={shares.map((item, index) => ({ share: item.share, className: shades[index] }))}
      >
        <span className="text-xl font-semibold tabular-nums">
          <CountUp end={Math.round(total * 100)} />%
        </span>
      </Donut>
      <ul className="min-w-[10rem] flex-1 space-y-1.5 text-sm">
        {shares.map((item, index) => (
          <li key={item.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span
                style={{ "--i": index } as React.CSSProperties}
                className={`${styles.dotPulse} h-2.5 w-2.5 shrink-0 rounded-full ${
                  ["bg-forest", "bg-sun", "bg-forest/60", "bg-forest/30"][index]
                }`}
              />
              <span className="truncate">{item.name}</span>
            </span>
            <span className="tabular-nums text-forest/70">{Math.round(item.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
