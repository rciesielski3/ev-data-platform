export const SectionHeading = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div data-reveal className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
    <h2 className="font-display max-w-2xl text-4xl font-semibold leading-[1.02] tracking-tight sm:text-5xl">
      {title}
    </h2>
    <p className="max-w-sm text-forest/70">{subtitle}</p>
  </div>
);
