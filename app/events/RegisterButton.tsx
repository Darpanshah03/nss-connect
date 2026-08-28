"use client";

import { useState, useTransition } from "react";
import { registerForEvent } from "./actions";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export default function RegisterButton({
  eventId,
  eventTitle,
  isRegistered,
  isFull,
  spotsLeft,
  hoursValue,
  isInactive,
}: {
  eventId: string;
  eventTitle: string;
  isRegistered: boolean;
  isFull: boolean;
  spotsLeft?: number;
  hoursValue?: number;
  isInactive?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (isRegistered) {
    return (
      <span className="inline-flex items-center justify-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl whitespace-nowrap shadow-2xs">
        <CheckCircle2 size={14} className="text-brandgreen" />
        Registered ✓
      </span>
    );
  }

  if (isInactive) {
    return (
      <span className="text-xs font-medium bg-slate-100 text-slate-400 px-3 py-2 rounded-xl whitespace-nowrap cursor-not-allowed">
        Account Inactive
      </span>
    );
  }

  if (isFull) {
    return (
      <span className="text-xs font-bold bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-xl whitespace-nowrap">
        Event Full
      </span>
    );
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      try {
        await registerForEvent(eventId);
        setConfirming(false);
      } catch (e: any) {
        setError(e.message ?? "Something went wrong during registration.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="w-full sm:w-auto text-xs font-bold bg-brandblue hover:bg-brandblueDark text-white px-5 py-2.5 rounded-xl whitespace-nowrap shadow-xs transition-all active:scale-[0.98]"
      >
        Register Spot
      </button>

      {confirming && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-brandblue flex items-center justify-center mb-3 font-bold">
              N
            </div>
            <h3 className="font-bold text-base text-slate-900 mb-1">Confirm Registration</h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              You are securing a spot for <strong className="text-slate-900 font-semibold">{eventTitle}</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-[11px] text-amber-900 flex items-start gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-600 mt-0.5" />
              <span>
                <strong>First-Come, First-Serve:</strong> Spots are strictly limited ({spotsLeft ?? 0} remaining). Once confirmed, spots cannot be cancelled to maintain accurate headcount.
              </span>
            </div>

            {hoursValue !== undefined && hoursValue > 0 && (
              <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-2.5 mb-4 text-center font-medium">
                Verified Credit: <span className="font-bold text-brandgreen font-mono">+{hoursValue} Hours</span> upon attendance.
              </div>
            )}

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl p-2.5 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-2.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setError(null);
                  setConfirming(false);
                }}
                className="flex-1 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl py-2.5 text-xs font-semibold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="flex-1 bg-brandblue hover:bg-brandblueDark text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                {pending ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Confirming…
                  </>
                ) : (
                  "Confirm & Secure Spot"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

