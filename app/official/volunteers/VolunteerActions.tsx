"use client";

import { useState, useTransition } from "react";
import { setPosition, setTenureYear, setVolunteerStatus } from "./actions";
import {
  Sparkles,
  GraduationCap,
  UserX,
  CheckCircle2,
  MoreVertical,
  RotateCcw,
  Loader2,
} from "lucide-react";

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
      await setTenureYear(userId, year);
    });
  }

  function handleStatusUpdate(newStatus: "active" | "graduated" | "removed") {
    startTransition(async () => {
      await setVolunteerStatus(userId, newStatus);
      setConfirmModal(null);
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

      {/* Tenure Year Toggle (Year 1 vs Year 2) */}
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

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-base text-slate-900 mb-2">
              {confirmModal === "graduate"
                ? "Mark Tenure Completed?"
                : "Remove Volunteer?"}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              {confirmModal === "graduate"
                ? "This marks the volunteer as Graduated (2-year tenure completed). Their past hours and records will be preserved, but they will no longer actively register for new events."
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
    </div>
  );
}