"use client";

import { useState, useTransition } from "react";
import { createVolunteerAccount } from "./actions";
import { UserPlus, Loader2, Dices, Copy, CheckCircle2 } from "lucide-react";

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export default function AddVolunteerModal({
  positions,
}: {
  positions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    const email = formData.get("email") as string;
    const pwd = formData.get("password") as string;

    startTransition(async () => {
      try {
        await createVolunteerAccount(formData);
        setCreated({ email, password: pwd });
      } catch (err: any) {
        setError(err.message || "Failed to create account.");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setCreated(null);
    setPassword("");
    setCopied(false);
  }

  function handleCopy() {
    if (!created) return;
    navigator.clipboard.writeText(`Email: ${created.email}\nPassword: ${created.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold bg-brandblue hover:bg-brandblueDark text-white px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
      >
        <UserPlus size={15} />
        Create Volunteer Account
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {created ? (
              <div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-brandgreen flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="font-bold text-base text-slate-900 text-center mb-1">Account created</h3>
                <p className="text-xs text-slate-500 text-center mb-4">
                  Share these credentials with the volunteer — this password won't be shown again.
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-mono space-y-1 mb-4">
                  <div><span className="text-slate-500">Email:</span> {created.email}</div>
                  <div><span className="text-slate-500">Password:</span> {created.password}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1.5"
                  >
                    <Copy size={13} />
                    {copied ? "Copied!" : "Copy credentials"}
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 bg-brandblue text-white rounded-xl py-2.5 text-xs font-bold"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-brandblue rounded-xl">
                      <UserPlus size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">Create Volunteer Account</h3>
                      <p className="text-xs text-slateink">Set their login directly — no email needed</p>
                    </div>
                  </div>
                  <button type="button" onClick={handleClose} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs mb-4">
                    {error}
                  </div>
                )}

                <form action={handleSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="volunteer@college.edu.in"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                    <div className="flex gap-2">
                      <input
                        name="password"
                        type="text"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-800 outline-none focus:border-brandblue"
                      />
                      <button
                        type="button"
                        onClick={() => setPassword(generatePassword())}
                        title="Generate a password"
                        className="border border-slate-200 rounded-xl px-3 text-slate-600 hover:bg-slate-50"
                      >
                        <Dices size={16} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slateink mt-1">
                      Tell the volunteer this password directly — no email is sent.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                    <input
                      name="full_name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                      <input name="department" placeholder="e.g. Computer Engg" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / PRN No.</label>
                      <input name="roll_number" placeholder="e.g. CS202401" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                      <select name="year" defaultValue="1" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white">
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">NSS Tenure Year</label>
                      <select name="tenure_year" defaultValue="1" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white">
                        <option value="1">Year 1 (New Joiner)</option>
                        <option value="2">Year 2 (Senior / Head)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number</label>
                    <input name="phone" type="tel" placeholder="+91 98765 43210" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Core Head Position (Optional)</label>
                    <select name="position" defaultValue="" className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white">
                      <option value="">No position (Regular Volunteer)</option>
                      {positions.map((p) => (
                        <option key={p} value={p}>⭐ {p}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slateink mt-1">Custom titles can be set afterward from the volunteer's row.</p>
                  </div>

                  <div className="pt-2 flex gap-2.5">
                    <button type="button" disabled={pending} onClick={handleClose} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={pending} className="flex-1 bg-brandblue hover:bg-brandblueDark text-white rounded-xl py-2.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5">
                      {pending ? (<><Loader2 size={14} className="animate-spin" />Creating...</>) : "Create Account"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}