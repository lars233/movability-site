import { logger } from "./logger";

/**
 * Emails a notification when someone submits the contact form.
 *
 * Sending goes through Resend's HTTP API, so there is no mail server to run
 * and no extra dependency — just an API key. If no key is configured the
 * submission is still saved and the site behaves normally; only the email is
 * skipped. A failed send is logged, never surfaced to the visitor, and never
 * loses the submission.
 */

const API_KEY = process.env["RESEND_API_KEY"] ?? "";
const TO = process.env["NOTIFY_EMAIL"] ?? "lars@movability.io";
const FROM = process.env["NOTIFY_FROM"] ?? "Movability site <onboarding@resend.dev>";

export type Submission = {
  name: string;
  email: string;
  company?: string;
  country?: string;
  industry?: string;
  primary_objective?: string;
  project_overview?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function row(label: string, value?: string): string {
  if (!value) return "";
  return `<tr><td style="padding:6px 14px 6px 0;color:#767b93;font-size:13px;white-space:nowrap;vertical-align:top">${label}</td><td style="padding:6px 0;font-size:14px;color:#14161f">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`;
}

export async function notifyNewSubmission(submission: Submission): Promise<void> {
  if (!API_KEY) {
    logger.info("RESEND_API_KEY not set — skipping the contact notification email.");
    return;
  }

  const subject = `New enquiry: ${submission.name}${submission.company ? ` (${submission.company})` : ""}`;

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px">
      <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#767b93;margin:0 0 6px">Movability — contact form</p>
      <h1 style="font-size:19px;margin:0 0 18px;color:#14161f">${escapeHtml(submission.name)} got in touch</h1>
      <table style="border-collapse:collapse;width:100%">
        ${row("Email", submission.email)}
        ${row("Company", submission.company)}
        ${row("Country", submission.country)}
        ${row("Industry", submission.industry)}
        ${row("Objective", submission.primary_objective)}
        ${row("Project", submission.project_overview)}
      </table>
      <p style="margin:22px 0 0;font-size:13px;color:#767b93">
        Reply straight to this email to answer ${escapeHtml(submission.name)}, or open
        <a href="https://movability.io/admin/submissions" style="color:#4b5cf0">all submissions</a>.
      </p>
    </div>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        // Answering the notification replies to the person who wrote in.
        reply_to: submission.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      logger.error(
        { status: res.status, body: (await res.text()).slice(0, 300) },
        "Contact notification email was rejected",
      );
      return;
    }
    logger.info({ to: TO }, "Contact notification email sent");
  } catch (err) {
    logger.error({ err }, "Could not send the contact notification email");
  }
}
