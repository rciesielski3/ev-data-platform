import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import Button from "@/components/ui/Button";
import type { HomeContent } from "@/features/home/home-content";

export const B2bSection = ({ content }: { content: HomeContent }) => {
  const { b2b } = content;

  return (
    <section className="page-shell !px-3 sm:!px-6">
      <div data-reveal className="rounded-[2rem] bg-sun p-8 sm:rounded-[3rem] sm:p-16">
        <h2 className="font-display max-w-3xl text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          {b2b.title}
        </h2>
        <p className="mt-5 max-w-xl text-lg text-forest/80">{b2b.body}</p>
        <Button as={Link} href={b2b.cta.href} variant="primary" size="lg" className="group mt-8 hover:!bg-cream">
          {b2b.cta.label}
          <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Button>
      </div>
    </section>
  );
};
