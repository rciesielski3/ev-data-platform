import Link from "next/link";
import { Bookmark, BadgeCheck, Check, Eye, ShieldCheck, TrendingUp, Zap, type LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Hero from "@/components/ui/Hero";

export const revalidate = 3600;

const IconTile = ({
  Icon,
  tone = "forest",
}: {
  Icon: LucideIcon;
  tone?: "forest" | "sun";
}) => (
  <div
    className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 motion-safe:group-hover:-rotate-6 ${
      tone === "forest" ? "bg-forest text-sun" : "bg-sun text-forest"
    }`}
  >
    <Icon className="h-[22px] w-[22px]" />
  </div>
);

export default async function OperatorFeaturedPage() {
  const t = await getTranslations("operatorFeatured");

  const included = [
    { Icon: TrendingUp, title: t("whatsIncluded1Title"), body: t("whatsIncluded1Body") },
    { Icon: Bookmark, title: t("whatsIncluded2Title"), body: t("whatsIncluded2Body") },
    { Icon: BadgeCheck, title: t("whatsIncluded3Title"), body: t("whatsIncluded3Body") },
  ];

  const values = [
    { Icon: Eye, title: t("visibilityTitle"), body: t("visibilityBody") },
    { Icon: ShieldCheck, title: t("trustTitle"), body: t("trustBody") },
    { Icon: Zap, title: t("simpleTitle"), body: t("simpleBody") },
  ];

  const pricingFeatures = [
    t("pricingFeature1"),
    t("pricingFeature2"),
    t("pricingFeature3"),
    t("pricingFeature4"),
    t("pricingFeature5"),
  ];

  return (
    <main className="flex flex-1 flex-col">
      <Hero
        badge={t("heroBadge")}
        title={t("heroTitle")}
        subhead={t("heroSubtitle")}
        actions={
          <Button
            as={Link}
            href="/contact?interest=FEATURED_LISTING"
            variant="primary"
            size="lg"
          >
            {t("ctaButton")}
          </Button>
        }
      />

      <section className="page-shell pb-8">
        <div className="grid gap-6 md:grid-cols-3">
          {included.map(({ Icon, title, body }) => (
            <div key={title} className="card group p-7">
              <IconTile Icon={Icon} />
              <h3 className="mt-5 font-display text-lg font-semibold tracking-tight text-forest">
                {title}
              </h3>
              <p className="muted mt-2 text-sm">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl">
          {t("valuePropsTitle")}
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {values.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="card group flex h-full flex-col p-7 transition-all duration-300 motion-safe:hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
            >
              <IconTile Icon={Icon} tone="sun" />
              <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-forest">
                {title}
              </h3>
              <p className="muted mt-2 flex-1 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell pb-16 sm:pb-24">
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-semibold tracking-tight text-forest sm:text-4xl">
          {t("pricingTitle")}
        </h2>

        <div className="mx-auto mt-12 max-w-md">
          <div className="relative overflow-hidden rounded-[2rem] bg-forest p-8 text-cream shadow-[var(--shadow-lift)] sm:p-10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-sun" />
            <div className="text-center">
              <div className="font-display text-6xl font-semibold tracking-tight">
                290 <span className="text-2xl font-normal text-cream/70">zł</span>
              </div>
              <p className="mt-3 text-sm font-medium uppercase tracking-wider text-cream/70">
                {t("pricingPeriod")}
              </p>
            </div>

            <ul className="mt-8 space-y-4 border-t border-cream/15 pt-8">
              {pricingFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun text-forest">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span className="text-cream/90">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              as={Link}
              href="/contact?interest=FEATURED_LISTING"
              variant="cta"
              size="lg"
              className="mt-8 w-full"
            >
              {t("ctaButton")}
            </Button>
          </div>
        </div>
      </section>

      <section className="page-shell pb-20">
        <div className="card mx-auto max-w-3xl p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-forest sm:text-3xl">
            {t("nextStepsTitle")}
          </h2>
          <p className="muted mt-4 leading-relaxed">{t("nextStepsBody")}</p>

          <p className="mt-6 border-t border-forest/10 pt-5 text-sm font-medium uppercase tracking-wider text-forest/70">
            Gotowy do rozpoczęcia?
          </p>
        </div>
      </section>
    </main>
  );
}
