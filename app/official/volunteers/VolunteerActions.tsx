"use client";

import { useState, useTransition } from "react";
import {
  setPosition,
  setTenureYear,
  setVolunteerStatus,
  addHourAdjustment,
} from "./actions";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import type { EligibilityResult } from "@/lib/hoursEligibility";
import {
  GraduationCap,
  UserX,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Tent,
  PlusCircle,
} from "lucide-react";

type BlockedAction =
  | { kind: "promote"; targetYear: number; nssYear: 1 | 2; eligibility: EligibilityResult }
  | { kind: "graduate"; nssYear: 1 | 2; eligibility: EligibilityResult };

export default function VolunteerActions({
  userId,
  currentPosition,
  tenureYear,
  status,
  positions,
}: {
  userId: string;
  currentPosition: string | null;
  tenureYear: number;
  status: "active" | "graduated" | "removed";
  positions: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [confirmModal, setConfirmModal] = useState<"graduate" | "remove" | null>(null);
  const [blocked, setBlocked] = useState<BlockedAction | null>(null);

  // Adjustment mini-form state
  const [adjCategory, setAdjCategory] = useState(EVENT_CATEGORIES[0]);
  const [adjHours, setAdjHours] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [adjError, setAdjError] = useState<string | null>(null);

  function handlePositionChange(val: string) {
    if (val === "__custom__") {
      setCustomOpen(true);
      return;
    }
    startTransition(async () => {
      await setPosition(userId, val || null);
    });
  }

  function handleCustomSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customValue.trim()) return;
    startTransition(async () => {
      await setPosition(userId, customValue.trim());
      setCustomOpen(false);
    });
  }

  function handleTenureChange(year: number) {
    startTransition(async () => {
      const result = await setTenureYear(userId, year);
      if (!result.success && result.eligibility) {
        setBlocked({ kind: "promote", targetYear: year, nssYear: 1, eligibility: result.eligibility });
      }
    });
  }

  function handleStatusUpdate(newStatus: "active" | "graduated" | "removed") {
    startTransition(async () => {
      const result = await setVolunteerStatus(userId, newStatus);
      if (!result.success && result.eligibility) {
        setConfirmModal(null);
        setBlocked({ kind: "graduate", nssYear: 2, eligibility: result.eligibility });
        return;
      }
      setConfirmModal(null);
    });
  }

  function handleAddAdjustment() {
    if (!blocked) return;
    setAdjError(null);
    const hoursNum = parseFloat(adjHours);
    if (!hoursNum || hoursNum <= 0) {
      setAdjError("Enter a positive number of hours.");
      return;
    }
    startTransition(async () => {
      try {
        await addHourAdjustment(userId, blocked.nssYear, adjCategory, hoursNum, adjReason);
        setAdjHours("");
        setAdjReason("");
        // Re-run the original action now that hours have changed
        if (blocked.kind === "promote") {
          const result = await setTenureYear(userId, blocked.targetYear);
          if (result.success) {
            setBlocked(null);
          } else if (result.eligibility) {
            setBlocked({ ...blocked, eligibility: result.eligibility });
          }
        } else {
          const result = await setVolunteerStatus(userId, "graduated");
          if (result.success) {
            setBlocked(null);
          } else if (result.eligibility) {
            setBlocked({ ...blocked, eligibility: result.eligibility });
          }
        }
      } catch (e: any) {
        setAdjError(e.message ?? "Could not add adjustment.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Position Selector */}
      <div className="relative">
        <select
          defaultValue={currentPosition ?? ""}
          disabled={pending || status !== "active"}
          onChange={(e) => handlePositionChange(e.target.value)}
          className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 disabled:opacity-60 focus:border-brandblue outline-none"
        >
          <option value="">👤 Volunteer (No Head)</option>
          <optgroup label="⭐ Core Team Positions">
            {positions.map((p) => (
              <option key={p} value={p}>
                ⭐ {p}
              </option>
            ))}
          </optgroup>
          <option value="__custom__">✏️ Custom Position...</option>
        </select>
      </div>

      {/* Tenure Year Toggle */}
      {status === "active" && (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleTenureChange(tenureYear === 1 ? 2 : 1)}
          title="Click to toggle between Year 1 and Year 2"
          className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors"
        >
          Year {tenureYear}
        </button>
      )}

      {/* Graduation / Removal Actions */}
      {status === "active" ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmModal("graduate")}
            title="Mark tenure completed / Graduated"
            className="text-[11px] font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
          >
            <GraduationCap size={13} />
            Graduate
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmModal("remove")}
            title="Remove volunteer"
            className="text-[11px] font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-1.5 rounded-xl transition-colors"
          >
            <UserX size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => handleStatusUpdate("active")}
          className="text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 rounded-xl transition-colors inline-flex items-center gap-1"
        >
          <RotateCcw size={12} />
          Reactivate
        </button>
      )}

      {/* Custom Position Modal */}
      {customOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleCustomSubmit}
            className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-slate-100"
          >
            <h3 className="font-bold text-sm text-slate-900 mb-1">Set Custom Head Position</h3>
            <p className="text-xs text-slate-500 mb-3">
              Assign a unique Core Team title for this volunteer.
            </p>
            <input
              type="text"
              required
              placeholder="e.g. Design & Media Head"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-brandblue mb-4"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCustomOpen(false)}
                className="flex-1 border border-slate-200 rounded-xl py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 bg-brandblue text-white rounded-xl py-2 text-xs font-bold"
              >
                Save Position
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal (graduate / remove) */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 mb-2">
              {confirmModal === "graduate" ? "Mark Tenure Completed?" : "Remove Volunteer?"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {confirmModal === "graduate"
                ? "This checks Year 2 hour requirements and compulsory camp attendance before marking the volunteer as Graduated."
                : "This deactivates the volunteer from the active roster. You can reactivate them later if needed."}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmModal(null)}
                className="flex-1 border border-slate-200 rounded-xl py-2.5 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  handleStatusUpdate(confirmModal === "graduate" ? "graduated" : "removed")
                }
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white shadow-xs ${
                  confirmModal === "graduate"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {confirmModal === "graduate" ? "Graduate Member" : "Remove Volunteer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requirements-Not-Met Modal */}
      {blocked && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle size={18} className="text-amber-600" />
              <h3 className="font-bold text-base text-slate-900">
                {blocked.kind === "promote" ? "Year 1 Requirements Not Met" : "Year 2 Requirements Not Met"}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              {blocked.kind === "promote"
                ? "This volunteer hasn't met the minimum hours to be promoted to Year 2."
                : "This volunteer hasn't met Year 2 requirements to graduate."}
            </p>

            {/* Category breakdown */}
            <div className="space-y-2 mb-4">
              {blocked.eligibility.breakdown.map((b) => (
                <div
                  key={b.category}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                    b.met ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    {b.met ? (
                      <CheckCircle2 size={14} className="text-emerald-600" />
                    ) : (
                      <XCircle size={14} className="text-red-500" />
                    )}
                    {b.category}
                  </span>
                  <span className={`font-mono font-bold ${b.met ? "text-emerald-700" : "text-red-600"}`}>
                    {b.earned}/{b.required} hrs
                  </span>
                </div>
              ))}

              {blocked.kind === "graduate" && (
                <div
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
                    blocked.eligibility.campAttended
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Tent size={14} className={blocked.eligibility.campAttended ? "text-emerald-600" : "text-red-500"} />
                    Special Camp Attendance
                  </span>
                  <span className={`font-bold ${blocked.eligibility.campAttended ? "text-emerald-700" : "text-red-600"}`}>
                    {blocked.eligibility.campAttended ? "Attended" : "Not attended"}
                  </span>
                </div>
              )}
            </div>

            {/* Add adjustment form */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                <PlusCircle size={13} />
                Add Adjustment Hours (Override)
              </div>

              {adjError && (
                <div className="text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                  {adjError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mb-2">
                <select
                  value={adjCategory}
                  onChange={(e) => setAdjCategory(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white outline-none focus:border-brandblue"
                >
                  {EVENT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  placeholder="Hours"
                  value={adjHours}
                  onChange={(e) => setAdjHours(e.target.value)}
                  className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-brandblue"
                />
              </div>
              <input
                type="text"
                placeholder="Reason (e.g. offline drive not logged in system)"
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 mb-2 outline-none focus:border-brandblue"
              />
              <button
                type="button"
                disabled={pending}
                onClick={handleAddAdjustment}
                className="w-full bg-brandblue hover:bg-brandblueDark text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {pending ? <Loader2 size={13} className="animate-spin" /> : null}
                Add Hours & Retry
              </button>
            </div>

            <button
              type="button"
              onClick={() => setBlocked(null)}
              className="w-full mt-3 text-xs font-semibold text-slate-500 hover:text-slate-700 py-1"
            >
              Close without proceeding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}