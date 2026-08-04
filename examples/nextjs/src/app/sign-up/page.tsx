"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const { data, error: err } = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (err) {
        setError(err.message);
        return;
      }

      router.push("/dashboard");
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create account</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
            required
            autoComplete="name"
            style={styles.input}
          />

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

          <label style={styles.label}>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={pending} style={styles.submitBtn}>
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <a href="/sign-in" style={styles.link}>Sign in</a>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9fafb", padding: "20px" },
  card: { background: "#fff", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 400, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  title: { margin: "0 0 28px", fontSize: 24, fontWeight: 700, color: "#111827" },
  form: { display: "flex", flexDirection: "column" },
  label: { fontSize: 14, fontWeight: 500, color: "#374151", marginBottom: 6 },
  input: { padding: "10px 12px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 15, marginBottom: 16, outline: "none" },
  error: { color: "#dc2626", fontSize: 13, marginBottom: 12 },
  submitBtn: { padding: "12px", background: "#111827", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" },
  footer: { marginTop: 24, textAlign: "center", fontSize: 14, color: "#6b7280" },
  link: { color: "#111827", fontWeight: 500 },
};
