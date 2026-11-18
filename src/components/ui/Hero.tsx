import type { ReactNode } from "react";

import Badge from "@/components/ui/Badge";

const Hero = ({
  badge,
  title,
  subhead,
  actions,
  importStatusBadges,
}: {
  badge: string;
  title: string;
  subhead: string;
  actions: ReactNode;
  importStatusBadges?: ReactNode;
}) => (
  <section className="page-shell flex flex-col items-center gap-6 pb-12 pt-14 text-center sm:pb-16 sm:pt-20">
    <Badge>{badge}</Badge>
    <h1 className="font-display max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-forest sm:text-6xl">
      {title}
    </h1>
    <p className="muted max-w-2xl text-lg">{subhead}</p>
    {importStatusBadges && (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {importStatusBadges}
      </div>
    )}

    <div className="mt-2 flex flex-wrap items-center justify-center gap-4">
      {actions}
    </div>
  </section>
);

export default Hero;
