"use client";

import { useState, useTransition } from "react";
import { postEvent } from "./actions";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import {
  Plus,
  X,
  FileText,
  MapPin,
  UserRound,
  Clock3,
  Send,
  Loader2,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

export default function PostEventModal() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await postEvent(formData);
        setOpen(false);
      } catch (e: any) {
        setError(e.message ?? "Could not post this event.");
      }
    });
  }

  return (
    <>
      {/* Trigger banner/card — where the inline form used to sit */}
      <div className="rounded-3xl border border-[#dce4ef] bg-gradient-to-r from-white to-orange-50/60 p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <CalendarDays className="h-7 w-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#10213f]">Ready to post a new event?</h2>
            <p className="mt-1 text-sm text-[#64748b]">
              Set the date, location, category, and verified hours in one step.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
        >
          <Plus className="h-4 w-4" />
          Post New Event
        </button>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          onMouseDown={() => {
            if (!pending) setOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#dce4ef] bg-white shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-[#e5eaf1] bg-gradient-to-r from-white to-orange-50/60 px-6 py-5 sm:px-7 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#10213f]">Post a New Event</h2>
                  <p className="mt-0.5 text-xs text-[#94a3b8]">
                    Set date, location, verified hours, and capacity
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form action={handleSubmit} className="space-y-5 p-6 sm:p-7">
              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Event title */}
              <div>
                <label htmlFor="event-title" className="mb-2 block text-xs font-bold text-[#334155]">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="event-title"
                    name="title"
                    required
                    placeholder="e.g. Mega Blood Donation Camp 2026"
                    className="!h-11 !border !border-[#d8e1ed] !bg-white !pl-10 !text-[#10213f] placeholder:!text-[#94a3b8] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                  />
                </div>
              </div>

              {/* Category / date / time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="category" className="mb-2 block text-xs font-bold text-[#334155]">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    defaultValue={EVENT_CATEGORIES[0]}
                    className="!h-11 !cursor-pointer !border !border-[#d8e1ed] !bg-white !text-[#10213f] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                  >
                    {EVENT_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="event-date" className="mb-2 block text-xs font-bold text-[#334155]">
                    Event Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="event-date"
                    name="event_date"
                    type="date"
                    required
                    className="!h-11 !border !border-[#d8e1ed] !bg-white !text-[#10213f] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                  />
                </div>

                <div>
                  <label htmlFor="event-time" className="mb-2 block text-xs font-bold text-[#334155]">
                    Time / Slot
                  </label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="event-time"
                      name="event_time"
                      placeholder="09:00 AM - 01:00 PM"
                      className="!h-11 !border !border-[#d8e1ed] !bg-white !pl-10 !text-[#10213f] placeholder:!text-[#94a3b8] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Location / Capacity / Hours */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label htmlFor="location" className="mb-2 block text-xs font-bold text-[#334155]">
                    Location / Venue <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="location"
                      name="location"
                      required
                      placeholder="e.g. College Auditorium / Seminar Hall"
                      className="!h-11 !border !border-[#d8e1ed] !bg-white !pl-10 !text-[#10213f] placeholder:!text-[#94a3b8] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="capacity" className="mb-2 block text-xs font-bold text-[#334155]">
                    Capacity Limit (FCFS) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      defaultValue="30"
                      required
                      placeholder="Max spots"
                      className="!h-11 !border !border-[#d8e1ed] !bg-white !pl-10 !text-[#10213f] placeholder:!text-[#94a3b8] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="hours-value" className="mb-2 block text-xs font-bold text-[#334155]">
                    Hours Value <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock3 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="hours-value"
                      name="hours_value"
                      type="number"
                      step="0.5"
                      min="0.5"
                      defaultValue="4"
                      required
                      placeholder="Hours awarded"
                      className="!h-11 !border !border-[#d8e1ed] !bg-white !pl-10 !text-[#10213f] placeholder:!text-[#94a3b8] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="mb-2 block text-xs font-bold text-[#334155]">
                  Description / Volunteer Instructions{" "}
                  <span className="font-normal text-[#94a3b8]">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Details on requirements, dress code (NSS badge/T-shirt), reporting time, etc."
                  className="!min-h-[105px] !resize-y !border !border-[#d8e1ed] !bg-white !py-3 !text-[#10213f] placeholder:!text-[#94a3b8] focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-500/10"
                />
              </div>

              {/* Submit */}
              <div className="flex flex-col gap-3 border-t border-[#e5eaf1] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-5 text-[#94a3b8]">
                  Make sure the event information is accurate before posting.
                </p>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="flex-1 sm:flex-none rounded-xl border border-[#d8e1ed] px-5 h-11 text-sm font-bold text-[#64748b] transition hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="flex-1 sm:flex-none inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition-all hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Post Event Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}