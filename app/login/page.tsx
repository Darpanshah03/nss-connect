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
    <div className="min-h-screen flex items-center justify-center bg-[#F1F3F6] px-4 py-8">
      <div className="w-full max-w-sm bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-8 shadow-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brandred to-orange-600 flex items-center justify-center text-white font-extrabold text-lg shadow-xs">
            N
          </div>
          <div>
            <div className="font-extrabold text-base tracking-tight text-slate-900 leading-tight">
              NSS Connect
            </div>
            <div className="text-xs text-slateink">National Service Scheme Unit</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="font-bold text-sm text-slate-900 mb-1">Sign In</h2>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Don't have an account yet? Ask your NSS official account to invite you.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@college.edu.in"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-brandblue transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-brandblue transition-colors"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brandblue hover:bg-brandblueDark text-white rounded-xl py-3 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}