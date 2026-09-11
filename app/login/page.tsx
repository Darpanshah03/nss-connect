"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message.includes("Invalid login")
          ? "Incorrect email or password."
          : error.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink p-12 text-white">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-brandblue/30 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-brandred/25 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brandred to-orange-600 font-display text-xl font-bold">
            N
          </div>
          <div className="font-display text-lg font-bold tracking-tight">NSS Connect</div>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Not me,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-white to-emerald-300">
              but you.
            </span>
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-white/60">
            Track your service hours, register for unit events and camps, and watch your
            two-year NSS tenure come together in one place.
          </p>
        </div>

        <div className="relative flex gap-1.5">
          <span className="h-1 w-16 rounded-full bg-orange-400" />
          <span className="h-1 w-16 rounded-full bg-white/70" />
          <span className="h-1 w-16 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-brandred to-orange-600 font-display text-lg font-bold text-white">
              N
            </div>
            <div>
              <div className="font-display text-base font-bold leading-tight tracking-tight">
                NSS Connect
              </div>
              <div className="text-xs text-muted">National Service Scheme Unit</div>
            </div>
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight">Sign in</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            No account yet? Ask your NSS official to send you an invite.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@college.edu.in"
                  className="input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                />
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-muted">
            NSS Unit · VPPCOE &amp; VA
          </p>
        </div>
      </div>
    </div>
  );
}
