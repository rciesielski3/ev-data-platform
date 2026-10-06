export type AlertThresholds = {
  positionDropThreshold: number;
  trafficDropPercent: number;
};

export type UnderperformingKeyword = {
  query: string;
  currentPosition: number;
  previousPosition: number;
  positionDrop: number;
  currentClicks: number;
  previousClicks: number;
  clicksDrop: number;
  currentImpressions: number;
  previousImpressions: number;
  impressionsDrop: number;
};

export type AlertEmailContent = {
  subject: string;
  html: string;
  plaintext: string;
};

export const createAlertEmail = (
  underperformers: UnderperformingKeyword[],
  thresholds: AlertThresholds,
): AlertEmailContent => {
  if (underperformers.length === 0) {
    return {
      subject: "No Keywords Underperforming",
      html: "<p>All keywords are performing well. No alerts to report.</p>",
      plaintext: "All keywords are performing well. No alerts to report.",
    };
  }

  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // HTML email body
  const htmlRows = underperformers
    .map(
      (kw) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px; text-align: left;">
        <strong>${escapeHtml(kw.query)}</strong>
      </td>
      <td style="padding: 12px; text-align: center; color: #dc2626;">
        Position ${kw.previousPosition.toFixed(0)} → ${kw.currentPosition.toFixed(0)}
        <span style="color: #ef4444;">↓${kw.positionDrop.toFixed(1)}</span>
      </td>
      <td style="padding: 12px; text-align: center;">
        Clicks: ${kw.currentClicks} (was ${kw.previousClicks})
      </td>
      <td style="padding: 12px; text-align: center;">
        Impressions: ${kw.currentImpressions} (was ${kw.previousImpressions})
      </td>
    </tr>
  `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Alert: Keywords Underperforming</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">SEO Alert: Keywords Underperforming</h2>
    <p style="color: #6b7280; font-size: 14px;">Report Date: ${now}</p>
    <p>The following keywords have dropped more than ${thresholds.positionDropThreshold} positions:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead style="background-color: #f3f4f6;">
        <tr>
          <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Keyword</th>
          <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Position Change</th>
          <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Clicks</th>
          <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Impressions</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>

    <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #166534; font-size: 14px;">
        <strong>Action Required:</strong> Review these keywords and consider optimization efforts to recover their positions.
      </p>
    </div>

    <p style="color: #6b7280; font-size: 12px; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
      This is an automated alert from your SEO monitoring system. Do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;

  // Plain text email body
  const textRows = underperformers
    .map(
      (kw) =>
        `Keyword: ${kw.query}
Position: ${kw.previousPosition.toFixed(0)} → ${kw.currentPosition.toFixed(0)} (↓${kw.positionDrop.toFixed(1)})
Clicks: ${kw.currentClicks} (was ${kw.previousClicks})
Impressions: ${kw.currentImpressions} (was ${kw.previousImpressions})
`,
    )
    .join("\n");

  const plaintext = `SEO Alert: Keywords Underperforming
Report Date: ${now}

The following keywords have dropped more than ${thresholds.positionDropThreshold} positions:

${textRows}
Action Required: Review these keywords and consider optimization efforts to recover their positions.

This is an automated alert from your SEO monitoring system. Do not reply to this email.`;

  return {
    subject: `SEO Alert: ${underperformers.length} Keyword${underperformers.length !== 1 ? "s" : ""} Underperforming (${now})`,
    html,
    plaintext,
  };
};

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]!);
};
