import Link from "next/link";

import Card from "@/components/ui/Card";

type ActionSectionProps = {
  heading: string;
  description: string;
  analysisGroupLabel: string;
  exportGroupLabel: string;
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
  exportCsvLabel: string;
  exportCsvHref: string;
  exportJsonLabel: string;
  exportJsonHref: string;
};

export const ActionSection = ({
  heading,
  description,
  analysisGroupLabel,
  exportGroupLabel,
  primaryActionLabel,
  primaryActionHref,
  secondaryActionLabel,
  secondaryActionHref,
  exportCsvLabel,
  exportCsvHref,
  exportJsonLabel,
  exportJsonHref,
}: ActionSectionProps) => (
  <Card as="section" className="mt-8 mb-8 bg-forest/5">
    <div className="mb-4">
      <h3 className="font-display text-xl font-semibold tracking-tight text-forest">{heading}</h3>
      <p className="muted mt-1 text-sm">{description}</p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest/70">
          {analysisGroupLabel}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryActionHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun bg-forest text-cream hover:bg-sun hover:text-forest"
          >
            {primaryActionLabel}
          </Link>
          <Link
            href={secondaryActionHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun border border-forest/30 bg-paper text-forest hover:border-forest hover:bg-sun"
          >
            {secondaryActionLabel}
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-forest/70">
          {exportGroupLabel}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={exportCsvHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun border border-forest/20 bg-paper text-forest hover:border-forest hover:bg-forest/5"
          >
            {exportCsvLabel}
          </a>
          <a
            href={exportJsonHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sun border border-forest/20 bg-paper text-forest hover:border-forest hover:bg-forest/5"
          >
            {exportJsonLabel}
          </a>
        </div>
      </div>
    </div>
  </Card>
);
