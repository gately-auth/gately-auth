import { bn, h2, p, bullet, codeBlock, callout, codeGroup, paramField, divider } from '../../blocks';

export const emailPasswordArticle = {
  id: 'email-password',
  title: 'Email + Password',
  slug: 'email-password',
  excerpt: 'Sign up, sign in, email verification, and password reset with the email/password provider.',
  category_id: 'auth-methods',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:mail-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    h2('Enable'),
    codeBlock(`gatelyAuth({
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
})`, 'typescript'),

    h2('Sign up'),
    p('POST /auth/sign-up/email'),
    codeBlock(`// Request body
{
  "email": "user@example.com",
  "password": "secret123",
  "name": "Alice"          // optional
}

// Response (201)
{
  "user": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "Alice",
    "emailVerified": false,
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "token": "eyJ..."
}`, 'json'),
    p('Using the client SDK:'),
    codeBlock(`const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'secret123',
  name: 'Alice',
})`, 'typescript'),

    h2('Sign in'),
    p('POST /auth/sign-in/email'),
    codeBlock(`// Request body
{
  "email": "user@example.com",
  "password": "secret123",
  "rememberMe": true       // optional — extends session to 30 days
}

// Response (200)
{
  "user": { ... },
  "session": {
    "id": "ses_abc123",
    "token": "eyJ...",
    "expiresAt": "2025-01-08T00:00:00.000Z"
  },
  "token": "eyJ..."
}`, 'json'),
    codeBlock(`const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secret123',
})`, 'typescript'),

    h2('Password reset'),
    p('Two-step flow: request a reset link, then confirm with the new password.'),
    p('Step 1 — send the reset email:'),
    codeBlock(`// POST /auth/password/reset
{ "email": "user@example.com" }`, 'json'),
    codeBlock(`await authClient.password.sendResetEmail({ email: 'user@example.com' })`, 'typescript'),
    p('Step 2 — confirm with the token from the email link:'),
    codeBlock(`// POST /auth/password/reset/confirm
{
  "token": "abc123...",
  "newPassword": "newSecret456"
}`, 'json'),
    codeBlock(`await authClient.password.reset({ token: tokenFromURL, newPassword: 'newSecret456' })`, 'typescript'),

    h2('Email verification'),
    p('When requireEmailVerification is true, users must click the verification link before they can sign in.'),
    p('Enable and configure the verification email:'),
    codeBlock(`gatelyAuth({
  emailAndPassword: { enabled: true, requireEmailVerification: true },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 86400, // 24 hours
  },
  plugins: [gatelyEmail({ apiKey: env.GATELY_API_KEY })],
})`, 'typescript'),
    p('The verification link calls GET /auth/verify-email?token=xxx. After verification the user is redirected to callbackURL (default: /).'),

    callout('info', 'If you use gatelyEmail plugin, all password reset and verification emails are sent automatically. You only need to provide sendResetPassword or sendVerificationEmail if you want to use a different email provider.'),

    h2('Error codes'),
    bullet('INVALID_EMAIL — malformed email address'),
    bullet('INVALID_CREDENTIALS — wrong email or password'),
    bullet('EMAIL_ALREADY_EXISTS — sign-up with an existing email'),
    bullet('EMAIL_NOT_VERIFIED — sign-in blocked until email is verified'),
    bullet('PASSWORD_TOO_SHORT / PASSWORD_TOO_LONG — password length violation'),
    bullet('SIGNUP_DISABLED — disableSignUp is true'),
  ]),
};
