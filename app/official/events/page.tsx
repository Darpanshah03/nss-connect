import { redirect } from "next/navigation";
import Link from "next/link";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import PostEventModal from "./PostEventModal";
import EventActions from "./EventActions";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import ExportButton from "@/components/ExportButton";

import {
  CalendarDays,
  Users,
  CheckCircle2,
  MapPin,
  Clock3,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

export default async function OfficialEventsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const viewer = await getViewer();

  if (!viewer) redirect("/login");
  if (viewer.role !== "official") redirect("/dashboard");

  const supabase = createClient();

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, description, category, event_date, event_time, location, capacity, hours_value, status, registrations(count)"
    )
    .order("event_date", { ascending: false });

  const eventList = events ?? [];

  const upcomingEvents = eventList.filter(
    (event) => event.status === "upcoming"
  );

  const pastEvents = eventList.filter(
    (event) => event.status !== "upcoming"
  );

  const totalRegistrations = upcomingEvents.reduce((total, event) => {
    return total + (event.registrations?.[0]?.count ?? 0);
  }, 0);

  const selectedCategory = searchParams?.category;
  const matchesCategory = (event: any) =>
    !selectedCategory || selectedCategory === "all" || event.category === selectedCategory;

  const filteredUpcomingEvents = upcomingEvents.filter(matchesCategory);
  const filteredPastEvents = pastEvents.filter(matchesCategory);

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
    <div className="min-h-screen bg-[#f7f9fc] text-[#10213f] md:flex">
      <Nav viewer={viewer} />

      <main className="min-w-0 flex-1 px-4 pb-20 pt-20 sm:px-6 md:px-8 md:pb-12 md:pt-8 lg:px-10">
        <div className="mx-auto max-w-[1450px]">

          {/* ========================================================= */}
          {/* HEADER */}
          {/* ========================================================= */}

          <header className="mb-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-bold text-blue-600">
                  <CalendarDays className="h-4 w-4" />
                  <span>Events Management</span>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-[#10213f] sm:text-4xl">
                  Manage NSS Events
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
                  Create and manage NSS events, track registrations, verify
                  attendance, and make a bigger impact.
                </p>
              </div>

              <ExportButton
                filename="nss-all-attendance"
                rows={allAttendanceRows}
                label="Export All Attendance"
              />
            </div>
          </header>

          {/* ========================================================= */}
          {/* STATS */}
          {/* ========================================================= */}

          <section className="mb-7 grid grid-cols-1 gap-3 sm:grid-cols-3">

            {/* Upcoming */}
            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#64748b]">
                    Upcoming Events
                  </p>

                  <p className="mt-0.5 text-xl font-bold text-[#10213f]">
                    {upcomingEvents.length}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                    Active events
                  </p>
                </div>
              </div>
            </div>

            {/* Registrations */}
            <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Users className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#64748b]">
                    Upcoming Registrations
                  </p>

                  <p className="mt-0.5 text-xl font-bold text-[#10213f]">
                    {totalRegistrations}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                    Registered volunteers
                  </p>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#64748b]">
                    Completed Events
                  </p>

                  <p className="mt-0.5 text-xl font-bold text-[#10213f]">
                    {pastEvents.length}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#94a3b8]">
                    Past events
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* POST EVENT TRIGGER — now a button + modal */}
          {/* ========================================================= */}

          <section className="mb-6">
            <PostEventModal />
          </section>

          {/* ========================================================= */}
          {/* QUICK TIPS — now standalone, full-width */}
          {/* ========================================================= */}

          <section className="mb-10">
            <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 via-white to-white p-6 shadow-sm sm:p-8">

              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-300/10 blur-3xl" />

              <div className="relative">

                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-blue-100">
                    <Lightbulb className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#10213f]">Quick Tips</h3>
                    <p className="mt-1 text-xs leading-5 text-[#64748b]">
                      A few things every NSS volunteer should remember.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">

                  {/* Tip 1 */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                      <CalendarDays className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#17345f]">
                        Attending Events is Important
                      </h4>

                      <p className="mt-1 text-xs leading-5 text-[#64748b]">
                        Participate actively in NSS events to gain experience,
                        develop skills, and contribute to the community.
                      </p>
                    </div>
                  </div>

                  {/* Tip 2 */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                      <GraduationCap className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#17345f]">
                        Complete 120 Hours
                      </h4>

                      <p className="mt-1 text-xs leading-5 text-[#64748b]">
                        Completing 120 hours will grant you academic and social
                        benefits while strengthening your NSS contribution.
                      </p>
                    </div>
                  </div>

                  {/* Tip 3 */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-[#17345f]">
                        Discipline is First Priority
                      </h4>

                      <p className="mt-1 text-xs leading-5 text-[#64748b]">
                        Follow NSS guidelines, be punctual, respect your team,
                        and maintain discipline during every activity.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-blue-100" />

                {/* Quote */}
                <div className="text-center">
                  <Lightbulb className="mx-auto mb-3 h-5 w-5 text-orange-400" />
                  <p className="text-sm italic leading-6 text-[#64748b]">
                    "Together we can create a greater impact."
                  </p>
                  <p className="mt-2 text-xs font-bold text-[#94a3b8]">— NSS</p>
                </div>

              </div>

              {/* Decorative bottom line */}
              <div className="absolute bottom-0 left-0 right-0 h-2 overflow-hidden">
                <div className="absolute bottom-[-5px] left-[-5%] h-6 w-[110%] rotate-[-2deg] rounded-[50%] border-t-4 border-orange-400" />
                <div className="absolute bottom-[-7px] left-[-5%] h-6 w-[110%] rotate-[-2deg] rounded-[50%] border-t-4 border-emerald-400" />
              </div>

            </div>
          </section>

          {/* ========================================================= */}
          {/* CATEGORY FILTER PILLS */}
          {/* ========================================================= */}

          <section className="mb-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["all", ...EVENT_CATEGORIES].map((cat) => {
                const isSelected = (selectedCategory ?? "all") === cat;
                return (
                  <Link
                    key={cat}
                    href={cat === "all" ? "/official/events" : `/official/events?category=${encodeURIComponent(cat)}`}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-[#dce4ef] text-[#64748b] hover:bg-slate-50"
                    }`}
                  >
                    {cat === "all" ? "All Categories" : cat}
                  </Link>
                );
              })}
            </div>
          </section>

          {/* ========================================================= */}
          {/* UPCOMING EVENTS */}
          {/* ========================================================= */}

          <section className="mt-4">

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-blue-600" />

                  <h2 className="text-xl font-bold text-[#10213f]">
                    Upcoming Events
                  </h2>
                </div>

                <p className="mt-1 text-sm text-[#64748b]">
                  Click on an event to view details, manage attendance and more.
                </p>
              </div>

              {filteredUpcomingEvents.length > 0 && (
                <span className="text-xs font-semibold text-[#94a3b8]">
                  {filteredUpcomingEvents.length} active event
                  {filteredUpcomingEvents.length !== 1 ? "s" : ""}
                </span>
              )}

            </div>

            {filteredUpcomingEvents.length > 0 ? (

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                {filteredUpcomingEvents.map((event: any) => {

                  const regCount =
                    event.registrations?.[0]?.count ?? 0;

                  const isFull = regCount >= event.capacity;

                  const percentage =
                    event.capacity > 0
                      ? Math.min(
                          100,
                          Math.round((regCount / event.capacity) * 100)
                        )
                      : 0;

                  return (
                    <div
                      key={event.id}
                      className="group overflow-hidden rounded-2xl border border-[#dce4ef] bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                    >

                      <div className="p-5">

                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">

                            <div className="mb-2 flex flex-wrap items-center gap-2">

                              <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                {event.category || "General"}
                              </span>

                              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                +{event.hours_value} hrs
                              </span>

                              {isFull && (
                                <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                  Full
                                </span>
                              )}

                            </div>

                            <h3 className="text-lg font-bold text-[#10213f] transition-colors group-hover:text-blue-600">
                              {event.title}
                            </h3>

                          </div>

                          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
                            <CalendarDays className="h-5 w-5" />
                          </div>

                        </div>

                        {/* Event details */}
                        <div className="mt-4 grid grid-cols-1 gap-2 text-xs text-[#64748b] sm:grid-cols-2">

                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-blue-500" />

                            {new Date(
                              event.event_date
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>

                          {event.event_time && (
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-blue-500" />
                              {event.event_time}
                            </div>
                          )}

                          <div className="flex items-center gap-2 sm:col-span-2">
                            <MapPin className="h-4 w-4 shrink-0 text-blue-500" />

                            <span className="truncate">
                              {event.location}
                            </span>
                          </div>

                        </div>

                        {/* Registration */}
                        <div className="mt-5">

                          <div className="mb-2 flex items-center justify-between">

                            <span className="text-xs font-medium text-[#64748b]">
                              Registration
                            </span>

                            <span className="text-xs font-bold text-[#334155]">
                              {regCount} / {event.capacity}
                            </span>

                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                isFull
                                  ? "bg-red-500"
                                  : "bg-blue-600"
                              }`}
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>

                        </div>

                        {/* Actions */}
                        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#e5eaf1] pt-4">

                          <Link
                            href={`/events/${event.id}/attendees`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-[#10213f]"
                          >
                            <Users className="h-3.5 w-3.5" />
                            Roster ({regCount})
                          </Link>

                          <Link
                            href={`/official/attendance/${event.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition-all hover:bg-blue-700"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Mark Attendance
                          </Link>

                          <div className="ml-auto">
                            <EventActions event={event} />
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}

              </div>

            ) : (

              <div className="rounded-2xl border border-dashed border-[#dce4ef] bg-white p-10 text-center">

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
                  <CalendarDays className="h-6 w-6" />
                </div>

                <h3 className="mt-4 text-sm font-bold text-[#10213f]">
                  No upcoming events
                </h3>

                <p className="mt-1 text-xs text-[#94a3b8]">
                  {selectedCategory && selectedCategory !== "all"
                    ? "No upcoming events in this category."
                    : "Post an event above to open registrations."}
                </p>

              </div>

            )}

          </section>

          {/* ========================================================= */}
          {/* PAST EVENTS */}
          {/* ========================================================= */}

          {filteredPastEvents.length > 0 && (

            <section className="mt-10">

              <div className="mb-4 flex items-center gap-2">

                <CheckCircle2 className="h-5 w-5 text-emerald-600" />

                <div>
                  <h2 className="text-xl font-bold text-[#10213f]">
                    Past / Completed Events
                  </h2>

                  <p className="mt-1 text-sm text-[#64748b]">
                    Previous events and their attendance records.
                  </p>
                </div>

              </div>

              <div className="overflow-hidden rounded-2xl border border-[#dce4ef] bg-white">

                <div className="divide-y divide-[#e5eaf1]">

                  {filteredPastEvents.map((event: any) => {

                    const regCount =
                      event.registrations?.[0]?.count ?? 0;

                    return (
                      <div
                        key={event.id}
                        className="flex flex-col gap-4 p-5 transition-colors hover:bg-slate-50/60 md:flex-row md:items-center md:justify-between"
                      >

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {event.category || "General"}
                            </span>

                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              Completed
                            </span>

                          </div>

                          <h3 className="mt-2 truncate text-sm font-bold text-[#10213f]">
                            {event.title}
                          </h3>

                          <p className="mt-1 text-xs text-[#64748b]">
                            {new Date(
                              event.event_date
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}{" "}
                            · {event.location} · {regCount} registered ·{" "}
                            {event.hours_value} hrs
                          </p>

                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">

                          <Link
                            href={`/events/${event.id}/attendees`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce4ef] px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#10213f]"
                          >
                            View Records
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>

                          <Link
                            href={`/official/attendance/${event.id}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600 transition-colors hover:bg-orange-100"
                          >
                            Edit Attendance
                          </Link>

                          <EventActions event={event} />

                        </div>

                      </div>
                    );
                  })}

                </div>

              </div>

            </section>
          )}

          <div className="h-8" />

        </div>
      </main>
    </div>
  );
}