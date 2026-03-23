"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch(`/api/auth/login?redirect=${encodeURIComponent(redirect)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(data.redirect ?? "/");
    } else {
      setError("Incorrect password.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-page, #0d1117)" }}
    >
      <div
        className="w-full max-w-sm rounded-xl p-8"
        style={{ background: "#161b27", border: "1px solid #2a3345" }}
      >
        <h1
          className="text-xl font-bold mb-6 text-center"
          style={{ color: "#f0f4ff" }}
        >
          Dashboard Login
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            required
            className="w-full rounded-lg px-4 py-2 text-sm outline-none"
            style={{
              background: "#0d1117",
              border: "1px solid #2a3345",
              color: "#f0f4ff",
            }}
          />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
            style={{
              background: loading ? "#374151" : "#ef4444",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
