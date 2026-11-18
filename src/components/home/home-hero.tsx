import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import Button from "@/components/ui/Button";
import CountUp from "@/components/ui/CountUp";
import type { HomeContent } from "@/features/home/home-content";

import { DotMap } from "./dot-map";
import { Freshness } from "./freshness";
import styles from "./home.module.css";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as React.CSSProperties;

export const HomeHero = ({ content }: { content: HomeContent }) => {
  const { hero, stats, freshness, snapshotNote, stationMap } = content;

  return (
    <section className="page-shell mt-4 !px-3 sm:mt-6 sm:!px-6">
      <div className="relative flex flex-col overflow-hidden rounded-[2rem] bg-forest p-8 text-cream sm:rounded-[3rem] sm:p-12 lg:p-14">
        <div className="grid flex-1 items-center gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10">
            <p
              style={delay(0)}
              className={`${styles.enter} inline-flex rounded-full border border-cream/25 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-sun`}
            >
              {hero.badge}
            </p>
            <h1
              style={delay(120)}
              className={`${styles.enter} font-display mt-7 text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl xl:text-6xl`}
            >
              {hero.headline}
            </h1>
            <p style={delay(260)} className={`${styles.enter} mt-6 max-w-lg text-lg leading-relaxed text-cream/75`}>
              {hero.subhead}
            </p>
            <div style={delay(400)} className={`${styles.enter} mt-9 flex flex-wrap gap-3`}>
              <Button as={Link} href={hero.primary.href} variant="cta" size="lg" className="group">
                {hero.primary.label}
                <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Button>
              <Button as={Link} href={hero.secondary.href} variant="inverse" size="lg">
                {hero.secondary.label}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className={styles.parallax}>
              <div className={styles.drift}>
                <DotMap
                  map={stationMap}
                  minRadius={2.4}
                  maxRadius={11}
                  dotClassName={styles.dot}
                  hotClassName={styles.hot}
                  hotThreshold={0.5}
                  staggerSeconds={1.8}
                  beaconCount={18}
                  className="mx-auto w-full max-w-lg"
                />
              </div>
            </div>
            <div className={`${styles.chip} absolute left-0 top-6 rounded-2xl bg-cream px-5 py-3 text-forest shadow-xl sm:-left-4`}>
              <p className="font-display text-3xl font-semibold">
                <CountUp end={stats[0].numeric ?? 0} />
              </p>
              <p className="text-xs text-forest/70">{stats[0].label}</p>
            </div>
            <div className={`${styles.chipLate} absolute bottom-4 right-0 rounded-2xl bg-sun px-5 py-3 text-forest shadow-xl sm:-right-2`}>
              <p className="font-display text-3xl font-semibold">
                <CountUp end={stats[1].numeric ?? 0} />
              </p>
              <p className="text-xs text-forest">{stats[1].label}</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Freshness items={freshness} />
          {snapshotNote && <p className="text-xs text-cream/60">{snapshotNote}</p>}
        </div>
      </div>
    </section>
  );
};
