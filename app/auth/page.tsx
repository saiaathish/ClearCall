"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDemo } from "@/context/demo-context";

type Mode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router = useRouter();
  const { user, isDemoSession, enterDemo, signOut, hydrated } = useDemo();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (user) router.replace("/");
  }, [hydrated, router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const supabase = createClient();

    try {
      if (mode === "sign-up") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (signUpError) throw signUpError;

        // profiles row is auto-created by a DB trigger on auth.users insert;
        // fetch it so a display name is available immediately if desired.
        if (data.user) {
          await supabase
            .from("profiles")
            .update({ display_name: displayName || email.split("@")[0] })
            .eq("id", data.user.id);
        }

        if (!data.session) {
          setError("Check your email to confirm your account, then sign in.");
          setMode("sign-in");
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (hydrated && user) {
    return (
      <div className="page-shell auth-shell">
        <p className="page-description">Signed in — taking you back to the feed…</p>
      </div>
    );
  }

  if (hydrated && isDemoSession) {
    return (
      <div className="page-shell auth-shell">
        <header className="page-header">
          <div className="page-header__copy">
            <p className="eyebrow">ClearCall account</p>
            <h1 className="page-title">You&apos;re in the demo</h1>
            <p className="page-description">
              Jordan Lee is the local demo account. Sign out to use a real email account, or keep training in the demo.
            </p>
          </div>
        </header>
        <div className="auth-actions">
          <button className="button button--wide" type="button" onClick={() => router.push("/")}>
            Back to feed
          </button>
          <button
            className="button button--ghost button--wide"
            type="button"
            onClick={() => void signOut().then(() => router.push("/auth"))}
          >
            Sign out of demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell auth-shell">
      <header className="page-header">
        <div className="page-header__copy">
          <p className="eyebrow">ClearCall account</p>
          <h1 className="page-title">{mode === "sign-in" ? "Sign in" : "Create an account"}</h1>
          <p className="page-description">
            {mode === "sign-in"
              ? "Sign in to answer cases, save cases, and publish drafts."
              : "Create an account to track your answers, saves, and published drafts."}
          </p>
        </div>
      </header>

      <div className="auth-tabs" role="tablist" aria-label="Account mode">
        <button
          className="auth-tab"
          type="button"
          role="tab"
          aria-selected={mode === "sign-in"}
          data-active={mode === "sign-in" || undefined}
          onClick={() => {
            setMode("sign-in");
            setError(null);
          }}
        >
          Sign in
        </button>
        <button
          className="auth-tab"
          type="button"
          role="tab"
          aria-selected={mode === "sign-up"}
          data-active={mode === "sign-up" || undefined}
          onClick={() => {
            setMode("sign-up");
            setError(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form className="publisher-form auth-form" noValidate onSubmit={handleSubmit}>
        {mode === "sign-up" && (
          <div className="form-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Jordan Lee"
              autoComplete="nickname"
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <button className="button button--wide" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="auth-actions">
        <button className="button button--ghost button--wide" type="button" onClick={enterDemo}>
          Continue with Jordan Lee demo
        </button>
      </div>
    </div>
  );
}
