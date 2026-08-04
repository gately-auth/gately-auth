import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, divider } from '../../blocks';

export const oneTapPluginArticle = {
  id: 'one-tap-plugin',
  title: 'Google One Tap Plugin',
  slug: 'one-tap-plugin',
  excerpt: 'Sign in with the Google One Tap prompt or the Sign in with Google button — no redirect flow needed.',
  category_id: 'plugins',
  is_published: true,
  display_order: 4,
  sidebar_title: null as string | null,
  icon: 'hugeicons:google' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('The Google One Tap plugin handles the credential response from the Google One Tap prompt or the Sign in with Google button. It verifies the Google ID token server-side, then creates or looks up a gately-auth user and session — no redirect flow required.'),

    h2('How it differs from OAuth social sign-in'),
    bullet('OAuth social sign-in: full redirect flow — user leaves your page, returns via callback URL'),
    bullet('One Tap: JS callback on the same page — you send the credential to your server, get a session cookie back'),
    p('Use One Tap when you want sign-in to feel instant without a page navigation. Use the OAuth flow when you need refresh tokens or additional scopes.'),

    h2('Setup'),
    codeBlock(`import { gatelyAuth } from '@gately/auth-core'
import { oneTapPlugin } from '@gately/auth-core/plugins'

const auth = gatelyAuth({
  secret: env.AUTH_SECRET,
  db: createD1Adapter(env.AUTH_DB),
  kv: createKVStore(env.AUTH_KV),
  plugins: [
    oneTapPlugin({
      clientId: env.GOOGLE_CLIENT_ID,
      callbackURL: '/dashboard',
    }),
  ],
})`, 'typescript'),

    h2('Config options'),
    paramField('clientId', 'string', true, 'Your Google OAuth client ID — the same one used in the Google Identity Services JS snippet.'),
    paramField('callbackURL', 'string', false, 'Where to redirect after successful sign-in for browser clients. Default: "/".'),

    h2('Frontend integration'),
    p('Add the Google Identity Services script and initialise One Tap. On credential response, POST to /auth/one-tap/callback:'),
    codeBlock(`<!-- In your HTML <head> -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<script>
  window.onload = () => {
    google.accounts.id.initialize({
      client_id: 'YOUR_GOOGLE_CLIENT_ID',
      callback: async ({ credential }) => {
        const res = await fetch('/auth/one-tap/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credential, callbackURL: '/dashboard' }),
        })
        if (res.ok || res.redirected) {
          window.location.href = '/dashboard'
        }
      },
    })
    google.accounts.id.prompt()
  }
</script>`, 'html'),

    h2('React integration'),
    codeBlock(`import { useEffect } from 'react'

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: object) => void
          prompt: () => void
        }
      }
    }
  }
}

export function GoogleOneTap() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async ({ credential }: { credential: string }) => {
          const res = await fetch('/auth/one-tap/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ credential }),
          })
          if (res.ok) window.location.href = '/dashboard'
        },
      })
      window.google.accounts.id.prompt()
    }
    document.head.appendChild(script)
  }, [])

  return null
}`, 'typescript'),

    h2('API endpoint'),

    h3('POST /auth/one-tap/callback'),
    codeBlock(`// Request body
{
  "credential": "eyJhbGci...",   // Google ID token from One Tap callback
  "callbackURL": "/dashboard"    // optional override
}

// Response for browser clients (302 redirect to callbackURL)
// Response for API clients (Accept: application/json):
{
  "user": { "id": "...", "email": "...", "name": "..." },
  "token": "session-token"
}`, 'json'),
    p('The endpoint automatically detects whether the request is from a browser or an API client based on the Accept header. Browsers get a 302 redirect; JSON clients get the user and token in the response body.'),

    h2('How token verification works'),
    p('The plugin sends the Google ID token to Google\'s tokeninfo endpoint (https://oauth2.googleapis.com/tokeninfo) for server-side verification. It checks that the token\'s aud matches your clientId and that it hasn\'t expired.'),
    callout('info', 'For high-volume production use, consider verifying the token locally using Google\'s public JWK keys to avoid an extra network round-trip on every sign-in.'),

    h2('Error codes'),
    bullet('INVALID_TOKEN — Google rejected the ID token or aud mismatch'),
    bullet('PROVIDER_EMAIL_MISSING — Google profile did not include an email'),
    bullet('METHOD_NOT_ALLOWED — non-POST request to the endpoint'),
    bullet('BAD_REQUEST — missing credential in request body'),
  ]),
};
