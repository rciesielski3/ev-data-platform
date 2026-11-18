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
    <main className="page-shell pb-20 pt-12 sm:pt-16">
      <PageHeader title={t("title")} description={t("description")} />
      <section className="mb-12 grid gap-4 sm:grid-cols-3">
        <Card className="group p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-sun transition-transform duration-300 motion-safe:group-hover:-rotate-6">
            <FileBarChart className="h-[22px] w-[22px]" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-forest">
            {t("overviewCustomReportsTitle")}
          </h3>

          <p className="muted mt-1 text-sm">
            {t("overviewCustomReportsDescription")}
          </p>
        </Card>

        <Card className="group p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-sun transition-transform duration-300 motion-safe:group-hover:-rotate-6">
            <Link2 className="h-[22px] w-[22px]" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-forest">
            {t("overviewFeaturedListingsTitle")}
          </h3>

          <p className="muted mt-1 text-sm">
            {t("overviewFeaturedListingsDescription")}
          </p>
        </Card>

        <Card className="group p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest text-sun transition-transform duration-300 motion-safe:group-hover:-rotate-6">
            <MessageSquare className="h-[22px] w-[22px]" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-forest">{t("overviewFastResponseTitle")}</h3>

          <p className="muted mt-1 text-sm">
            {t("overviewFastResponseDescription")}
          </p>
        </Card>
      </section>

      {submitted === "true" ? (
        <div className="mx-auto max-w-2xl">
        <Notice title={t("successTitle")} tone="success">
          <p className="muted mt-2">{t("successBody")}</p>
        </Notice>
        </div>
      ) : (
        <Card as="form" action={submitLead} className="mx-auto max-w-2xl space-y-6 p-6 sm:p-10">
          {error === "invalid" && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {t("validationErrorNotice")}
            </p>
          )}

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-forest">{t("nameLabel")}</span>
            <input type="text" name="name" className="field-control" />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-forest">
              {t("emailLabel")}
            </span>
            <input
              type="email"
              name="email"
              required
              className="field-control"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-forest">
              {t("companyLabel")}
            </span>
            <input type="text" name="company" className="field-control" />
          </label>

          <fieldset className="flex flex-col space-y-3 text-sm">
            <legend className="mb-1 font-medium text-forest">
              {t("interestLabel")}
            </legend>
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-forest/15 bg-paper p-4 transition-colors duration-200 hover:border-forest/40 has-[:checked]:border-forest has-[:checked]:bg-sun/20 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest">
              <input
                type="radio"
                name="interest"
                value="REPORT"
                required
                defaultChecked={interest === "REPORT" || !interest}
                className="mt-1 h-4 w-4 accent-forest"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-forest">
                  <FileBarChart className="h-4 w-4 text-forest" />
                  {t("interestReportLabel")}
                </span>

                <span className="block text-forest/70">
                  {t("interestReportDescription")}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-forest/15 bg-paper p-4 transition-colors duration-200 hover:border-forest/40 has-[:checked]:border-forest has-[:checked]:bg-sun/20 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest">
              <input
                type="radio"
                name="interest"
                value="FEATURED_LISTING"
                defaultChecked={interest === "FEATURED_LISTING"}
                className="mt-1 h-4 w-4 accent-forest"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-forest">
                  <Link2 className="h-4 w-4 text-forest" />
                  {t("interestFeaturedListingLabel")}
                </span>
                <span className="block text-forest/70">
                  {t("interestFeaturedListingDescription")}
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-forest/15 bg-paper p-4 transition-colors duration-200 hover:border-forest/40 has-[:checked]:border-forest has-[:checked]:bg-sun/20 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest">
              <input
                type="radio"
                name="interest"
                value="BOTH"
                defaultChecked={interest === "BOTH"}
                className="mt-1 h-4 w-4 accent-forest"
              />
              <span className="flex-1">
                <span className="flex items-center gap-2 font-medium text-forest">
                  <Package className="h-4 w-4 text-forest" />
                  {t("interestBothLabel")}
                </span>
                <span className="block text-forest/70">
                  {t("interestBothDescription")}
                </span>
              </span>
            </label>
          </fieldset>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-forest">
              {t("messageLabel")}
            </span>
            <textarea name="message" rows={4} className="field-control" />
          </label>

          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
            {t("submitButton")}
          </Button>

          <p className="muted text-xs">{t("privacyNote")}</p>
        </Card>
      )}
    </main>
  );
}
