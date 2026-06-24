import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { createLeadSubmission } from "@/lib/db/lead-submissions";
import { leadSubmissionSchema } from "@/lib/validators/lead-submission";

export const dynamic = "force-dynamic";

const submitLead = async (formData: FormData) => {
  "use server";

  const parsed = leadSubmissionSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    interest: formData.get("interest"),
    message: formData.get("message") || undefined,
  });

  if (!parsed.success) {
    redirect("/contact?error=invalid");
  }

  const lead = await createLeadSubmission(parsed.data);

  if (parsed.data.interest === "FEATURED_LISTING" || parsed.data.interest === "BOTH") {
    try {
      await fetch("/api/webhooks/lead-submitted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          name: lead.name,
          email: lead.email,
          company: lead.company,
          interest: lead.interest,
          message: lead.message,
          submittedAt: lead.createdAt,
        }),
      });
    } catch (error) {
      console.error("Failed to post lead to webhook:", error);
    }
  }

  redirect("/contact?submitted=true");
};

const inputClassName =
  "rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{
    submitted?: string;
    error?: string;
    interest?: string;
  }>;
}) {
  const { submitted, error, interest } = await searchParams;
  const t = await getTranslations("contact");

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <PageHeader title={t("title")} description={t("description")} />

      {submitted === "true" ? (
        <Notice title={t("successTitle")}>
          <p className="muted mt-2">{t("successBody")}</p>
        </Notice>
      ) : (
        <Card as="form" action={submitLead} className="space-y-5">
          {error === "invalid" && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("validationErrorNotice")}
            </p>
          )}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t("nameLabel")}</span>
            <input type="text" name="name" className={inputClassName} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t("emailLabel")}</span>
            <input type="email" name="email" required className={inputClassName} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t("companyLabel")}</span>
            <input type="text" name="company" className={inputClassName} />
          </label>

          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="font-medium text-slate-700">{t("interestLabel")}</legend>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="interest"
                value="REPORT"
                required
                defaultChecked={interest === "REPORT" || !interest}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {t("interestReportLabel")}
                </span>
                <span className="block text-slate-500">
                  {t("interestReportDescription")}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="interest"
                value="FEATURED_LISTING"
                defaultChecked={interest === "FEATURED_LISTING"}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {t("interestFeaturedListingLabel")}
                </span>
                <span className="block text-slate-500">
                  {t("interestFeaturedListingDescription")}
                </span>
              </span>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="interest"
                value="BOTH"
                defaultChecked={interest === "BOTH"}
                className="mt-1"
              />
              <span>
                <span className="block font-medium text-slate-900">
                  {t("interestBothLabel")}
                </span>
                <span className="block text-slate-500">
                  {t("interestBothDescription")}
                </span>
              </span>
            </label>
          </fieldset>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">{t("messageLabel")}</span>
            <textarea name="message" rows={4} className={inputClassName} />
          </label>

          <Button type="submit">{t("submitButton")}</Button>

          <p className="muted text-xs">{t("privacyNote")}</p>
        </Card>
      )}
    </main>
  );
}
