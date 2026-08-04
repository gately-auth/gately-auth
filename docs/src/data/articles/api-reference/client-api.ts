import { bn, h2, h3, p, bullet, codeBlock, callout, paramField, divider } from '../../blocks';

export const clientApiArticle = {
  id: 'client-api',
  title: '@gately/auth-client API',
  slug: 'client-api',
  excerpt: 'Complete reference for createAuthClient, createReactAuthClient, and all client methods.',
  category_id: 'api-reference',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:web-design-01' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    h2('createAuthClient(options?)'),
    p('Creates a framework-agnostic auth client. Import from @gately/auth-client.'),
    codeBlock(`import { createAuthClient } from '@gately/auth-client'
const authClient = createAuthClient({ baseURL: 'https://my-auth.workers.dev' })`, 'typescript'),
    paramField('baseURL', 'string', false, 'Base URL of your auth Worker. Defaults to the current origin.'),
    paramField('basePath', 'string', false, 'Auth route prefix. Default: "/auth".'),
    paramField('credentials', 'string', false, 'Fetch credentials mode. Default: "include".'),
    paramField('fetchOptions', 'FetchOptions', false, 'Global fetch callbacks — onRequest, onSuccess, onError.'),
    paramField('plugins', 'AuthClientPlugin[]', false, 'Client-side plugins to extend the client.'),

    h2('signUp'),
    h3('signUp.email(input, fetchOptions?)'),
    codeBlock(`const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'secret123',
  name: 'Alice',        // optional
  image: 'https://...', // optional
})
// data: { user: User } | null`, 'typescript'),

    h2('signIn'),
    h3('signIn.email(input, fetchOptions?)'),
    codeBlock(`const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'secret123',
  rememberMe: true, // optional
})
// data: SessionData | null`, 'typescript'),

    h3('signIn.magicLink(input, fetchOptions?)'),
    codeBlock(`const { data, error } = await authClient.signIn.magicLink({
  email: 'user@example.com',
  callbackURL: '/dashboard', // optional
})
// data: { success: boolean } | null`, 'typescript'),

    h3('signIn.otp(input, fetchOptions?)'),
    codeBlock(`const { data, error } = await authClient.signIn.otp({
  email: 'user@example.com',
  code: '123456',
  type: 'sign-in', // optional
})
// data: { user: User } | null`, 'typescript'),

    h3('signIn.social(input, fetchOptions?)'),
    codeBlock(`// Redirects the browser to the OAuth provider
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
})`, 'typescript'),

    h2('signOut(fetchOptions?)'),
    codeBlock(`const { data, error } = await authClient.signOut()
// data: { success: boolean } | null`, 'typescript'),

    h2('getSession(fetchOptions?)'),
    codeBlock(`const { data, error } = await authClient.getSession()
// data: SessionData | null`, 'typescript'),
    p('Results are cached in memory. The cache is cleared on sign-out and sign-in.'),

    h2('password'),
    h3('password.sendResetEmail(input, fetchOptions?)'),
    codeBlock(`await authClient.password.sendResetEmail({ email: 'user@example.com' })`, 'typescript'),

    h3('password.reset(input, fetchOptions?)'),
    codeBlock(`await authClient.password.reset({
  token: 'token-from-url',
  newPassword: 'newSecret456',
})`, 'typescript'),

    h2('otp'),
    h3('otp.send(input, fetchOptions?)'),
    codeBlock(`await authClient.otp.send({ email: 'user@example.com', type: 'sign-in' })`, 'typescript'),

    h2('session'),
    h3('session.list(fetchOptions?)'),
    codeBlock(`const { data } = await authClient.session.list()
// data: { sessions: Session[] }`, 'typescript'),

    h3('session.revoke(token, fetchOptions?)'),
    codeBlock(`await authClient.session.revoke('token-to-revoke')`, 'typescript'),

    h3('session.revokeAll(fetchOptions?)'),
    codeBlock(`await authClient.session.revokeAll()`, 'typescript'),

    h2('createReactAuthClient(options?)'),
    p('Extends createAuthClient with a reactive useSession hook. Import from @gately/auth-client/react.'),
    codeBlock(`import { createReactAuthClient } from '@gately/auth-client/react'
const authClient = createReactAuthClient({ baseURL: 'https://my-auth.workers.dev' })`, 'typescript'),

    h2('useSession() — React only'),
    codeBlock(`const { data, isPending, error, refetch } = authClient.useSession()
// data: SessionData | null
// isPending: boolean
// error: ApiError | null
// refetch: () => Promise<void>`, 'typescript'),

    h2('SessionData type'),
    codeBlock(`interface SessionData {
  user: {
    id: string
    email: string
    name: string | null
    image: string | null
    emailVerified: boolean
    [key: string]: unknown
  }
  session: {
    id: string
    userId: string
    token: string
    expiresAt: string
    [key: string]: unknown
  }
}`, 'typescript'),

    h2('ApiError type'),
    codeBlock(`interface ApiError {
  code: string    // e.g. "INVALID_CREDENTIALS"
  message: string // human-readable
  status: number  // HTTP status code
}`, 'typescript'),
  ]),
};
