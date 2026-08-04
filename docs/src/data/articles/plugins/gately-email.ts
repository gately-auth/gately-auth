import { bn, h2, h3, p, bullet, codeBlock, callout, codeGroup, paramField, divider } from '../../blocks';

export const gatelyEmailPluginArticle = {
  id: 'gately-email-plugin',
  title: 'Gately Email Plugin',
  slug: 'gately-email-plugin',
  excerpt: 'Connect gately-auth to Gately\'s transactional email platform for password resets, magic links, OTPs, and verification emails.',
  category_id: 'plugins',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:mail-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('The gatelyEmail plugin connects gately-auth to Gately\'s transactional email platform. Once registered, every built-in email flow — password reset, magic link, OTP, and email verification — is sent through Gately automatically.'),

    h2('Install'),
    p('The plugin ships inside @gately/auth-core. No extra package needed.'),
    codeBlock(`import { gatelyEmail } from '@gately/auth-core/plugins'`, 'typescript'),

    h2('Setup'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { gatelyEmail } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  appName: 'My App',
  emailAndPassword: { enabled: true },
  plugins: [
    gatelyEmail({
      apiKey: env.GATELY_API_KEY,
      fromEmail: 'noreply@myapp.com',
      fromName: 'My App',
    }),
  ],
})`, 'typescript'),

    h2('Config options'),
    paramField('apiKey', 'string', true, 'Your Gately API key. Get it from usegately.com → Project Settings → API Keys.'),
    paramField('fromEmail', 'string', false, 'Sender email address. Must be a verified domain on Gately. Defaults to no From header (Gately uses your project default).'),
    paramField('fromName', 'string', false, 'Sender display name. Defaults to your appName or "Gately Auth".'),
    paramField('apiURL', 'string', false, 'Override the Gately API base URL. Default: https://api.usegately.com.'),

    h2('Built-in email templates'),
    p('The plugin also exports pre-built HTML email templates for all auth flows:'),
    codeBlock(`import { emailTemplates } from '@gately/auth-core/plugins'

// Magic link email
const { subject, html, text } = emailTemplates.magicLink({
  appName: 'My App',
  url: 'https://myapp.com/auth/magic-link/verify?token=xxx',
  expiresInMinutes: 15,
})

// OTP email
const { subject, html } = emailTemplates.otp({
  appName: 'My App',
  otp: '123456',
  type: 'sign-in',
})

// Password reset email
const { subject, html } = emailTemplates.passwordReset({
  appName: 'My App',
  url: 'https://myapp.com/reset-password?token=xxx',
})

// Email verification email
const { subject, html } = emailTemplates.emailVerification({
  appName: 'My App',
  url: 'https://myapp.com/auth/verify-email?token=xxx',
})`, 'typescript'),

    h2('Standalone provider'),
    p('You can also use Gately email outside of gately-auth via createGatelyEmailProvider:'),
    codeBlock(`import { createGatelyEmailProvider } from '@gately/auth-core/plugins'

const emailProvider = createGatelyEmailProvider({
  apiKey: env.GATELY_API_KEY,
  fromEmail: 'noreply@myapp.com',
})

await emailProvider.send({
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Thanks for signing up.</p>',
})`, 'typescript'),

    callout('info', 'Get your API key from usegately.com → Project Settings → API Keys. Your sending domain must be verified in the Gately dashboard before emails will deliver.'),
  ]),
};
