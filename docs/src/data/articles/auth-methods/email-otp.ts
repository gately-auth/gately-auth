import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const emailOtpArticle = {
  id: 'email-otp',
  title: 'Email OTP',
  slug: 'email-otp',
  excerpt: 'Six-digit one-time codes sent to the user\'s email for sign-in, sign-up, or two-factor verification.',
  category_id: 'auth-methods',
  is_published: true,
  display_order: 3,
  sidebar_title: null as string | null,
  icon: 'hugeicons:mobile-navigator-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('Email OTP sends a 6-digit code to the user. They enter it in your UI to sign in or verify an action. Codes are stored in KV with a 10-minute TTL and a max of 5 attempts before lockout.'),

    h2('Setup'),
    p('OTP requires the email-otp plugin. Add it alongside gatelyEmail:'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { gatelyEmail } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  plugins: [
    gatelyEmail({ apiKey: env.GATELY_API_KEY }),
    {
      id: 'email-otp',
      name: 'Email OTP',
      config: {
        sendOTP: async ({ email, otp, type }, options) => {
          await options.emailProvider?.send({
            to: email,
            subject: 'Your verification code',
            html: \`<p>Your code: <strong>\${otp}</strong></p>\`,
          })
        },
      },
    },
  ],
})`, 'typescript'),

    h2('Send an OTP'),
    p('POST /auth/otp/send'),
    codeBlock(`// Request body
{
  "email": "user@example.com",
  "type": "sign-in"    // "sign-in" | "sign-up" | "email-verification"
}

// Response (200)
{ "success": true }`, 'json'),
    p('Using the client SDK:'),
    codeBlock(`const { data, error } = await authClient.otp.send({
  email: 'user@example.com',
  type: 'sign-in',
})`, 'typescript'),

    h2('Verify an OTP'),
    p('POST /auth/otp/verify'),
    codeBlock(`// Request body
{
  "email": "user@example.com",
  "code": "123456",
  "type": "sign-in"
}

// Response (200)
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com"
  }
}`, 'json'),
    codeBlock(`const { data, error } = await authClient.signIn.otp({
  email: 'user@example.com',
  code: '123456',
  type: 'sign-in',
})`, 'typescript'),

    h2('OTP types'),
    bullet('sign-in — sign in an existing user'),
    bullet('sign-up — create and sign in a new user'),
    bullet('email-verification — verify an email address without signing in'),

    h2('Error codes'),
    bullet('OTP_EXPIRED — code has passed the 10-minute TTL'),
    bullet('OTP_INVALID — wrong code entered'),
    bullet('OTP_MAX_ATTEMPTS — 5 consecutive failed attempts; new code required'),
    bullet('RATE_LIMIT_EXCEEDED — more than 5 send requests per 60 seconds'),
  ]),
};
