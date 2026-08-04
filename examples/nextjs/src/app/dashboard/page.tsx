"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/sign-in");
    }
  }, [session, isPending, router]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/sign-in");
  }

  if (isPending) {
    return (
      <div style={styles.container}>
        <div style={styles.spinner} />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Avatar */}
        <div style={styles.avatarRing}>
          {session.user.image ? (
            <img src={session.user.image} alt="avatar" style={styles.avatar} />
          ) : (
            <div style={styles.avatarFallback}>
              {(session.user.name ?? session.user.email)[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <h1 style={styles.name}>{session.user.name ?? "Welcome!"}</h1>
        <p style={styles.email}>{session.user.email}</p>

        <div style={styles.badge}>
          {session.user.emailVerified ? "✓ Email verified" : "⚠ Email not verified"}
        </div>

        {/* Session info */}
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>User ID</span>
            <code style={styles.infoValue}>{session.user.id.slice(0, 8)}…</code>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.infoLabel}>Session expires</span>
            <span style={styles.infoValue}>
              {new Date(session.session.expiresAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div style={styles.actions}>
          <a href="/profile" style={styles.secondaryBtn}>Edit profile</a>
          <button onClick={handleSignOut} style={styles.signOutBtn}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f9fafb" },
  card: { background: "#fff", borderRadius: 16, padding: "40px 36px", maxWidth: 420, width: "100%", textAlign: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  avatarRing: { width: 80, height: 80, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: "3px solid #e5e7eb" },
  avatar: { width: "100%", height: "100%", objectFit: "cover" },
  avatarFallback: { width: "100%", height: "100%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700 },
  name: { margin: "0 0 4px", fontSize: 22, fontWeight: 700, color: "#111827" },
  email: { margin: "0 0 16px", fontSize: 15, color: "#6b7280" },
  badge: { display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "#f0fdf4", color: "#16a34a", fontSize: 13, fontWeight: 500, marginBottom: 24 },
  infoBox: { background: "#f9fafb", borderRadius: 10, padding: "16px 20px", marginBottom: 24, textAlign: "left" },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" },
  infoLabel: { fontSize: 13, color: "#6b7280" },
  infoValue: { fontSize: 13, color: "#111827", fontFamily: "monospace" },
  actions: { display: "flex", gap: 12 },
  secondaryBtn: { flex: 1, padding: "10px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#374151", textDecoration: "none", textAlign: "center" },
  signOutBtn: { flex: 1, padding: "10px", background: "#111827", border: "none", borderRadius: 8, fontSize: 14, fontWeight: 500, color: "#fff", cursor: "pointer" },
  spinner: { width: 32, height: 32, border: "3px solid #e5e7eb", borderTopColor: "#111827", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
};
