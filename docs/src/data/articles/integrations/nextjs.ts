import { bn, h2, h3, p, bullet, numbered, codeBlock, callout, codeGroup, step, divider } from '../../blocks';

export const nextjsArticle = {
  id: 'nextjs',
  title: 'Next.js',
  slug: 'nextjs',
  excerpt: 'Use gately-auth with a Next.js app — middleware, server components, and the React client SDK.',
  category_id: 'integrations',
  is_published: true,
  display_order: 1,
  sidebar_title: null as string | null,
  icon: 'hugeicons:nextjs' as string | null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  content: bn([
    p('gately-auth runs as a separate Cloudflare Worker. Your Next.js app communicates with it via the client SDK. This separation keeps your auth logic independent of your Next.js deployment.'),

    h2('Architecture'),
    bullet('Auth Worker — your gately-auth Cloudflare Worker (e.g. auth.myapp.workers.dev)'),
    bullet('Next.js app — deployed anywhere (Vercel, Cloudflare Pages, etc.)'),
    bullet('@gately/auth-client — installed in your Next.js project, talks to the Worker'),

    h2('Install the client SDK'),
    codeBlock('npm install @gately/auth-client', 'bash'),

    h2('Create the auth client'),
    codeBlock(`// src/lib/auth-client.ts
import { createReactAuthClient } from '@gately/auth-client/react'

export const authClient = createReactAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL!,
})

export type Session = typeof authClient.$Infer.Session`, 'typescript'),
    p('Add the environment variable to .env.local:'),
    codeBlock('NEXT_PUBLIC_AUTH_URL=https://auth.myapp.workers.dev', 'bash'),

    h2('Middleware — protect routes'),
    p('Use Next.js middleware to check the session cookie on the server and redirect unauthenticated users:'),
    codeBlock(`// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from '@gately/auth-client'

const PROTECTED = ['/dashboard', '/settings', '/api/protected']

export function middleware(request: NextRequest) {
  const isProtected = PROTECTED.some(path =>
    request.nextUrl.pathname.startsWith(path)
  )

  if (!isProtected) return NextResponse.next()

  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const signIn = new URL('/sign-in', request.url)
    signIn.searchParams.set('callbackURL', request.nextUrl.pathname)
    return NextResponse.redirect(signIn)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}`, 'typescript'),
    callout('info', 'Middleware only checks the cookie exists — it does not verify the signature. For full validation call auth.api.getSession() in a Server Action or Route Handler.'),

    h2('Server component — get session'),
    codeBlock(`// app/dashboard/page.tsx
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('gately-auth.session')?.value
  if (!sessionCookie) return null

  const res = await fetch(\`\${process.env.AUTH_URL}/auth/session\`, {
    headers: { Cookie: \`gately-auth.session=\${sessionCookie}\` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.user ? data : null
}

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/sign-in')

  return <h1>Welcome, {session.user.name}</h1>
}`, 'typescript'),

    h2('Client component — sign in form'),
    codeBlock(`'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function SignInForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)

    const { error } = await authClient.signIn.email({
      email: form.get('email') as string,
      password: form.get('password') as string,
    })

    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {error && <p className="text-red-500">{error}</p>}
      <button type="submit">Sign in</button>
    </form>
  )
}`, 'typescript'),

    h2('CORS configuration'),
    p('In your auth Worker, add your Next.js app origin to trustedOrigins:'),
    codeBlock(`gatelyAuth({
  trustedOrigins: [
    'https://myapp.vercel.app',
    'http://localhost:3000',
  ],
  // ...
})`, 'typescript'),
  ]),
};
