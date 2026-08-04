"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Sign-in page — email/password + magic link + social
// ─────────────────────────────────────────────────────────────────────────────

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "password" | "magic-link";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      if (mode === "password") {
        const { data, error: err } = await authClient.signIn.email({
          email,
          password,
        });
        if (err) { setError(err.message); return; }
        router.push("/dashboard");
      } else {
        const { error: err } = await authClient.signIn.magicLink({
          email,
          callbackURL: "/dashboard",
        });
        if (err) { setError(err.message); return; }
        setMagicLinkSent(true);
      }
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
  }

  async function handleGitHub() {
    await authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" });
  }

  if (magicLinkSent) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.title}>Check your email</h1>
          <p style={styles.subtitle}>
            We sent a sign-in link to <strong>{email}</strong>.
            <br />It expires in 15 minutes.
          </p>
          <button style={styles.linkBtn} onClick={() => setMagicLinkSent(false)}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Sign in</h1>

        {/* Social buttons */}
        <div style={styles.socialRow}>
          <button style={styles.socialBtn} onClick={handleGoogle} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          <button style={styles.socialBtn} onClick={handleGitHub} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            Continue with GitHub
          </button>
        </div>

        <div style={styles.divider}>
          <span style={styles.dividerText}>or</span>
        </div>

        {/* Mode toggle */}
        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeBtn, ...(mode === "password" ? styles.modeBtnActive : {}) }}
            onClick={() => setMode("password")}
            type="button"
          >
            Password
          </button>
          <button
            style={{ ...styles.modeBtn, ...(mode === "magic-link" ? styles.modeBtnActive : {}) }}
            onClick={() => setMode("magic-link")}
            type="button"
          >
            Magic link
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            style={styles.input}
          />

          {mode === "password" && (
            <>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={styles.input}
              />
              <div style={{ textAlign: "right", marginBottom: 16 }}>
                <a href="/forgot-password" style={styles.link}>Forgot password?</a>
              </div>
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={pending} style={styles.submitBtn}>
            {pending
              ? "..."
              : mode === "password"
              ? "Sign in"
              : "Send magic link"}
          </button>
        </form>

        <p style={styles.footer}>
          Don&apos;t have an account?{" "}
          <a href="/sign-up" style={styles.link}>Sign up</a>
        </p>
      </div>
    </div>
  );
}

// ── Styles (inline to keep example self-contained) ────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9fafb", padding: "20px" },
  card: { background: "#fff", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.05)" },
  title: { margin: "0 0 4px", fontSize: 24, fontWeight: 700, color: "#111827" },
  subtitle: { margin: "0 0 24px", fontSize: 15, color: "#6b7280", lineHeight: 1.5 },
  socialRow: { display: "flex", flexDirection: "column", gap: 10 },
  socialBtn: { display: "flex", alignItems: "center", gap: 10, justifyContent: "center", padding: "11px 16px", border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", fontSize: 14, fontWeight: 500, cursor: "pointer", color: "#374151" },
  divider: { display: "flex", alignItems: "center", margin: "24px 0", gap: 12 },
  dividerText: { color: "#9ca3af", fontSize: 13, flexShrink: 0 },
  modeToggle: { display: "flex", background: "#f3f4f6", borderRadius: 8, padding: 4, marginBottom: 20, gap: 4 },
  modeBtn: { flex: 1, padding: "8px 12px", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6b7280" },
  modeBtnActive: { background: "#fff", color: "#111827", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 },
  input: { padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 15, marginBottom: 16, outline: "none" },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12 },
  submitBtn: { padding: "12px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 4 },
  footer: { marginTop: 24, textAlign: "center", fontSize: 14, color: "#6b7280" },
  link: { color: "#111827", fontWeight: 500 },
  linkBtn: { background: "none", border: "none", color: "#111827", cursor: "pointer", fontSize: 14, padding: 0 },
};
