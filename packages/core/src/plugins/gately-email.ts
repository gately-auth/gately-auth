// ─────────────────────────────────────────────────────────────────────────────
// Gately Email Plugin
// Connects gately-auth to Gately's transactional email platform
// Gives every gately-auth user instant access to deliverability,
// tracking, suppression lists, and marketing emails
// ─────────────────────────────────────────────────────────────────────────────

import type { EmailProvider, SendEmailOptions, GatelyAuthPlugin } from "../types/index.js";

export interface GatelyEmailConfig {
  /** Gately API key — from your Gately project settings */
  apiKey: string;
  /** Gately API base URL (default: https://api.usegately.com) */
  apiURL?: string;
  /** Default sender name (default: your app name) */
  fromName?: string;
  /** Default sender email (must be a verified domain on Gately) */
  fromEmail?: string;
}

// ── Email provider implementation ─────────────────────────────────────────────

class GatelyEmailProvider implements EmailProvider {
  private apiKey: string;
  private apiURL: string;
  private fromName: string;
  private fromEmail: string;

  constructor(config: GatelyEmailConfig, appName?: string) {
    this.apiKey = config.apiKey;
    this.apiURL = config.apiURL ?? "https://api.usegately.com";
    this.fromName = config.fromName ?? appName ?? "Gately Auth";
    this.fromEmail = config.fromEmail ?? "";
  }

  async send(options: SendEmailOptions): Promise<void> {
    const from = options.from ?? (
      this.fromEmail
        ? `${this.fromName} <${this.fromEmail}>`
        : undefined
    );

    const body: Record<string, unknown> = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      tags: { ...options.tags, source: "gately-auth" },
    };

    if (from) body["from"] = from;
    if (options.replyTo) body["reply_to"] = options.replyTo;

    const res = await fetch(`${this.apiURL}/sdk/email/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "unknown error");
      throw new Error(`Gately email send failed (${res.status}): ${err.slice(0, 200)}`);
    }
  }
}

// ── Plugin factory ────────────────────────────────────────────────────────────

/**
 * Gately Email Plugin
 *
 * Plugs gately-auth into Gately's email infrastructure.
 * Developers get deliverability, tracking, and suppression lists for free.
 *
 * @example
 * ```ts
 * import { gatelyAuth } from '@gately-auth/core'
 * import { gatelyEmail } from '@gately-auth/core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [
 *     gatelyEmail({ apiKey: env.GATELY_API_KEY })
 *   ]
 * })
 * ```
 */
export function gatelyEmail(config: GatelyEmailConfig): GatelyAuthPlugin {
  return {
    id: "gately-email",
    name: "Gately Email",
    init(ctx) {
      // Register the email provider on the options object
      // so all auth flows (magic link, OTP, password reset) use Gately
      if (!ctx.options.emailProvider) {
        ctx.options.emailProvider = new GatelyEmailProvider(
          config,
          ctx.options.appName
        );
      }

      ctx.logger.info("Gately Email plugin initialized");
    },
  };
}

// ── Standalone provider (for manual use) ─────────────────────────────────────

export function createGatelyEmailProvider(
  config: GatelyEmailConfig,
  appName?: string
): EmailProvider {
  return new GatelyEmailProvider(config, appName);
}

// ── Pre-built email templates ─────────────────────────────────────────────────

export const emailTemplates = {
  magicLink: (opts: {
    appName: string;
    url: string;
    expiresInMinutes?: number;
  }) => ({
    subject: `Sign in to ${opts.appName}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">${opts.appName}</h1>
    <p style="margin:0 0 32px;font-size:16px;color:#6b7280">Sign in to your account</p>
    <a href="${opts.url}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px">Sign in</a>
    <p style="margin:24px 0 0;font-size:14px;color:#9ca3af">
      This link expires in ${opts.expiresInMinutes ?? 15} minutes.
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`,
    text: `Sign in to ${opts.appName}\n\nClick this link to sign in:\n${opts.url}\n\nExpires in ${opts.expiresInMinutes ?? 15} minutes.`,
  }),

  otp: (opts: { appName: string; otp: string; type: string }) => ({
    subject: `Your ${opts.appName} verification code`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">${opts.appName}</h1>
    <p style="margin:0 0 32px;font-size:16px;color:#6b7280">Your verification code</p>
    <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111827;font-family:monospace">${opts.otp}</span>
    </div>
    <p style="margin:0;font-size:14px;color:#9ca3af">
      This code expires in 10 minutes. If you didn't request this, ignore this email.
    </p>
  </div>
</body>
</html>`,
    text: `${opts.appName} verification code: ${opts.otp}\n\nThis code expires in 10 minutes.`,
  }),

  passwordReset: (opts: { appName: string; url: string }) => ({
    subject: `Reset your ${opts.appName} password`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">${opts.appName}</h1>
    <p style="margin:0 0 32px;font-size:16px;color:#6b7280">Reset your password</p>
    <a href="${opts.url}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px">Reset password</a>
    <p style="margin:24px 0 0;font-size:14px;color:#9ca3af">
      This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`,
    text: `Reset your password\n\n${opts.url}\n\nThis link expires in 1 hour.`,
  }),

  emailVerification: (opts: { appName: string; url: string }) => ({
    subject: `Verify your ${opts.appName} email`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;margin:0;padding:40px 20px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827">${opts.appName}</h1>
    <p style="margin:0 0 32px;font-size:16px;color:#6b7280">Please verify your email address to continue.</p>
    <a href="${opts.url}" style="display:inline-block;background:#111827;color:#fff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 32px;border-radius:8px">Verify email</a>
    <p style="margin:24px 0 0;font-size:14px;color:#9ca3af">
      This link expires in 24 hours.
    </p>
  </div>
</body>
</html>`,
    text: `Verify your email\n\n${opts.url}\n\nThis link expires in 24 hours.`,
  }),
};
