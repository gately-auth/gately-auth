import { bn, h2, p, bullet, codeBlock, callout, divider } from '../../blocks';

export const oauthSocialArticle = {
  id: 'oauth-social',
  title: 'OAuth / Social Sign-in',
  slug: 'oauth-social',
  excerpt: 'Add Google, GitHub, or any OAuth 2.0 provider to your Cloudflare Worker auth.',
  category_id: 'auth-methods',
  is_published: true,
  display_order: 4,
  sidebar_title: null as string | null,
  icon: 'hugeicons:google' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gately-auth handles the full OAuth 2.0 PKCE flow — redirect, state validation, code exchange, and session creation. You only need to configure your provider credentials.'),

    h2('Configure providers'),
    codeBlock(`gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  baseURL: 'https://my-auth.workers.dev',
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
})`, 'typescript'),

    h2('Set callback URLs'),
    p('In your OAuth provider dashboard, add the callback URL for each provider:'),
    codeBlock(`# Google
https://my-auth.workers.dev/auth/oauth/google/callback

# GitHub
https://my-auth.workers.dev/auth/oauth/github/callback`, 'bash'),
    callout('info', 'The pattern is always: {baseURL}/auth/oauth/{providerId}/callback'),

    h2('Initiate sign-in'),
    p('Redirect the user to the OAuth provider by navigating to the redirect URL:'),
    codeBlock(`// Client SDK — redirects the browser automatically
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
})`, 'typescript'),
    p('Or build the URL manually and redirect:'),
    codeBlock(`// GET /auth/oauth/google?callbackURL=/dashboard
window.location.href = 'https://my-auth.workers.dev/auth/oauth/google?callbackURL=/dashboard'`, 'javascript'),

    h2('What happens next'),
    bullet('gately-auth redirects the user to Google/GitHub with a state parameter stored in KV'),
    bullet('After the user authorises, the provider redirects to /auth/oauth/:provider/callback'),
    bullet('gately-auth validates the state, exchanges the code for tokens, fetches the user profile'),
    bullet('Creates or updates the User and Account records in D1'),
    bullet('Sets the session cookie and redirects to callbackURL'),

    h2('Custom profile mapping'),
    p('By default, gately-auth maps email, name, and image from the provider profile. You can override this:'),
    codeBlock(`socialProviders: {
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    mapProfileToUser: (profile) => ({
      email: profile.email as string,
      name: profile.name as string,
      image: profile.picture as string,
    }),
  },
}`, 'typescript'),

    h2('Error codes'),
    bullet('INVALID_OAUTH_STATE — state parameter missing or tampered with'),
    bullet('OAUTH_CODE_EXCHANGE_FAILED — provider rejected the code exchange (502)'),
    bullet('PROVIDER_NOT_CONFIGURED — provider key not in socialProviders'),
    bullet('PROVIDER_EMAIL_MISSING — provider profile did not return an email'),
  ]),
};
