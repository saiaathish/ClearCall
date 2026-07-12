"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <div className="page-shell" style={{ maxWidth: 440 }}>
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

      <form className="publisher-form" noValidate onSubmit={handleSubmit}>
        {mode === "sign-up" && (
          <div className="form-field">
            <label htmlFor="displayName">Display name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Jordan Lee"
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

        <button
          className="button button--ghost button--wide"
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError(null);
          }}
        >
          {mode === "sign-in" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
