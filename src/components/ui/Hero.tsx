import type { ReactNode } from "react";

import Badge from "@/components/ui/Badge";

const Hero = ({
  badge,
  title,
  subhead,
  actions,
}: {
  badge: string;
  title: string;
  subhead: string;
  actions: ReactNode;
}) => (
  <section className="flex flex-col items-center gap-6 py-16 text-center sm:py-24">
    <Badge>{badge}</Badge>
    <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
      {title}
    </h1>
    <p className="muted max-w-xl text-lg">{subhead}</p>
    <div className="flex flex-wrap items-center justify-center gap-4">
      {actions}
    </div>
  </section>
);

export default Hero;
