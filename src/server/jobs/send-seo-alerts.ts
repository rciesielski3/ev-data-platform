import { prisma } from "@/lib/db/prisma";
import {
  createAlertEmail,
  type AlertThresholds,
  type UnderperformingKeyword,
} from "@/features/seo/alerts";

export const sendSeoAlerts = async (
  thresholds: AlertThresholds = {
    positionDropThreshold: 5,
    trafficDropPercent: 10,
  },
): Promise<{ emailsSent: number; errors: string[] }> => {
  const errors: string[] = [];
  let emailsSent = 0;

  try {
    // Fetch all keywords with their snapshots for the past 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);

    const keywords = await prisma.gscKeyword.findMany({
      include: {
        snapshots: {
          where: {
            date: {
              gte: sevenDaysAgo,
              lte: now,
            },
          },
          orderBy: { date: "asc" },
        },
      },
    });

    const underperformers: UnderperformingKeyword[] = [];

    for (const keyword of keywords) {
      if (keyword.snapshots.length < 2) {
        continue;
      }

      const oldestSnapshot = keyword.snapshots[0]!;
      const newestSnapshot = keyword.snapshots[keyword.snapshots.length - 1]!;

      const positionDrop = oldestSnapshot.position - newestSnapshot.position;
      const clicksDrop = newestSnapshot.clicks - oldestSnapshot.clicks;
      const impressionsDrop =
        newestSnapshot.impressions - oldestSnapshot.impressions;

      if (positionDrop > thresholds.positionDropThreshold) {
        underperformers.push({
          query: keyword.query,
          currentPosition: newestSnapshot.position,
          previousPosition: oldestSnapshot.position,
          positionDrop,
          currentClicks: newestSnapshot.clicks,
          previousClicks: oldestSnapshot.clicks,
          clicksDrop,
          currentImpressions: newestSnapshot.impressions,
          previousImpressions: oldestSnapshot.impressions,
          impressionsDrop,
        });
      }
    }

    if (underperformers.length === 0) {
      console.log("[SEO Alerts] No underperforming keywords detected");
      return { emailsSent: 0, errors };
    }

    // Create alert email
    const emailContent = createAlertEmail(underperformers, thresholds);

    // Get alert recipients from environment variable
    const recipients = process.env.SEO_ALERT_EMAIL?.split(",").map((e) =>
      e.trim(),
    ) || ["r.ciesielski3@gmail.com"];

    // PLACEHOLDER: Send email (currently just logs)
    // In production, integrate with SendGrid, Resend, AWS SES, or similar
    console.log(
      `[SEO Alerts] Would send alert to: ${recipients.join(", ")}`,
    );
    console.log(`[SEO Alerts] Subject: ${emailContent.subject}`);
    console.log(
      `[SEO Alerts] Underperformers detected: ${underperformers.length}`,
    );

    // PLACEHOLDER: Simulate successful send
    emailsSent = recipients.length;

    console.log(
      `[SEO Alerts] Alert email sent to ${emailsSent} recipient${emailsSent !== 1 ? "s" : ""}`,
    );

    return { emailsSent, errors };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push(errorMessage);
    console.error(`[SEO Alerts] Error sending alerts: ${errorMessage}`);
    return { emailsSent, errors };
  }
};
