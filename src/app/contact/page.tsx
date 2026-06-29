import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import { createLeadSubmission } from "@/lib/db/lead-submissions";
import { leadSubmissionSchema } from "@/lib/validators/lead-submission";
import { FileBarChart, Link2, MessageSquare, Package } from "lucide-react";

export const dynamic = "force-dynamic";

const notifySlackFeaturedLead = async (
  leadId: string,
  name: string | null,
  email: string,
  company: string | null,
  interest: string,
  message: string | null,
  submittedAt: Date,
) => {
  if (!process.env.SLACK_WEBHOOK_FEATURED_LEADS) {
    console.log(
      "SLACK_WEBHOOK_FEATURED_LEADS not configured, skipping Slack notification",
    );
    return;
  }

  const slackMessage = {
    text: "Featured Listing Lead Submitted",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔗 Featured Listing Lead Submitted",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Operator:*\n${name || "(not provided)"}`,
          },
          {
            type: "mrkdwn",
            text: `*Email:*\n${email}`,
          },
          {
            type: "mrkdwn",
            text: `*Company:*\n${company || "(not provided)"}`,
          },
          {
            type: "mrkdwn",
            text: `*Interest:*\n${interest}`,
          },
        ],
      },
      ...(message
        ? [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Message:*\n${message}`,
              },
            },
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Lead ID: ${leadId} | Submitted: ${new Date(submittedAt).toLocaleString()}`,
          },
        ],
      },
    ],
  };

  try {
    const slackResponse = await fetch(
      process.env.SLACK_WEBHOOK_FEATURED_LEADS,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      },
    );

    if (!slackResponse.ok) {
      const slackError = await slackResponse.text();
      console.error("Slack webhook error:", slackError);
    }
  } catch (error) {
    console.error("Failed to notify Slack:", error);
  }
};

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

  if (
    parsed.data.interest === "FEATURED_LISTING" ||
    parsed.data.interest === "BOTH"
  ) {
    await notifySlackFeaturedLead(
      lead.id,
      lead.name,
      lead.email,
      lead.company,
      lead.interest,
      lead.message,
      lead.createdAt,
    );
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
      <section className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card className="border border-[var(--card-border)] bg-emerald-50">
          <FileBarChart className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="font-medium mt-3">
            {t("overviewCustomReportsTitle")}
          </h3>

          <p className="muted mt-1 text-sm">
            {t("overviewCustomReportsDescription")}
          </p>
        </Card>

        <Card className="border border-[var(--card-border)] bg-emerald-50">
          <Link2 className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="font-medium mt-3">
            {t("overviewFeaturedListingsTitle")}
          </h3>

          <p className="muted mt-1 text-sm">
            {t("overviewFeaturedListingsDescription")}
          </p>
        </Card>

        <Card className="border border-[var(--card-border)] bg-emerald-50">
          <MessageSquare className="h-5 w-5 text-[var(--accent)]" />
          <h3 className="font-medium mt-3">{t("overviewFastResponseTitle")}</h3>

          <p className="muted mt-1 text-sm">
            {t("overviewFastResponseDescription")}
          </p>
        </Card>
      </section>

      {submitted === "true" ? (
        <Notice title={t("successTitle")} tone="success">
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
            <span className="font-medium text-slate-700">
              {t("emailLabel")}
            </span>
            <input
              type="email"
              name="email"
              required
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              {t("companyLabel")}
            </span>
            <input type="text" name="company" className={inputClassName} />
          </label>

          <fieldset className="flex flex-col space-y-3 text-sm">
            <legend className="font-medium text-slate-700">
              {t("interestLabel")}
            </legend>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-[var(--card-border)] p-4 bg-emerald-50">
              <input
                type="radio"
                name="interest"
                value="REPORT"
                required
                defaultChecked={interest === "REPORT" || !interest}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <FileBarChart className="h-4 w-4 text-emerald-600" />
                  {t("interestReportLabel")}
                </span>

                <span className="block text-slate-500">
                  {t("interestReportDescription")}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-[var(--card-border)] p-4 bg-emerald-50">
              <input
                type="radio"
                name="interest"
                value="FEATURED_LISTING"
                defaultChecked={interest === "FEATURED_LISTING"}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <Link2 className="h-4 w-4 text-emerald-600" />
                  {t("interestFeaturedListingLabel")}
                </span>
                <span className="block text-slate-500">
                  {t("interestFeaturedListingDescription")}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-lg border border-[var(--card-border)] p-4 bg-emerald-50">
              <input
                type="radio"
                name="interest"
                value="BOTH"
                defaultChecked={interest === "BOTH"}
                className="mt-1"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-slate-900">
                  <Package className="h-4 w-4 text-emerald-600" />
                  {t("interestBothLabel")}
                </span>
                <span className="block text-slate-500">
                  {t("interestBothDescription")}
                </span>
              </span>
            </label>
          </fieldset>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">
              {t("messageLabel")}
            </span>
            <textarea name="message" rows={4} className={inputClassName} />
          </label>

          <Button type="submit" variant="cta" size="lg">
            {t("submitButton")}
          </Button>

          <p className="muted text-xs">{t("privacyNote")}</p>
        </Card>
      )}
    </main>
  );
}
