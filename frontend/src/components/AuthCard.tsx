import type { FormEvent } from "react";
import { BrandLogo } from "./BrandLogo";
import type { AuthMode } from "../types";

interface AuthCardProps {
  mode: AuthMode;
  isLoading: boolean;
  error?: string | null;
  notice?: string | null;
  localError?: string | null;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  apiBaseUrl: string;
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        fill="currentColor"
      />
    </svg>
  );
}

export function AuthCard({
  mode,
  isLoading,
  error,
  notice,
  localError,
  name,
  email,
  password,
  confirmPassword,
  apiBaseUrl,
  onModeChange,
  onSubmit,
  onNameChange,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
}: AuthCardProps) {
  const formError = localError || error;

  return (
    <section className="relative order-1 animate-float-in lg:order-2">
      <div className="rounded-[32px] border border-white/80 bg-white/95 p-5 shadow-[0_26px_80px_rgba(16,32,51,0.12)] backdrop-blur sm:p-7 lg:p-8">
        <div className="lg:hidden">
          <BrandLogo compact showTagline={false} />
        </div>

        {/* Animated tab switcher */}
        <div className="mt-5 inline-grid w-full grid-cols-2 rounded-full border border-slate-200/80 bg-slate-100/90 p-1.5">
          <button
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              mode === "login"
                ? "scale-[1.03] bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => onModeChange("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={`flex-1 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-300 ${
              mode === "register"
                ? "scale-[1.03] bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
            onClick={() => onModeChange("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-400">
            {mode === "login" ? "Welcome back" : "Create account"}
          </p>
          <h2 className="mt-3 text-3xl leading-tight text-slate-900 sm:text-[2.15rem]">
            {mode === "login"
              ? "Sign in and continue your work."
              : "Create your account and get started."}
          </h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-slate-500">
            {mode === "login"
              ? "Return to your projects, tasks, and next steps."
              : "Set up your workspace in a moment and start planning with more clarity."}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {mode === "register" ? (
            <label className="block animate-fade-up" style={{ animationDelay: "0ms" }}>
              <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
              <input
                className="soft-input"
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Jane Builder"
                value={name}
              />
            </label>
          ) : null}

          <label className="block animate-fade-up" style={{ animationDelay: mode === "register" ? "50ms" : "0ms" }}>
            <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
            <input
              autoComplete="email"
              className="soft-input"
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="jane@example.com"
              type="email"
              value={email}
            />
          </label>

          <label className="block animate-fade-up" style={{ animationDelay: mode === "register" ? "100ms" : "50ms" }}>
            <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
            <input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              className="soft-input"
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder={mode === "login" ? "Enter your password" : "At least 8 characters"}
              type="password"
              value={password}
            />
          </label>

          {mode === "register" ? (
            <label className="block animate-fade-up" style={{ animationDelay: "150ms" }}>
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Confirm password
              </span>
              <input
                autoComplete="new-password"
                className="soft-input"
                onChange={(event) => onConfirmPasswordChange(event.target.value)}
                placeholder="Repeat your password"
                type="password"
                value={confirmPassword}
              />
            </label>
          ) : null}

          {notice ? (
            <div className="animate-fade-up rounded-[20px] border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-700">
              {notice}
            </div>
          ) : null}

          {formError ? (
            <div className="animate-fade-up rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-600">
              {formError}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-2xl bg-slate-900 px-5 py-3.5 text-[0.96rem] font-semibold text-white shadow-[0_18px_36px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lift disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? (
              <>
                <Spinner />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5">
          <p className="text-center text-sm text-slate-500">
            {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
            <button
              className="font-semibold text-teal-700 transition-colors duration-200 hover:text-teal-800"
              onClick={() => onModeChange(mode === "login" ? "register" : "login")}
              type="button"
            >
              {mode === "login" ? "Register here" : "Login here"}
            </button>
          </p>

          <p className="mt-4 text-center text-[0.7rem] uppercase tracking-[0.18em] text-slate-300">
            Local API {apiBaseUrl}
          </p>
        </div>
      </div>
    </section>
  );
}
