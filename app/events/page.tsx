import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import RegisterButton from "./RegisterButton";
import Link from "next/link";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";

import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: { category?: string };
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role === "official") redirect("/official/events");

  const supabase = createClient();
  const selectedCategory = searchParams?.category;

  let query = supabase
    .from("events")
    .select(
      "id, title, description, category, event_date, event_time, location, capacity, hours_value, status, registrations(user_id)"
    )
    .eq("status", "upcoming")
    .order("event_date", { ascending: true });

  if (selectedCategory && selectedCategory !== "all") {
    query = query.eq("category", selectedCategory);
  }

  const { data: events } = await query;

  const { data: countsData } = await supabase.rpc("get_event_registration_counts");
  const countByEvent = new Map<string, number>(
    (countsData ?? []).map((c: any) => [c.event_id, Number(c.registered_count)] as [string, number])
  );

  const categories = ["all", ...EVENT_CATEGORIES];

  const isCoreOrOfficial = viewer.role === "core";
  const isInactive = viewer.status !== "active";

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-4xl">
        {/* Page Title & Intro */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Upcoming Events</h1>
              <p className="text-xs sm:text-sm text-slateink mt-0.5">
                First-Come, First-Served registrations. Spots are confirmed immediately.
              </p>
            </div>
            {isCoreOrOfficial && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-xl shadow-2xs">
                <Sparkles size={13} className="text-amber-600" />
                Roster Access Enabled
              </span>
            )}
          </div>
        </div>

        {isInactive && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-xs text-amber-900 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            <span>
              Your account status is currently <strong>{viewer.status}</strong>. Only active volunteers can register for new events.
            </span>
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {categories.map((cat) => {
            const isSelected = (selectedCategory ?? "all") === cat;
            return (
              <Link
                key={cat}
                href={cat === "all" ? "/events" : `/events?category=${encodeURIComponent(cat)}`}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                  isSelected
                    ? "bg-brandblue text-white shadow-xs font-semibold"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat === "all" ? "All Categories" : cat}
              </Link>
            );
          })}
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {(events ?? []).map((e: any) => {
            const registeredIds: string[] = (e.registrations ?? []).map((r: any) => r.user_id);
            const isRegistered = registeredIds.includes(viewer.id);
            const totalRegistered = countByEvent.get(e.id) ?? 0;
            const isFull = totalRegistered >= e.capacity;
            const spotsLeft = Math.max(0, e.capacity - totalRegistered);
            const fillPercentage = Math.min(100, Math.round((totalRegistered / e.capacity) * 100));

            return (
              <div
                key={e.id}
                className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col gap-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-brandblue px-2.5 py-0.5 rounded-lg border border-blue-100">
                        {e.category || "General Unit Event"}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
                        +{e.hours_value} Hours Credit
                      </span>
                      {spotsLeft <= 5 && spotsLeft > 0 && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg animate-pulse">
                          Only {spotsLeft} spot{spotsLeft === 1 ? "" : "s"} left!
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900">{e.title}</h2>
                    {e.description && (
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                        {e.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Event Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <CalendarDays size={14} className="text-brandblue shrink-0" />
                    <span>
                      {new Date(e.event_date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {e.event_time ? ` · ${e.event_time}` : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-brandred shrink-0" />
                    <span className="truncate">{e.location}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-[11px] text-slateink font-medium mb-1">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        Capacity: {totalRegistered}/{e.capacity}
                      </span>
                      <span className={isFull ? "font-bold text-red-600" : "text-slate-600"}>
                        {isFull ? "Full" : `${spotsLeft} available`}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isFull
                            ? "bg-red-500"
                            : fillPercentage > 75
                            ? "bg-amber-500"
                            : "bg-brandblue"
                        }`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCoreOrOfficial && (
                      <Link
                        href={`/events/${e.id}/attendees`}
                        className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2.5 rounded-xl transition-colors inline-flex items-center gap-1.5"
                      >
                        <Users size={13} />
                        View Roster ({totalRegistered})
                      </Link>
                    )}

                    <RegisterButton
                      eventId={e.id}
                      eventTitle={e.title}
                      isRegistered={isRegistered}
                      isFull={isFull}
                      spotsLeft={spotsLeft}
                      hoursValue={e.hours_value}
                      isInactive={isInactive}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {(events ?? []).length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center">
              <CalendarDays className="mx-auto text-slate-300 mb-2" size={36} />
              <p className="text-sm font-medium text-slate-700">No upcoming events found</p>
              <p className="text-xs text-slateink mt-1">
                {selectedCategory
                  ? "No events currently posted in this category."
                  : "New events will be posted by the NSS official account shortly."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}