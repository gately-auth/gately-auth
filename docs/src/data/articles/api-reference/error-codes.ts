import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const errorCodesArticle = {
  id: 'error-codes',
  title: 'Error Codes',
  slug: 'error-codes',
  excerpt: 'Every error code gately-auth can return, its HTTP status, and when it is thrown.',
  category_id: 'api-reference',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:alert-02' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('All errors from gately-auth follow the same shape in JSON responses:'),
    codeBlock(`{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}`, 'json'),
    p('The HTTP status code matches the error type. The client SDK surfaces errors as { error: { code, message, status } }.'),

    h2('Authentication errors (400–403)'),
    bullet('INVALID_EMAIL (400) — Email address failed format validation'),
    bullet('INVALID_PASSWORD (400) — Password field is empty or malformed'),
    bullet('PASSWORD_TOO_SHORT (400) — Password is shorter than minPasswordLength'),
    bullet('PASSWORD_TOO_LONG (400) — Password exceeds maxPasswordLength'),
    bullet('INVALID_CREDENTIALS (401) — Wrong email or password on sign-in'),
    bullet('EMAIL_NOT_VERIFIED (403) — requireEmailVerification is true and user has not verified'),
    bullet('ACCOUNT_DISABLED (403) — Account has been disabled by an admin'),
    bullet('UNAUTHORIZED (401) — Request requires authentication but none was provided'),

    h2('Registration errors'),
    bullet('EMAIL_ALREADY_EXISTS (409) — Sign-up attempted with an email that already has an account'),
    bullet('SIGNUP_DISABLED (403) — disableSignUp is true'),

    h2('Session errors'),
    bullet('SESSION_NOT_FOUND (401) — Token does not match any session in D1'),
    bullet('SESSION_EXPIRED (401) — Session exists but expiresAt is in the past'),
    bullet('INVALID_TOKEN (401) — Token signature is invalid or tampered'),

    h2('OAuth errors'),
    bullet('INVALID_OAUTH_STATE (400) — State parameter missing or does not match KV record'),
    bullet('OAUTH_CODE_EXCHANGE_FAILED (502) — Provider rejected the authorization code'),
    bullet('PROVIDER_NOT_CONFIGURED (400) — Provider key not found in socialProviders config'),
    bullet('PROVIDER_EMAIL_MISSING (400) — OAuth profile did not include an email address'),

    h2('Verification errors'),
    bullet('VERIFICATION_TOKEN_EXPIRED (400) — Email verification link has expired (default TTL: 24h)'),
    bullet('VERIFICATION_TOKEN_INVALID (400) — Token not found or already used'),
    bullet('EMAIL_ALREADY_VERIFIED (400) — Verification attempted on an already-verified email'),

    h2('Magic link errors'),
    bullet('MAGIC_LINK_EXPIRED (400) — Magic link token TTL of 15 minutes has passed'),
    bullet('MAGIC_LINK_INVALID (400) — Token not found in KV or already consumed'),

    h2('OTP errors'),
    bullet('OTP_EXPIRED (400) — Code TTL of 10 minutes has passed'),
    bullet('OTP_INVALID (400) — Code does not match the stored value'),
    bullet('OTP_MAX_ATTEMPTS (429) — 5 consecutive failed verifications; send a new code'),

    h2('Rate limiting'),
    bullet('RATE_LIMIT_EXCEEDED (429) — Request exceeds the per-path rate limit window'),

    h2('Generic errors'),
    bullet('BAD_REQUEST (400) — Request body is missing required fields or malformed JSON'),
    bullet('FORBIDDEN (403) — Authenticated but not allowed to perform this action'),
    bullet('NOT_FOUND (404) — Route or resource not found'),
    bullet('METHOD_NOT_ALLOWED (405) — Wrong HTTP method for this route'),
    bullet('ORIGIN_NOT_ALLOWED (403) — Origin header is not in trustedOrigins'),
    bullet('INTERNAL_ERROR (500) — Unexpected server error (check Worker logs)'),

    h2('Handling errors in the client'),
    codeBlock(`const { data, error } = await authClient.signIn.email({ email, password })

if (error) {
  switch (error.code) {
    case 'INVALID_CREDENTIALS':
      setError('Wrong email or password')
      break
    case 'EMAIL_NOT_VERIFIED':
      setError('Please check your email to verify your account')
      break
    case 'RATE_LIMIT_EXCEEDED':
      setError('Too many attempts — please wait a moment')
      break
    default:
      setError('Something went wrong')
  }
}`, 'typescript'),

    h2('Throwing errors in plugins'),
    codeBlock(`import { GatelyAuthError } from '@gately/auth-core'

// In a plugin endpoint or hook:
throw new GatelyAuthError('FORBIDDEN', 'Your account does not have access to this resource')`, 'typescript'),
  ]),
};
