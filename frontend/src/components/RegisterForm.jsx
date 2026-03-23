import { useState } from "react";

export default function RegisterForm({
  onRegister,
  formErrors = {},
  onSwitchToLogin,
  loading = false,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    await onRegister({
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });
  };

  return (
    <main className="auth-shell">
      <form onSubmit={submit} className="auth-card">
        <span className="section-label">New Workspace</span>
        <h1 className="auth-title mt-4">Create account</h1>
        <p className="auth-copy mt-3">
          Set up your account and jump straight into planning projects and
          tracking work.
        </p>
        <input
          className="app-input mt-6"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoComplete="name"
          disabled={loading}
        />
        {formErrors.name?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.name[0]}</p>
        )}

        <input
          className="app-input mt-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
          disabled={loading}
        />
        {formErrors.email?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.email[0]}</p>
        )}

        <input
          className="app-input mt-3"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="new-password"
          disabled={loading}
        />
        {formErrors.password?.[0] && (
          <p className="mt-2 text-sm text-red-600">{formErrors.password[0]}</p>
        )}

        <input
          className="app-input mt-3"
          type="password"
          value={passwordConfirmation}
          onChange={(e) => setPasswordConfirmation(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          disabled={loading}
        />

        <button
          disabled={loading}
          className="btn btn-primary mt-5 w-full disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <button
          type="button"
          onClick={onSwitchToLogin}
          disabled={loading}
          className="link-button mt-4 w-full text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          Already have an account? Sign in
        </button>
      </form>
    </main>
  );
}
