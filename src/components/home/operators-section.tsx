import Link from "next/link";

import type { HomeContent } from "@/features/home/home-content";

import { ArrowButton } from "./arrow-button";
import { CardIcon } from "./card-icon";
import styles from "./home.module.css";
import { SectionHeading } from "./section-heading";

export const OperatorsSection = ({ content }: { content: HomeContent }) => {
  const { operators } = content;

  return (
    <section className="page-shell py-24">
      <SectionHeading title={operators.title} subtitle={operators.subtitle} />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {operators.items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            data-reveal
            className={`${styles.bento} group relative rounded-[2rem] border border-forest/10 bg-paper p-8 pr-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest`}
          >
            <CardIcon name={item.key} tone="dark" className="mb-5" />
            <h3 className="font-display text-xl font-semibold">{item.title}</h3>
            <p className="mt-3 text-forest/75">{item.body}</p>
            <ArrowButton className="absolute right-6 top-6" />
          </Link>
        ))}
      </div>
    </section>
  );
};
