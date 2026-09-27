import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, FormError } from "@/components/forms/Field";
import { getSupabaseClient } from "@/admin/lib/supabase";
import { navigate } from "@/lib/router";

const GENERIC_ERROR = "Invalid email or password.";

/** Email + password sign-in. Never reveals whether the email or the password was wrong. */
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInError } = await getSupabaseClient().auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(GENERIC_ERROR);
        return;
      }
      navigate("/admin", { replace: true });
    } catch {
      setError(GENERIC_ERROR);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
      <p className="eyebrow text-champagne">HP Auto</p>
      <h1 className="mt-2 font-display text-4xl">Admin sign in</h1>
      <form onSubmit={event => void handleSubmit(event)} noValidate className="mt-10 space-y-8">
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
        <Field
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
        {error && <FormError message={error} />}
        <Button type="submit" variant="luxe" size="lg" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
