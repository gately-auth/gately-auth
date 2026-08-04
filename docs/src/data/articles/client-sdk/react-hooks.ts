import { bn, h2, p, bullet, codeBlock, callout, codeGroup, divider } from '../../blocks';

export const reactHooksArticle = {
  id: 'react-hooks',
  title: 'React Hooks',
  slug: 'react-hooks',
  excerpt: 'createReactAuthClient and the useSession hook for reactive session state in React apps.',
  category_id: 'client-sdk',
  is_published: true,
  display_order: 2,
  sidebar_title: null as string | null,
  icon: 'hugeicons:react' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('The React client wraps createAuthClient and adds a reactive useSession hook. It is imported from @gately/auth-client/react.'),

    h2('Create the React client'),
    p('Create a shared module that exports your client instance:'),
    codeBlock(`// src/lib/auth-client.ts
import { createReactAuthClient } from '@gately/auth-client/react'

export const authClient = createReactAuthClient({
  baseURL: 'https://my-auth.workers.dev',
})

export type Session = typeof authClient.$Infer.Session`, 'typescript'),

    h2('useSession'),
    p('useSession returns the current session, a loading flag, any error, and a refetch function:'),
    codeBlock(`import { authClient } from '@/lib/auth-client'

export function UserMenu() {
  const { data: session, isPending, error } = authClient.useSession()

  if (isPending) return <Spinner />
  if (!session) return <SignInButton />

  return (
    <div>
      <p>Welcome, {session.user.name}</p>
      <button onClick={() => authClient.signOut()}>Sign out</button>
    </div>
  )
}`, 'typescript'),
    p('The hook automatically fetches the session on mount and updates reactively when the user signs in or out.'),

    h2('useSession return value'),
    bullet('data — SessionData | null. Contains user and session objects.'),
    bullet('isPending — true while the initial session fetch is in flight.'),
    bullet('error — ApiError | null if the fetch failed.'),
    bullet('refetch — async function to manually re-fetch the session.'),

    h2('Sign in and update state'),
    p('Calling signIn.email (or any sign-in method) automatically updates the session state — components using useSession re-render without needing to call refetch:'),
    codeBlock(`export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await authClient.signIn.email({ email, password })
    if (error) setError(error.message)
    // session state updates automatically
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} type="email" />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
      {error && <p>{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  )
}`, 'typescript'),

    h2('Protected route example'),
    codeBlock(`export function ProtectedPage() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) return <LoadingScreen />

  if (!session) {
    // Redirect to sign-in
    window.location.href = '/sign-in'
    return null
  }

  return <Dashboard user={session.user} />
}`, 'typescript'),

    callout('info', 'The React client re-exports all methods from createAuthClient — you only need to import from one place.'),
  ]),
};
