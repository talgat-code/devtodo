import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthMode, LoginInput, RegisterInput } from "../types";

interface AuthPageProps {
  isLoading: boolean;
  error?: string | null;
  notice?: string | null;
  apiBaseUrl: string;
  onLogin: (values: LoginInput) => void | Promise<void>;
  onRegister: (values: RegisterInput) => void | Promise<void>;
}

export function AuthPage({
  isLoading,
  error,
  notice,
  apiBaseUrl,
  onLogin,
  onRegister,
}: AuthPageProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setLocalError("Email is required.");
      return;
    }

    if (!password.trim()) {
      setLocalError("Password is required.");
      return;
    }

    if (mode === "register") {
      const normalizedName = name.trim();
      if (!normalizedName) {
        setLocalError("Name is required.");
        return;
      }

      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setLocalError("Passwords do not match.");
        return;
      }

      setLocalError(null);
      await onRegister({
        name: normalizedName,
        email: normalizedEmail,
        password,
      });
      return;
    }

    setLocalError(null);
    await onLogin({
      email: normalizedEmail,
      password,
    });
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setLocalError(null);
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-[10%] h-52 w-52 rounded-full bg-teal-100 blur-3xl" />
        <div className="absolute bottom-[12%] right-[10%] h-64 w-64 rounded-full bg-coral-100 blur-3xl" />
        <div className="absolute right-[24%] top-[18%] h-28 w-28 rounded-full bg-sky-100 blur-2xl" />
      </div>

      <div className="relative grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="surface-card relative hidden animate-float-in overflow-hidden p-8 lg:block lg:p-10">
          <div className="absolute right-8 top-8 h-28 w-28 rounded-full bg-teal-100/80 blur-2xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
            DevToDo
          </p>
          <h1 className="relative mt-5 max-w-xl text-5xl leading-tight text-slate-900">
            A calm space for projects, priorities, and steady progress.
          </h1>
          <p className="relative mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Track your work with a board that feels light, modern, and easy to keep
            up to date.
          </p>

          <div className="relative mt-10 grid gap-4">
            {[
              "Secure JWT login with your existing Go backend",
              "Color-coded projects with clean task grouping",
              "Quick edits for status, priority, and due dates",
            ].map((item) => (
              <div
                className="rounded-[24px] border border-white/80 bg-white/80 px-5 py-4 text-sm text-slate-600 shadow-sm"
                key={item}
              >
                {item}
              </div>
            ))}
          </div>

          <div className="relative mt-10 rounded-[28px] border border-slate-200/80 bg-slate-950 px-6 py-5 text-slate-100 shadow-glow">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200">
              API target
            </p>
            <p className="mt-3 break-all text-sm leading-6 text-slate-200">{apiBaseUrl}</p>
          </div>
        </section>

        <section className="surface-card animate-float-in p-6 sm:p-8 lg:p-10">
          <div className="flex gap-3 rounded-full bg-sand p-1.5">
            <button
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Login
            </button>
            <button
              className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              onClick={() => switchMode("register")}
              type="button"
            >
              Register
            </button>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-600">
              {mode === "login" ? "Welcome back" : "Create account"}
            </p>
            <h2 className="mt-3 text-4xl text-slate-900">
              {mode === "login" ? "Sign in to your dashboard" : "Set up your workspace"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {mode === "login"
                ? "Use the account created through the Go API and pick up where you left off."
                : "A fresh DevToDo account takes only a moment, then you can jump right into projects and tasks."}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
                <input
                  className="soft-input"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Builder"
                  value={name}
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
              <input
                autoComplete="email"
                className="soft-input"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="jane@example.com"
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="soft-input"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                type="password"
                value={password}
              />
            </label>

            {mode === "register" ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Confirm password
                </span>
                <input
                  autoComplete="new-password"
                  className="soft-input"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  type="password"
                  value={confirmPassword}
                />
              </label>
            ) : null}

            {notice ? (
              <div className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-700">
                {notice}
              </div>
            ) : null}

            {localError || error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                {localError || error}
              </div>
            ) : null}

            <button className="primary-button w-full" disabled={isLoading} type="submit">
              {isLoading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                  ? "Login"
                  : "Register and continue"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
            <button
              className="font-semibold text-teal-700 transition hover:text-teal-800"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              type="button"
            >
              {mode === "login" ? "Register here" : "Login here"}
            </button>
          </p>
        </section>
      </div>
    </main>
  );
}
