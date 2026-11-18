import Link from "next/link";

import type { HomeContent } from "@/features/home/home-content";

import { ArrowButton } from "./arrow-button";
import { CardIcon } from "./card-icon";
import styles from "./home.module.css";
import { SectionHeading } from "./section-heading";

export const AnalysisSection = ({ content }: { content: HomeContent }) => {
  const { analysis } = content;

  return (
    <section className="page-shell pb-24">
      <SectionHeading title={analysis.title} subtitle={analysis.subtitle} />
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {analysis.items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            data-reveal
            className={`${styles.bento} flex items-center justify-between gap-6 rounded-full border border-forest/15 bg-paper px-8 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest`}
          >
            <span className="flex min-w-0 items-center gap-4">
              <CardIcon name={item.key} tone="dark" />
              <span className="min-w-0">
                <span className="font-display block text-xl font-semibold">{item.title}</span>
                <span className="mt-1 block text-sm text-forest/70">{item.body}</span>
              </span>
            </span>
            <ArrowButton />
          </Link>
        ))}
      </div>
    </section>
  );
};
