"use client";

import { useState, useTransition } from "react";
import { inviteVolunteer } from "./actions";
import { UserPlus, Loader2 } from "lucide-react";

export default function AddVolunteerModal({
  positions,
}: {
  positions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await inviteVolunteer(formData);
        setOpen(false);
      } catch (err: any) {
        setError(err.message || "Failed to send invite.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-bold bg-brandblue hover:bg-brandblueDark text-white px-4 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98]"
      >
        <UserPlus size={15} />
        Invite Volunteer
      </button>

      {open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-50 text-brandblue rounded-xl">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Invite New Volunteer</h3>
                  <p className="text-xs text-slateink">They'll get an email to set their password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-xs mb-4">
                {error}
              </div>
            )}

            <form action={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email *
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="volunteer@college.edu.in"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
                <p className="text-[11px] text-slateink mt-1">
                  They'll get a one-time email to set their password and log in.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  name="full_name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    name="department"
                    placeholder="e.g. Computer Engg"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll / PRN No.
                  </label>
                  <input
                    name="roll_number"
                    placeholder="e.g. CS202401"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    name="year"
                    defaultValue="1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NSS Tenure Year
                  </label>
                  <select
                    name="tenure_year"
                    defaultValue="1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                  >
                    <option value="1">Year 1 (New Joiner)</option>
                    <option value="2">Year 2 (Senior / Head)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Core Head Position (Optional)
                </label>
                <select
                  name="position"
                  defaultValue=""
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                >
                  <option value="">No position (Regular Volunteer)</option>
                  {positions.map((p) => (
                    <option key={p} value={p}>
                      ⭐ {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-brandblue hover:bg-brandblueDark text-white rounded-xl py-2.5 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5"
                >
                  {pending ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Sending invite...
                    </>
                  ) : (
                    "Send Invite"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}