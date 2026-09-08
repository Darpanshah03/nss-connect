"use client";

import { useState, useTransition } from "react";
import { updateEvent, deleteEvent } from "./actions";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import { Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";

type EventData = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  event_date: string;
  event_time: string | null;
  location: string;
  capacity: number;
  hours_value: number;
};

export default function EventActions({ event }: { event: EventData }) {
  const [pending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function handleEditSubmit(formData: FormData) {
    setEditError(null);
    startTransition(async () => {
      try {
        await updateEvent(event.id, formData);
        setEditOpen(false);
      } catch (e: any) {
        setEditError(e.message ?? "Could not save changes.");
      }
    });
  }

  function handleDelete() {
    setDeleteError(null);
    startTransition(async () => {
      try {
        await deleteEvent(event.id);
        setDeleteOpen(false);
      } catch (e: any) {
        setDeleteError(e.message ?? "Could not delete event.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setEditOpen(true)}
        title="Edit event details"
        className="text-xs font-semibold bg-steel/60 hover:bg-steel text-navy/70 p-2 rounded-xl transition-colors"
      >
        <Pencil size={13} />
      </button>
      <button
        type="button"
        onClick={() => setDeleteOpen(true)}
        title="Delete this event"
        className="text-xs font-semibold bg-wheelred/8 hover:bg-wheelred/15 text-wheelred border border-wheelred/25 p-2 rounded-xl transition-colors"
      >
        <Trash2 size={13} />
      </button>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-steel max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-base text-navy mb-1">Edit Event</h3>
            <p className="text-xs text-navy/45 mb-4">
              Registrations and attendance already recorded for this event are untouched.
            </p>

            {editError && (
              <div className="bg-wheelred/8 border border-wheelred/25 text-wheelred rounded-xl p-3 text-xs font-medium mb-3">
                {editError}
              </div>
            )}

            <form action={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">Event Title *</label>
                <input
                  name="title"
                  required
                  defaultValue={event.title}
                  className="w-full border border-steel rounded-xl px-3.5 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-navy/70 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={event.category ?? EVENT_CATEGORIES[0]}
                    className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron bg-white"
                  >
                    {EVENT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy/70 mb-1">Event Date *</label>
                  <input
                    name="event_date"
                    type="date"
                    required
                    defaultValue={event.event_date}
                    className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy/70 mb-1">Time / Slot</label>
                  <input
                    name="event_time"
                    defaultValue={event.event_time ?? ""}
                    placeholder="e.g. 09:00 AM - 01:00 PM"
                    className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-navy/70 mb-1">Location *</label>
                  <input
                    name="location"
                    required
                    defaultValue={event.location}
                    className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy/70 mb-1">Capacity *</label>
                  <input
                    name="capacity"
                    type="number"
                    min="1"
                    required
                    defaultValue={event.capacity}
                    className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-navy/70 mb-1">Hours Value *</label>
                  <input
                    name="hours_value"
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    defaultValue={event.hours_value}
                    className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">Description</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={event.description ?? ""}
                  className="w-full border border-steel rounded-xl px-3.5 py-2 text-xs text-navy outline-none focus:border-saffron"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="flex-1 border border-steel rounded-xl py-2.5 text-xs font-semibold text-navy/60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="flex-1 bg-saffron hover:bg-brandblueDark text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  {pending ? <Loader2 size={14} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 bg-navy/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-wheelred/25">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-wheelred" />
              <h3 className="font-bold text-base text-navy">Delete This Event?</h3>
            </div>
            <p className="text-xs text-navy/60 leading-relaxed mb-2">
              This permanently deletes <strong>{event.title}</strong>.
            </p>
            <p className="text-xs text-wheelred bg-wheelred/6 border border-wheelred/20 rounded-lg p-2.5 mb-4">
              If volunteers already have attendance/hours recorded for this event, deleting it will
              also permanently remove those hours from their records. Use this only for events that
              were posted by mistake or never actually happened.
            </p>
            {deleteError && (
              <div className="text-[11px] text-wheelred bg-wheelred/6 border border-wheelred/20 rounded-lg p-2 mb-2">
                {deleteError}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="flex-1 border border-steel rounded-xl py-2.5 text-xs font-semibold text-navy/60"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleDelete}
                className="flex-1 bg-wheelred hover:bg-red-700 text-white rounded-xl py-2.5 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {pending ? <Loader2 size={13} className="animate-spin" /> : null}
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}