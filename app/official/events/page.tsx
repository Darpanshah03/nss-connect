import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import { postEvent } from "./actions";
import EventActions from "./EventActions";
import Link from "next/link";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import ExportButton from "@/components/ExportButton";
import {
  CalendarDays,
  Plus,
  Users,
  CheckCircle2,
} from "lucide-react";

export default async function OfficialEventsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "official") redirect("/dashboard");

  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, category, event_date, event_time, location, capacity, hours_value, status, registrations(count)")
    .order("event_date", { ascending: false });

  const eventList = events ?? [];
  const upcomingEvents = eventList.filter((e) => e.status === "upcoming");
  const pastEvents = eventList.filter((e) => e.status !== "upcoming");

  const { data: allAttendance } = await supabase
    .from("attendance")
    .select(
      "present, hours_awarded, events(title, event_date, category), profiles:user_id(full_name, department, roll_number)"
    )
    .order("marked_at", { ascending: false });

  const allAttendanceRows = (allAttendance ?? []).map((a: any) => ({
    Event: a.events?.title ?? "",
    Date: a.events?.event_date ?? "",
    Category: a.events?.category ?? "",
    Volunteer: a.profiles?.full_name ?? "",
    Department: a.profiles?.department ?? "",
    "Roll Number": a.profiles?.roll_number ?? "",
    Present: a.present ? "Yes" : "No",
    "Hours Awarded": a.hours_awarded,
  }));

  return (
    <div className="md:flex min-h-screen bg-paper">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy">Manage NSS Events</h1>
            <p className="text-xs sm:text-sm text-navy/50 mt-0.5">
              Post new unit events, set FCFS registration limits, and mark verified attendance.
            </p>
          </div>
          <ExportButton
            filename="nss-all-attendance"
            rows={allAttendanceRows}
            label="Export All Attendance"
          />
        </div>

        {/* Post Event Form Card */}
        <div className="chakra-motif relative overflow-hidden bg-white border border-steel rounded-3xl p-5 sm:p-6 mb-8">
          <div className="relative z-10 flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-saffron/12 text-saffron flex items-center justify-center font-bold">
              <Plus size={18} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-navy">Post a New Event</h2>
              <p className="text-xs text-navy/45">Set date, location, verified hours, and capacity</p>
            </div>
          </div>

          <form action={postEvent} className="relative z-10 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">
                Event Title *
              </label>
              <input
                name="title"
                required
                placeholder="e.g. Mega Blood Donation Camp 2026"
                className="w-full border border-steel rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-navy outline-none focus:border-saffron"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">
                  Category *
                </label>
                <select
                  name="category"
                  defaultValue={EVENT_CATEGORIES[0]}
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
                <label className="block text-xs font-semibold text-navy/70 mb-1">
                  Event Date *
                </label>
                <input
                  name="event_date"
                  type="date"
                  required
                  className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">
                  Time / Slot (Optional)
                </label>
                <input
                  name="event_time"
                  placeholder="e.g. 09:00 AM - 01:00 PM"
                  className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-navy/70 mb-1">
                  Location / Venue *
                </label>
                <input
                  name="location"
                  required
                  placeholder="e.g. College Auditorium / Seminar Hall"
                  className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">
                  Capacity Limit (FCFS) *
                </label>
                <input
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue="30"
                  required
                  placeholder="Max spots"
                  className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-navy/70 mb-1">
                  Hours Value *
                </label>
                <input
                  name="hours_value"
                  type="number"
                  step="0.5"
                  min="0.5"
                  defaultValue="4"
                  required
                  placeholder="Hours awarded"
                  className="w-full border border-steel rounded-xl px-3 py-2.5 text-xs text-navy outline-none focus:border-saffron"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy/70 mb-1">
                Description / Volunteer Instructions (Optional)
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="Details on requirements, dress code (NSS badge/T-shirt), reporting time, etc."
                className="w-full border border-steel rounded-xl px-3.5 py-2 text-xs text-navy outline-none focus:border-saffron"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-saffron hover:bg-brandblueDark text-white rounded-xl px-6 py-2.5 text-xs font-bold transition-colors"
            >
              Post Event Now
            </button>
          </form>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-8">
          <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
            <CalendarDays size={16} className="text-saffron" />
            Active & Upcoming Events ({upcomingEvents.length})
          </h2>

          <div className="space-y-3">
            {upcomingEvents.map((e: any) => {
              const regCount = e.registrations?.[0]?.count ?? 0;
              const isFull = regCount >= e.capacity;

              return (
                <div
                  key={e.id}
                  className="bg-white border border-steel rounded-2xl p-4 sm:p-5 hover:border-navy/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-navy/5 text-navy/70 px-2 py-0.5 rounded-md">
                        {e.category || "General"}
                      </span>
                      <span className="text-[10px] font-semibold text-green bg-green/8 px-2 py-0.5 rounded-md">
                        +{e.hours_value} hrs
                      </span>
                      {isFull && (
                        <span className="text-[10px] font-bold text-wheelred bg-wheelred/8 border border-wheelred/25 px-2 py-0.5 rounded-md">
                          Full (FCFS)
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-navy">{e.title}</h3>

                    <div className="text-xs text-navy/50 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>
                        {new Date(e.event_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {e.event_time ? ` (${e.event_time})` : ""}
                      </span>
                      <span>· {e.location}</span>
                      <span className="font-semibold text-navy/70">
                        {regCount}/{e.capacity} registered
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-steel">
                    <Link
                      href={`/events/${e.id}/attendees`}
                      className="text-xs font-semibold bg-steel/60 hover:bg-steel text-navy/70 px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1"
                    >
                      <Users size={13} />
                      Roster ({regCount})
                    </Link>

                    <Link
                      href={`/official/attendance/${e.id}`}
                      className="text-xs font-bold bg-saffron hover:bg-brandblueDark text-white px-3.5 py-2 rounded-xl transition-colors"
                    >
                      Mark Attendance
                    </Link>

                    <EventActions event={e} />
                  </div>
                </div>
              );
            })}

            {upcomingEvents.length === 0 && (
              <div className="bg-white border border-dashed border-steel rounded-2xl p-6 text-center text-xs sm:text-sm text-navy/50">
                No active upcoming events. Create one above to open registrations.
              </div>
            )}
          </div>
        </div>

        {/* Past Events Section */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-navy mb-3 flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green" />
              Past / Completed Events ({pastEvents.length})
            </h2>

            <div className="space-y-2.5">
              {pastEvents.map((e: any) => {
                const regCount = e.registrations?.[0]?.count ?? 0;
                return (
                  <div
                    key={e.id}
                    className="bg-white border border-steel rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-90"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-navy/80">{e.title}</div>
                      <div className="text-[11px] text-navy/45 mt-0.5">
                        {new Date(e.event_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {e.location} · {regCount} registered · {e.hours_value} hrs
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <Link
                        href={`/events/${e.id}/attendees`}
                        className="text-xs font-semibold text-navy/60 hover:text-navy px-2.5 py-1.5 rounded-lg border border-steel"
                      >
                        View Records
                      </Link>
                      <Link
                        href={`/official/attendance/${e.id}`}
                        className="text-xs font-semibold text-saffron bg-saffron/8 px-2.5 py-1.5 rounded-lg border border-saffron/25"
                      >
                        Edit Attendance
                      </Link>
                      <EventActions event={e} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}