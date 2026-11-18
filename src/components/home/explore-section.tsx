import Link from "next/link";

import type { HomeContent } from "@/features/home/home-content";

import { ArrowButton } from "./arrow-button";
import { CardIcon } from "./card-icon";
import { ConnectorArt } from "./connector-art";
import styles from "./home.module.css";
import { SectionHeading } from "./section-heading";

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

export const ExploreSection = ({ content }: { content: HomeContent }) => {
  const { explore } = content;
  const [featured, ...rest] = explore.items;

  return (
    <section className="page-shell pb-24 pt-10">
      <SectionHeading title={explore.title} subtitle={explore.subtitle} />
      <div className="mt-14 grid gap-5 lg:grid-cols-3 lg:grid-rows-3">
        <Link
          href={featured.href}
          data-reveal
          className={`${styles.bento} group relative overflow-hidden rounded-[2rem] bg-forest p-8 text-cream lg:col-span-1 lg:row-span-3 ${focus}`}
        >
          <CardIcon name={featured.key} tone="amber" className="mb-5" />
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-sun">{featured.eyebrow}</p>
          <h3 className="font-display mt-4 text-3xl font-semibold leading-tight">{featured.title}</h3>
          <p className="mt-3 text-cream/75">{featured.body}</p>
          <ConnectorArt className="mx-auto mt-8 w-full max-w-[17rem]" />
          <ArrowButton tone="cream" className="absolute right-6 top-6 !h-11 !w-11" />
        </Link>

        {rest.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            data-reveal
            className={`${styles.bento} group relative rounded-[2rem] border border-forest/10 bg-paper p-8 lg:col-span-2 ${focus}`}
          >
            <CardIcon name={item.key} tone="dark" className="mb-5" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest/70">{item.eyebrow}</p>
            <h3 className="font-display mt-3 text-2xl font-semibold leading-tight">{item.title}</h3>
            <p className="mt-2 max-w-lg text-forest/75">{item.body}</p>
            <ArrowButton className="absolute right-6 top-6" />
          </Link>
        ))}
      </div>
    </section>
  );
};
