// ─────────────────────────────────────────────────────────────────────────────
// Turnstile Plugin — Cloudflare Turnstile bot protection
// Validates Turnstile tokens on sign-up and sign-in to block bots,
// spam registrations, and credential-stuffing attacks.
// ─────────────────────────────────────────────────────────────────────────────

import type { GatelyAuthPlugin } from '../types/index.js';
import { GatelyAuthError } from '../error.js';

export interface TurnstilePluginConfig {
  /**
   * Your Cloudflare Turnstile secret key.
   * Get it from dash.cloudflare.com → Turnstile → your site → Secret key.
   */
  secretKey: string;
  /**
   * Routes to protect. Defaults to sign-up and sign-in.
   */
  protectedRoutes?: string[];
  /**
   * Name of the field in the request body that contains the Turnstile token.
   * Default: 'cf-turnstile-response'
   */
  tokenField?: string;
  /**
   * Cloudflare Turnstile verify URL. Default: https://challenges.cloudflare.com/turnstile/v0/siteverify
   */
  verifyURL?: string;
}

const DEFAULT_PROTECTED = ['/sign-up/email', '/sign-in/email'];
const TURNSTILE_VERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Turnstile Plugin
 *
 * Validates Cloudflare Turnstile tokens on auth endpoints to block bots.
 *
 * Add cf-turnstile-response to your sign-up/sign-in forms:
 * ```html
 * <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
 * <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
 * ```
 *
 * @example
 * ```ts
 * import { turnstilePlugin } from '@gately/auth-core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [turnstilePlugin({ secretKey: env.TURNSTILE_SECRET_KEY })],
 * })
 * ```
 */
export function turnstilePlugin(config: TurnstilePluginConfig): GatelyAuthPlugin {
  const protectedRoutes = config.protectedRoutes ?? DEFAULT_PROTECTED;
  const tokenField = config.tokenField ?? 'cf-turnstile-response';
  const verifyURL = config.verifyURL ?? TURNSTILE_VERIFY;

  return {
    id: 'turnstile',
    name: 'Cloudflare Turnstile',

    hooks: {
      before: [
        {
          matcher: (ctx) => protectedRoutes.some(r => ctx.path === r),
          handler: async (ctx) => {
            const token = ctx.body?.[tokenField] as string | undefined;

            if (!token) {
              throw new GatelyAuthError(
                'BAD_REQUEST',
                'Turnstile verification required. Please complete the challenge.'
              );
            }

            // Get the visitor's IP for additional validation
            const ip = ctx.request.headers.get('CF-Connecting-IP') ?? '';

            const formData = new FormData();
            formData.append('secret', config.secretKey);
            formData.append('response', token);
            if (ip) formData.append('remoteip', ip);

            let result: { success: boolean; 'error-codes'?: string[] };
            try {
              const res = await fetch(verifyURL, {
                method: 'POST',
                body: formData,
              });
              result = await res.json() as typeof result;
            } catch {
              throw new GatelyAuthError('INTERNAL_ERROR', 'Turnstile verification service unavailable');
            }

            if (!result.success) {
              const codes = result['error-codes']?.join(', ') ?? 'unknown';
              throw new GatelyAuthError(
                'FORBIDDEN',
                `Bot detection failed (${codes}). Please try again.`
              );
            }
          },
        },
      ],
    },
  };
}
