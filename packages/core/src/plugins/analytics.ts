// ─────────────────────────────────────────────────────────────────────────────
// Analytics Plugin — Cloudflare Analytics Engine
// Tracks auth events (sign-up, sign-in, failures, OAuth) without slowing
// down the request path. Uses writeDataPoint for fire-and-forget telemetry.
// ─────────────────────────────────────────────────────────────────────────────

import type { GatelyAuthPlugin, GatelyAuthContext } from '../types/index.js';

export interface AnalyticsPluginConfig {
  /**
   * Cloudflare Analytics Engine binding.
   * Add to wrangler.toml: [[analytics_engine_datasets]] binding = "AUTH_ANALYTICS"
   */
  dataset: AnalyticsEngineDataset;
  /**
   * Whether to track sign-in attempts (including failures). Default: true
   */
  trackSignIn?: boolean;
  /**
   * Whether to track sign-ups. Default: true
   */
  trackSignUp?: boolean;
  /**
   * Whether to track OAuth flows. Default: true
   */
  trackOAuth?: boolean;
  /**
   * Whether to include country from CF-IPCountry header. Default: true
   */
  includeCountry?: boolean;
}

interface AnalyticsEngineDataset {
  writeDataPoint(data: {
    blobs?: string[];
    doubles?: number[];
    indexes?: string[];
  }): void;
}

type AuthEvent =
  | 'sign_up_success'
  | 'sign_up_failure'
  | 'sign_in_success'
  | 'sign_in_failure'
  | 'sign_out'
  | 'oauth_start'
  | 'oauth_success'
  | 'oauth_failure'
  | 'magic_link_sent'
  | 'magic_link_verified'
  | 'otp_sent'
  | 'otp_verified'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'session_revoked';

function track(
  dataset: AnalyticsEngineDataset,
  event: AuthEvent,
  request: Request,
  includeCountry: boolean,
  extra?: { provider?: string; error?: string }
) {
  try {
    const country = includeCountry
      ? (request.headers.get('CF-IPCountry') ?? 'unknown')
      : 'redacted';

    dataset.writeDataPoint({
      blobs: [
        event,
        country,
        extra?.provider ?? '',
        extra?.error ?? '',
      ],
      doubles: [1],
      indexes: [event],
    });
  } catch {
    // Fire-and-forget — never block the request
  }
}

/**
 * Analytics Plugin
 *
 * Tracks auth events to Cloudflare Analytics Engine.
 * Zero latency impact — uses writeDataPoint which is non-blocking.
 *
 * Add to wrangler.toml:
 * ```toml
 * [[analytics_engine_datasets]]
 * binding = "AUTH_ANALYTICS"
 * dataset = "gately_auth_events"
 * ```
 *
 * @example
 * ```ts
 * import { analyticsPlugin } from '@gately/auth-core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [analyticsPlugin({ dataset: env.AUTH_ANALYTICS })],
 * })
 * ```
 */
export function analyticsPlugin(config: AnalyticsPluginConfig): GatelyAuthPlugin {
  const trackSignIn = config.trackSignIn ?? true;
  const trackSignUp = config.trackSignUp ?? true;
  const trackOAuth = config.trackOAuth ?? true;
  const includeCountry = config.includeCountry ?? true;

  return {
    id: 'analytics',
    name: 'Cloudflare Analytics',

    hooks: {
      after: [
        {
          matcher: (ctx) => trackSignUp && ctx.path === '/sign-up/email',
          handler: async (ctx) => {
            const success = !ctx.body?.error;
            track(config.dataset, success ? 'sign_up_success' : 'sign_up_failure', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => trackSignIn && ctx.path === '/sign-in/email',
          handler: async (ctx) => {
            const success = !ctx.body?.error;
            track(config.dataset, success ? 'sign_in_success' : 'sign_in_failure', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => ctx.path === '/sign-out',
          handler: async (ctx) => {
            track(config.dataset, 'sign_out', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => ctx.path === '/magic-link/send',
          handler: async (ctx) => {
            track(config.dataset, 'magic_link_sent', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => ctx.path === '/magic-link/verify',
          handler: async (ctx) => {
            track(config.dataset, 'magic_link_verified', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => ctx.path === '/otp/send',
          handler: async (ctx) => {
            track(config.dataset, 'otp_sent', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => ctx.path === '/otp/verify',
          handler: async (ctx) => {
            track(config.dataset, 'otp_verified', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => trackOAuth && /^\/oauth\/[^/]+$/.test(ctx.path),
          handler: async (ctx) => {
            const provider = ctx.path.split('/')[2] ?? 'unknown';
            track(config.dataset, 'oauth_start', ctx.request, includeCountry, { provider });
          },
        },
        {
          matcher: (ctx) => trackOAuth && /^\/oauth\/[^/]+\/callback$/.test(ctx.path),
          handler: async (ctx) => {
            const provider = ctx.path.split('/')[2] ?? 'unknown';
            const success = !ctx.body?.error;
            track(
              config.dataset,
              success ? 'oauth_success' : 'oauth_failure',
              ctx.request,
              includeCountry,
              { provider }
            );
          },
        },
        {
          matcher: (ctx) => ctx.path === '/password/reset',
          handler: async (ctx) => {
            track(config.dataset, 'password_reset_requested', ctx.request, includeCountry);
          },
        },
        {
          matcher: (ctx) => ctx.path === '/password/reset/confirm',
          handler: async (ctx) => {
            track(config.dataset, 'password_reset_completed', ctx.request, includeCountry);
          },
        },
      ],
    },
  };
}
