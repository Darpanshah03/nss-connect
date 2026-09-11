"use client";

import { useState, useTransition } from "react";
import { createVolunteerAccount } from "./actions";
import {
  UserPlus,
  Loader2,
  Dices,
  Copy,
  CheckCircle2,
  X,
} from "lucide-react";

function generatePassword() {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";

  for (let i = 0; i < 10; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }

  return out;
}

const field =
  "w-full rounded-xl border border-steel bg-white px-3 py-2.5 text-sm text-navy outline-none transition focus:border-saffron focus:ring-2 focus:ring-saffron/20";

const labelCls =
  "mb-1 block text-[11px] font-bold uppercase tracking-wide text-navy/60";

export default function AddVolunteerModal({
  positions,
}: {
  positions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);

    const email = formData.get("email") as string;
    const pwd = formData.get("password") as string;

    startTransition(async () => {
      try {
        await createVolunteerAccount(formData);
        setCreated({
          email,
          password: pwd,
        });
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
    setError(null);
  }

  function handleCopy() {
    if (!created) return;

    navigator.clipboard.writeText(
      `Email: ${created.email}\nPassword: ${created.password}`
    );

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <>
      {/* CREATE VOLUNTEER BUTTON — KEEP THIS VISIBLE */}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-saffron px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-saffron/90 hover:shadow-md active:scale-[0.98]"
      >
        <UserPlus size={15} />
        <span>Create volunteer account</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-steel bg-white p-6 shadow-2xl">
            {created ? (
              <div>
                {/* Success icon */}
                <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brandgreen/10 text-brandgreen">
                  <CheckCircle2 size={27} />
                </div>

                <h3 className="text-center text-lg font-extrabold text-navy">
                  Account created
                </h3>

                <p className="mx-auto mt-1 max-w-xs text-center text-xs text-navy/55">
                  Share these credentials with the volunteer. The password
                  won't be shown again.
                </p>

                {/* Credentials */}
                <div className="mt-4 space-y-2 rounded-2xl border border-steel bg-paper p-4 font-mono text-xs text-navy">
                  <div>
                    <span className="text-navy/45">Email:</span>{" "}
                    {created.email}
                  </div>

                  <div>
                    <span className="text-navy/45">Password:</span>{" "}
                    {created.password}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-steel py-2.5 text-xs font-bold text-navy transition hover:bg-paper"
                  >
                    <Copy size={13} />
                    {copied ? "Copied!" : "Copy credentials"}
                  </button>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-saffron py-2.5 text-xs font-extrabold text-white transition hover:bg-saffron/90"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Modal header */}
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-saffron/10 text-saffron">
                      <UserPlus size={18} />
                    </div>

                    <div>
                      <h3 className="text-lg font-extrabold leading-tight text-navy">
                        New volunteer
                      </h3>

                      <p className="text-xs text-navy/50">
                        Set their login directly — no email sent
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg p-1.5 text-navy/45 transition hover:bg-paper hover:text-navy"
                    aria-label="Close"
                  >
                    <X size={17} />
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-4 rounded-xl border border-wheelred/25 bg-wheelred/10 p-3 text-xs font-semibold text-wheelred">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form action={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className={labelCls}>Email *</label>

                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="volunteer@college.edu.in"
                      className={field}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className={labelCls}>Password *</label>

                    <div className="flex gap-2">
                      <input
                        name="password"
                        type="text"
                        required
                        minLength={8}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className={`${field} flex-1 font-mono`}
                      />

                      <button
                        type="button"
                        onClick={() => setPassword(generatePassword())}
                        title="Generate a password"
                        className="rounded-xl border border-steel bg-white px-3 text-navy/55 transition hover:border-saffron hover:bg-saffron/5 hover:text-saffron"
                      >
                        <Dices size={16} />
                      </button>
                    </div>

                    <p className="mt-1 text-[11px] text-navy/45">
                      Tell the volunteer this password directly — no email is
                      sent.
                    </p>
                  </div>

                  {/* Full name */}
                  <div>
                    <label className={labelCls}>Full name *</label>

                    <input
                      name="full_name"
                      required
                      placeholder="e.g. Rahul Sharma"
                      className={field}
                    />
                  </div>

                  {/* Department + Roll */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Department</label>

                      <input
                        name="department"
                        placeholder="Computer Engg"
                        className={field}
                      />
                    </div>

                    <div>
                      <label className={labelCls}>Roll / PRN</label>

                      <input
                        name="roll_number"
                        placeholder="CS202401"
                        className={field}
                      />
                    </div>
                  </div>

                  {/* Academic + Tenure */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Academic year</label>

                      <select
                        name="year"
                        defaultValue="1"
                        className={field}
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className={labelCls}>NSS tenure year</label>

                      <select
                        name="tenure_year"
                        defaultValue="1"
                        className={field}
                      >
                        <option value="1">
                          Year 1 (New joiner)
                        </option>
                        <option value="2">
                          Year 2 (Senior / Head)
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelCls}>Contact phone</label>

                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      className={field}
                    />
                  </div>

                  {/* Position */}
                  <div>
                    <label className={labelCls}>
                      Core head position (optional)
                    </label>

                    <select
                      name="position"
                      defaultValue=""
                      className={field}
                    >
                      <option value="">
                        No position (Regular volunteer)
                      </option>

                      {positions.map((p) => (
                        <option key={p} value={p}>
                          ⭐ {p}
                        </option>
                      ))}
                    </select>

                    <p className="mt-1 text-[11px] text-navy/45">
                      Custom titles can be set later from the volunteer's row.
                    </p>
                  </div>

                  {/* Form buttons */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={handleClose}
                      className="flex-1 rounded-xl border border-steel py-2.5 text-xs font-bold text-navy/60 transition hover:bg-paper disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={pending}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brandgreen py-2.5 text-xs font-extrabold text-white transition hover:bg-brandgreen/90 disabled:opacity-60"
                    >
                      {pending ? (
                        <>
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                          Creating…
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} />
                          Create account
                        </>
                      )}
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