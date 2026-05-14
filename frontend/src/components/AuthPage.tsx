import { useState } from "react";
import type { FormEvent } from "react";
import type { AuthMode, LoginInput, RegisterInput } from "../types";
import { AuthCard } from "./AuthCard";
import { HeroSection } from "./HeroSection";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fcfaf6] px-4 py-8 sm:px-6 sm:py-10">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,243,239,0.9),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,243,229,0.95),transparent_28%),linear-gradient(180deg,#fffdfa_0%,#fcfaf6_46%,#f7fbfb_100%)]" />
        <div className="absolute left-[4%] top-[6%] h-56 w-56 rounded-full bg-teal-100/70 blur-3xl sm:h-72 sm:w-72" />
        <div className="absolute bottom-[6%] right-[8%] h-64 w-64 rounded-full bg-amber-100/70 blur-3xl sm:h-80 sm:w-80" />
      </div>

      <div className="relative grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:gap-14">
        <HeroSection />

        <AuthCard
          apiBaseUrl={apiBaseUrl}
          confirmPassword={confirmPassword}
          email={email}
          error={error}
          isLoading={isLoading}
          localError={localError}
          mode={mode}
          name={name}
          notice={notice}
          onConfirmPasswordChange={setConfirmPassword}
          onEmailChange={setEmail}
          onModeChange={switchMode}
          onNameChange={setName}
          onPasswordChange={setPassword}
          onSubmit={handleSubmit}
          password={password}
        />
      </div>
    </main>
  );
}
