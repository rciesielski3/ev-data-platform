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
  <Card as="section" className="mt-8 mb-8 bg-gray-50">
    <div className="mb-4">
      <h3 className="text-lg font-semibold text-slate-900">{heading}</h3>
      <p className="muted mt-1 text-sm">{description}</p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {analysisGroupLabel}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryActionHref}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            {primaryActionLabel}
          </Link>
          <Link
            href={secondaryActionHref}
            className="rounded-md border border-emerald-600 bg-white px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
          >
            {secondaryActionLabel}
          </Link>
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-600">
          {exportGroupLabel}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={exportCsvHref}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {exportCsvLabel}
          </a>
          <a
            href={exportJsonHref}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {exportJsonLabel}
          </a>
        </div>
      </div>
    </div>
  </Card>
);
