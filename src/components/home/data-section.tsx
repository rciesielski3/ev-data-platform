import { ArrowUpRight, Zap } from "lucide-react";
import Link from "next/link";

import type { HomeContent } from "@/features/home/home-content";
import { formatDisplayNumber } from "@/lib/display/data-display";

import CountUp from "@/components/ui/CountUp";
import { Donut } from "./donut";
import { CONNECTOR_LABELS } from "./labels";
import styles from "./home.module.css";

const percent = (share: number) => `${Math.round(share * 100)}%`;

export const DataSection = ({ content }: { content: HomeContent }) => {
  const { insights, locale, chargePoints } = content;
  const topCount = insights.provinces[0]?.count ?? 1;
  const segmentClasses = ["stroke-sun", "stroke-cream", "stroke-cream/45"];
  const dotClasses = ["bg-sun", "bg-cream", "bg-cream/45"];
  const maxMedian = Math.max(...insights.connectors.map((c) => c.medianPowerKw ?? 0), 1);

  return (
    <section className="page-shell pb-24">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.25fr_1fr]">
        <article data-reveal className="min-w-0 rounded-[2rem] border border-forest/10 bg-paper p-6 sm:p-8">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl font-semibold">{insights.labels.provinces}</h3>
            <p className="text-xs uppercase tracking-[0.2em] text-forest/70">{insights.labels.stations}</p>
          </div>
          <ul className="mt-6 flex flex-wrap gap-2">
            {insights.provinces.map((province, index) => {
              const tone =
                index === 0
                  ? "bg-sun text-forest"
                  : index < 4
                    ? "bg-forest text-cream"
                    : "bg-forest/10 text-forest";
              return (
                <li
                  key={province.key}
                  data-reveal
                  className="min-w-[7.5rem]"
                  style={{ flex: `${province.count} 1 ${Math.round(96 + (province.count / topCount) * 150)}px` }}
                >
                  <Link
                    href={`/stations?location=${encodeURIComponent(province.key)}`}
                    className={`${styles.mosaic} ${tone} group relative flex h-24 flex-col justify-between rounded-2xl p-3.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest`}
                  >
                    <span className="pr-5 text-xs font-medium leading-tight">{province.name}</span>
                    <ArrowUpRight
                      size={14}
                      className="absolute right-3 top-3 -translate-x-1 translate-y-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:translate-y-0 group-hover:opacity-80"
                      aria-hidden="true"
                    />
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-2xl font-semibold tabular-nums">
                        {formatDisplayNumber(province.count, locale)}
                      </span>
                      <span className="text-xs tabular-nums opacity-70">{percent(province.share)}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>

        <article data-reveal className="flex min-w-0 flex-col rounded-[2rem] bg-forest p-6 text-cream sm:p-8">
          <h3 className="font-display text-xl font-semibold">{insights.labels.connectors}</h3>
          {chargePoints && (
            <p className="mt-2 text-sm text-cream/75">
              <span className="font-semibold text-cream">{chargePoints.total}</span> {chargePoints.label} ·{" "}
              {chargePoints.split}
            </p>
          )}
          <div className="mt-6 flex flex-1 flex-col items-center gap-8 sm:flex-row lg:flex-col lg:justify-around">
            <Donut
              className="w-48 shrink-0"
              trackClassName="stroke-cream/10"
              segments={insights.connectors.map((connector, index) => ({
                share: connector.share,
                className: segmentClasses[index],
              }))}
            >
              <span className="font-display text-2xl font-semibold tabular-nums">
                <CountUp end={insights.connectorTotal} />
              </span>
            </Donut>
            <ul className="w-full space-y-5">
              {insights.connectors.map((connector, index) => (
                <li key={connector.type}>
                  <Link
                    href={`/connectors/${connector.type}`}
                    className="group -m-3 block rounded-2xl p-3 transition-colors hover:bg-cream/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-sun"
                  >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex items-center gap-2.5">
                      <span className={`h-3 w-3 rounded-full ${dotClasses[index]}`} />
                      <span className="font-display text-xl font-semibold">{CONNECTOR_LABELS[connector.type]}</span>
                      <ArrowUpRight size={16} className="opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-80" aria-hidden="true" />
                    </span>
                    <span className="tabular-nums text-cream/70">
                      {percent(connector.share)} · {formatDisplayNumber(connector.count, locale)}
                    </span>
                  </div>
                  {connector.medianPowerKw !== null && (
                    <div className="mt-2 flex items-center gap-3">
                      <Zap size={14} className="shrink-0 text-sun" aria-hidden="true" />
                      <div className="h-1.5 flex-1 rounded-full bg-cream/10">
                        <div
                          className={`${styles.bar} h-full rounded-full bg-sun`}
                          style={{ width: `${(connector.medianPowerKw / maxMedian) * 100}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm tabular-nums">{connector.medianPowerKw} kW</span>
                    </div>
                  )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </div>

      <div data-reveal className="mt-5 rounded-full border border-forest/10 bg-paper py-5">
        <p className="px-8 pb-3 text-xs font-medium uppercase tracking-[0.2em] text-forest/70">
          {insights.labels.operators}
        </p>
        <div className={styles.marquee}>
          <ul className={styles.track}>
            {[...insights.operators, ...insights.operators].map((name, index) => (
              <li
                key={`${name}-${index}`}
                aria-hidden={index >= insights.operators.length || undefined}
                className="font-display shrink-0 px-8 text-2xl font-semibold text-forest/80"
              >
                {name}
                <span className="ml-16 text-sun" aria-hidden="true">
                  ●
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
