import { IngestionStatus } from "@prisma/client";

export const notifyImportFailure = async (
  source: string,
  status: IngestionStatus,
  errorMessage?: string,
  recordsFailed?: number,
): Promise<void> => {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    console.log(`[Slack] No webhook URL configured; skipping notification for ${source} import`);
    return;
  }

  if (status !== IngestionStatus.FAILED && status !== IngestionStatus.PARTIAL) {
    return;
  }

  const statusText = status === IngestionStatus.FAILED ? "FAILED" : "PARTIAL";
  const color = status === IngestionStatus.FAILED ? "danger" : "warning";

  let failureDetails = "";
  if (recordsFailed !== undefined && recordsFailed > 0) {
    failureDetails += `${recordsFailed} records failed | `;
  }
  if (errorMessage) {
    failureDetails += `Error: ${errorMessage}`;
  }

  const message = {
    attachments: [
      {
        fallback: `${source} import ${statusText}`,
        color,
        title: `${source} import ${statusText}`,
        text: failureDetails.trim() || "No additional details",
        footer: "EVSource Import Pipeline",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      console.error(
        `[Slack] Failed to send notification: ${response.status} ${response.statusText}`,
      );
    } else {
      console.log(`[Slack] Notification sent for ${source} import ${statusText}`);
    }
  } catch (error) {
    console.error(
      `[Slack] Error sending notification: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
