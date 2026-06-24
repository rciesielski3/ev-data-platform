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
  <section className="hero-surface flex flex-col items-center gap-6 py-16 text-center sm:py-24">
    <span className="hero-orb hero-orb-1" aria-hidden="true" />
    <span className="hero-orb hero-orb-2" aria-hidden="true" />
    <span className="hero-orb hero-orb-3" aria-hidden="true" />
    <svg
      viewBox="0 0 200 60"
      className="pointer-events-none absolute left-1/2 top-4 -z-10 h-20 w-[min(720px,94%)] -translate-x-1/2 opacity-70 sm:top-6"
      aria-hidden="true"
    >
      <path
        className="hero-bolt-path"
        d="M10 40 L60 40 C80 40 80 20 60 20 L110 20 C130 20 130 45 150 45 L190 45"
        fill="none"
        stroke="var(--accent-deep)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <Badge>{badge}</Badge>
    <h1 className="font-display max-w-3xl text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-5xl">
      {title}
    </h1>
    <p className="muted max-w-xl text-lg">{subhead}</p>
    <div className="flex flex-wrap items-center justify-center gap-4">
      {actions}
    </div>
    {importStatusBadges && (
      <div className="flex flex-wrap gap-3 justify-center py-4">
        {importStatusBadges}
      </div>
    )}
  </section>
);

export default Hero;
