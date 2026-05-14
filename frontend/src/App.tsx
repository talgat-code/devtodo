import { useEffect, useState } from "react";
import { api, getApiBaseUrl, getErrorMessage } from "./api/client";
import { AuthPage } from "./components/AuthPage";
import { Dashboard } from "./components/Dashboard";
import type { LoginInput, RegisterInput, User } from "./types";

const accessTokenKey = "devtodo.access_token";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-card w-full max-w-md animate-float-in p-8 text-center">
        <div className="mx-auto h-16 w-16 animate-slow-pulse rounded-full bg-teal-100" />
        <h1 className="mt-6 text-3xl text-slate-900">Opening DevToDo</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Checking your saved session and loading the dashboard.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(accessTokenKey),
  );
  const [user, setUser] = useState<User | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(token));
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setIsBootstrapping(false);
      return;
    }

    let isActive = true;

    async function loadCurrentUser(activeToken: string) {
      setIsBootstrapping(true);

      try {
        const currentUser = await api.me(activeToken);
        if (!isActive) {
          return;
        }

        setUser(currentUser);
        setAuthError(null);
      } catch {
        if (!isActive) {
          return;
        }

        localStorage.removeItem(accessTokenKey);
        setToken(null);
        setUser(null);
        setAuthNotice("Your saved session expired, so please log in again.");
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    }

    loadCurrentUser(token);

    return () => {
      isActive = false;
    };
  }, [token]);

  function saveSession(nextToken: string, nextUser: User) {
    localStorage.setItem(accessTokenKey, nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setAuthError(null);
    setAuthNotice(null);
  }

  async function handleLogin(values: LoginInput) {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);

    try {
      const result = await api.login(values);
      saveSession(result.access_token, result.user);
    } catch (error) {
      setAuthError(getErrorMessage(error, "Could not log in."));
    } finally {
      setIsAuthLoading(false);
    }
  }

  async function handleRegister(values: RegisterInput) {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthNotice(null);

    try {
      await api.register(values);
      const result = await api.login({
        email: values.email,
        password: values.password,
      });
      saveSession(result.access_token, result.user);
    } catch (error) {
      setAuthError(getErrorMessage(error, "Could not create account."));
    } finally {
      setIsAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem(accessTokenKey);
    setToken(null);
    setUser(null);
    setAuthError(null);
    setAuthNotice("You have been logged out.");
  }

  function handleUnauthorized() {
    localStorage.removeItem(accessTokenKey);
    setToken(null);
    setUser(null);
    setAuthError(null);
    setAuthNotice("Your session is no longer valid. Please log in again.");
  }

  if (token && isBootstrapping) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <AuthPage
        apiBaseUrl={getApiBaseUrl()}
        error={authError}
        isLoading={isAuthLoading}
        notice={authNotice}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  return (
    <Dashboard
      onLogout={handleLogout}
      onUnauthorized={handleUnauthorized}
      token={token || ""}
      user={user}
    />
  );
}
