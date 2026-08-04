import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const magicLinksArticle = {
  id: 'magic-links',
  title: 'Magic Links',
  slug: 'magic-links',
  excerpt: 'Passwordless sign-in via a time-limited link sent to the user\'s email.',
  category_id: 'auth-methods',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:magic-wand-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('Magic links let users sign in without a password. The user enters their email, receives a link, clicks it, and is signed in. The link token is stored in KV with a 15-minute TTL.'),

    h2('Setup'),
    p('Magic links require an email provider. Add the gatelyEmail plugin:'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { gatelyEmail } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  plugins: [
    gatelyEmail({ apiKey: env.GATELY_API_KEY }),
  ],
})`, 'typescript'),
    callout('info', 'Magic links do not require a separate plugin to be enabled — they are always available once an email provider is configured.'),

    h2('Send a magic link'),
    p('POST /auth/magic-link/send'),
    codeBlock(`// Request body
{
  "email": "user@example.com",
  "callbackURL": "/dashboard"  // optional, where to redirect after sign-in
}

// Response (200)
{ "success": true }`, 'json'),
    p('Using the client SDK:'),
    codeBlock(`const { data, error } = await authClient.signIn.magicLink({
  email: 'user@example.com',
  callbackURL: '/dashboard',
})`, 'typescript'),

    h2('Verify the magic link'),
    p('The link in the email points to GET /auth/magic-link/verify?token=xxx&callbackURL=/dashboard. On success the user is redirected to callbackURL with their session cookie set.'),
    p('You do not need to handle this route yourself — gately-auth handles it automatically.'),

    h2('Custom email template'),
    p('If you want to customise the magic link email, provide a custom sendMagicLink function. The gatelyEmail plugin also ships pre-built templates:'),
    codeBlock(`import { emailTemplates } from '@gately/auth-core/plugins'

// Use the built-in template
const { subject, html, text } = emailTemplates.magicLink({
  appName: 'My App',
  url: 'https://...',
  expiresInMinutes: 15,
})`, 'typescript'),

    h2('Token lifetime'),
    p('Magic link tokens expire after 15 minutes. They are stored in KV and deleted on first use. If the user clicks an expired link they receive a MAGIC_LINK_EXPIRED error.'),

    h2('Error codes'),
    bullet('MAGIC_LINK_EXPIRED — token has passed its 15-minute TTL'),
    bullet('MAGIC_LINK_INVALID — token not found or already used'),
    bullet('RATE_LIMIT_EXCEEDED — more than 5 requests per 60 seconds from the same IP'),
  ]),
};
