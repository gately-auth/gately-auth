import { bn, h2, p, bullet, codeBlock, callout, codeGroup, divider } from '../../blocks';

export const clientOverviewArticle = {
  id: 'client-overview',
  title: 'Client SDK Overview',
  slug: 'client-overview',
  excerpt: 'The @gately/auth-client package — createAuthClient, session management, and all available methods.',
  category_id: 'client-sdk',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:web-design-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('@gately/auth-client is a framework-agnostic browser client for gately-auth. It manages sessions, wraps every auth endpoint in a typed method, and ships a React hooks integration.'),

    h2('Install'),
    codeGroup([
      { label: 'npm', language: 'bash', code: 'npm install @gately/auth-client' },
      { label: 'pnpm', language: 'bash', code: 'pnpm add @gately/auth-client' },
    ]),

    h2('Create a client'),
    codeBlock(`import { createAuthClient } from '@gately/auth-client'

export const authClient = createAuthClient({
  baseURL: 'https://my-auth.workers.dev',
})`, 'typescript'),
    p('If your auth Worker is on the same origin (common in monorepos or proxied setups), you can omit baseURL.'),

    h2('Available methods'),
    bullet('authClient.signUp.email({ email, password, name? })'),
    bullet('authClient.signIn.email({ email, password })'),
    bullet('authClient.signIn.magicLink({ email, callbackURL? })'),
    bullet('authClient.signIn.otp({ email, code, type? })'),
    bullet('authClient.signIn.social({ provider, callbackURL? })'),
    bullet('authClient.signOut()'),
    bullet('authClient.getSession()'),
    bullet('authClient.password.sendResetEmail({ email })'),
    bullet('authClient.password.reset({ token, newPassword })'),
    bullet('authClient.otp.send({ email, type? })'),
    bullet('authClient.session.list()'),
    bullet('authClient.session.revoke(token)'),
    bullet('authClient.session.revokeAll()'),

    h2('Response shape'),
    p('Every method returns { data, error }. data is the typed response on success, error has { code, message, status } on failure:'),
    codeBlock(`const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secret123',
})

if (error) {
  console.error(error.code, error.message)
} else {
  console.log(data.user)
}`, 'typescript'),

    h2('Session cookies'),
    p('The client sends credentials: "include" on every request so the browser automatically sends and receives the HttpOnly session cookie. You do not need to manage tokens manually.'),
    callout('info', 'For non-browser environments (Node.js, test runners) the client stores the token in memory via the Set-Auth-Token response header.'),

    h2('Options'),
    codeBlock(`createAuthClient({
  baseURL: 'https://my-auth.workers.dev',
  basePath: '/auth',           // default
  credentials: 'include',      // default
  fetchOptions: {
    onError: ({ error }) => console.error(error),
    onRequest: ({ request }) => { /* mutate headers */ },
    onSuccess: ({ data }) => { /* track analytics */ },
  },
})`, 'typescript'),
  ]),
};
