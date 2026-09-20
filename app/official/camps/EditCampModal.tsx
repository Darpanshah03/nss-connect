"use client";

import { useState, useTransition } from "react";
import { updateCamp } from "./actions";
import { Pencil, X, Loader2, AlertTriangle } from "lucide-react";

type CampData = {
  id: string;
  name: string;
  location: string | null;
  start_date: string;
  end_date: string;
  description: string | null;
  hours_value: number;
};

export default function EditCampModal({ camp }: { camp: CampData }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateCamp(camp.id, formData);
        setOpen(false);
      } catch (e: any) {
        setError(e.message ?? "Could not save changes.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Edit camp details"
        className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <Pencil size={15} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onMouseDown={() => {
            if (!pending) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Pencil size={17} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 sm:text-base">Edit Camp</h3>
                  <p className="text-xs text-slate-500">
                    Existing attendance records are untouched.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-3.5 p-5 sm:p-6">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Camp Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={camp.name}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-brandblue"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Start Date *</label>
                  <input
                    name="start_date"
                    type="date"
                    required
                    defaultValue={camp.start_date}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">End Date *</label>
                  <input
                    name="end_date"
                    type="date"
                    required
                    defaultValue={camp.end_date}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Location</label>
                  <input
                    name="location"
                    defaultValue={camp.location ?? ""}
                    placeholder="e.g. Kaas Plateau, Satara"
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Hours Credit</label>
                  <input
                    name="hours_value"
                    type="number"
                    min="0"
                    step="0.5"
                    defaultValue={camp.hours_value}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={camp.description ?? ""}
                  placeholder="Brief description of the camp activities..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>

              <div className="flex gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}