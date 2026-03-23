import { useState } from "react";

export default function LoginForm({
  onLogin,
  onSwitchToRegister,
  loading = false,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onLogin({ email, password });
  };

  return (
    <main className="auth-shell">
      <form onSubmit={submit} className="auth-card">
        <span className="section-label">Welcome Back</span>
        <h1 className="auth-title mt-4">Sign in</h1>
        <p className="auth-copy mt-3">
          Pick up where you left off. Your projects, tasks, and status updates
          are ready when you are.
        </p>
        <input
          className="app-input mt-6"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
        />
        <input
          className="app-input mt-3"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          disabled={loading}
        />
        <button
          disabled={loading}
          className="btn btn-secondary mt-5 w-full disabled:cursor-not-allowed"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
        <button
          type="button"
          onClick={onSwitchToRegister}
          disabled={loading}
          className="link-button mt-4 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Need an account? Create one
        </button>
      </form>
    </main>
  );
}
