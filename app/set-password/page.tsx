"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export default function SetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1200);
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
            <div className="text-xs text-slateink">Welcome — set your password</div>
          </div>
        </div>

        {done ? (
          <div className="text-center py-4 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-brandgreen flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-900">Password set — taking you in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              This is a one-time step. Choose a password you'll use to log in from now on.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">New password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-brandblue transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Re-type your password"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-brandblue transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brandblue hover:bg-brandblueDark text-white rounded-xl py-3 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Set password & continue
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}