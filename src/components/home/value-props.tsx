import type { HomeContent } from "@/features/home/home-content";

import styles from "./home.module.css";
import { SectionHeading } from "./section-heading";
import { FlowVisual, RecordVisual, ShareVisual } from "./value-visuals";

export const ValueProps = ({ content }: { content: HomeContent }) => {
  const { valueProps, insights } = content;
  const [quality, normalized, benchmark] = valueProps.items;
  const card = `${styles.valueCard} flex min-w-0 flex-col rounded-[2rem] p-7`;
  const stage = "flex min-h-52 items-center justify-center rounded-2xl p-4";

  return (
    <section className="page-shell py-24">
      <SectionHeading title={valueProps.title} subtitle={valueProps.subtitle} />
      <div className="mt-14 grid gap-5 lg:grid-cols-3">
        <article data-reveal className={`${card} border border-forest/10 bg-paper`}>
          <div className={`${stage} bg-forest/[0.04]`}>
            <RecordVisual sample={insights.sample} />
          </div>
          <h3 className="font-display mt-8 text-2xl font-semibold leading-tight">{quality.title}</h3>
          <p className="mt-3 leading-relaxed text-forest/75">{quality.body}</p>
        </article>

        <article data-reveal className={`${card} bg-forest text-cream lg:translate-y-8`}>
          <div className={`${stage} bg-cream/[0.06]`}>
            <FlowVisual />
          </div>
          <h3 className="font-display mt-8 text-2xl font-semibold leading-tight">{normalized.title}</h3>
          <p className="mt-3 leading-relaxed text-cream/75">{normalized.body}</p>
        </article>

        <article data-reveal className={`${card} border border-forest/10 bg-paper`}>
          <div className={`${stage} bg-forest/[0.04]`}>
            <ShareVisual shares={insights.operatorShares} />
          </div>
          <h3 className="font-display mt-8 text-2xl font-semibold leading-tight">{benchmark.title}</h3>
          <p className="mt-3 leading-relaxed text-forest/75">{benchmark.body}</p>
        </article>
      </div>
    </section>
  );
};
