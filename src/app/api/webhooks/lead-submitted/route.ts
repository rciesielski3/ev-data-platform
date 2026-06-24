import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  try {
    const body = await req.json();

    const {
      leadId,
      name,
      email,
      company,
      interest,
      message,
      submittedAt,
    } = body;

    if (!process.env.SLACK_WEBHOOK_FEATURED_LEADS) {
      console.log(
        "SLACK_WEBHOOK_FEATURED_LEADS not configured, skipping Slack notification"
      );
      return NextResponse.json({ success: true });
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

    const slackResponse = await fetch(
      process.env.SLACK_WEBHOOK_FEATURED_LEADS,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackMessage),
      }
    );

    if (!slackResponse.ok) {
      const slackError = await slackResponse.text();
      console.error("Slack webhook error:", slackError);
      return NextResponse.json(
        { error: "Failed to post to Slack" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
