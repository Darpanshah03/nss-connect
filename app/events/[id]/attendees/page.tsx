import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Link from "next/link";
import {
  CalendarDays,
  MapPin,
  Clock,
  Users,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  Phone,
  Hash,
  CheckCircle2,
} from "lucide-react";

export default async function EventAttendeesPage({
  params,
}: {
  params: { id: string };
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  // Core heads and official have access
  const canView = viewer.role === "core" || viewer.role === "official";
  if (!canView) redirect("/events");

  const supabase = createClient();

  const [{ data: event }, { data: registrations }, { data: attendanceList }] =
    await Promise.all([
      supabase.from("events").select("*").eq("id", params.id).single(),
      supabase
        .from("registrations")
        .select(
          "registered_at, user_id, profiles(id, full_name, department, year, tenure_year, status, phone, roll_number)"
        )
        .eq("event_id", params.id)
        .order("registered_at", { ascending: true }),
      supabase
        .from("attendance")
        .select("user_id, present, hours_awarded")
        .eq("event_id", params.id),
    ]);

  if (!event) redirect(viewer.role === "official" ? "/official/events" : "/events");

  const attendanceMap = new Map<string, { present: boolean; hours: number }>();
  (attendanceList ?? []).forEach((a) =>
    attendanceMap.set(a.user_id, { present: a.present, hours: a.hours_awarded })
  );

  const registeredList = registrations ?? [];

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-4xl">
        {/* Back Link */}
        <Link
          href={viewer.role === "official" ? "/official/events" : "/events"}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brandblue mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Events
        </Link>

        {/* Event Header Banner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-brandblue px-2.5 py-0.5 rounded-lg border border-blue-100">
              {event.category || "General Event"}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
              +{event.hours_value} Hours Credit
            </span>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border ${
                event.status === "upcoming"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : event.status === "past"
                  ? "bg-slate-100 text-slate-700 border-slate-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {event.status === "upcoming"
                ? "Upcoming"
                : event.status === "past"
                ? "Completed"
                : "Cancelled"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">{event.title}</h1>

          {event.description && (
            <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700 bg-slate-50 border border-slate-100 rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-brandblue shrink-0" />
              <span>
                {new Date(event.event_date).toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {event.event_time ? ` (${event.event_time})` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-brandred shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={15} className="text-purple-600 shrink-0" />
              <span>
                <strong>{registeredList.length}</strong> / {event.capacity} registered
              </span>
            </div>
          </div>
        </div>

        {/* Registered Volunteers Section */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                <Users size={16} className="text-brandblue" />
                Registered Volunteers Roster
              </h2>
              <p className="text-xs text-slateink mt-0.5">
                First-Come, First-Served registrations order
              </p>
            </div>

            {viewer.role === "official" && event.status === "upcoming" && (
              <Link
                href={`/official/attendance/${event.id}`}
                className="text-xs font-bold bg-brandblue text-white px-3.5 py-2 rounded-xl shadow-xs hover:bg-brandblueDark transition-colors"
              >
                Mark Attendance
              </Link>
            )}
          </div>

          {registeredList.length === 0 ? (
            <div className="p-8 text-center text-xs sm:text-sm text-slateink">
              No volunteers have registered for this event yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {registeredList.map((reg: any, idx: number) => {
                const profile = reg.profiles;
                const att = attendanceMap.get(reg.user_id);

                return (
                  <div
                    key={reg.user_id}
                    className="p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs sm:text-sm text-slate-900">
                            {profile?.full_name ?? "Volunteer"}
                          </span>
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            Tenure Year {profile?.tenure_year ?? 1}
                          </span>
                          {profile?.year && (
                            <span className="text-[10px] text-slateink">
                              Acad Year {profile.year}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          {profile?.department && <span>Dept: {profile.department}</span>}
                          {profile?.roll_number && (
                            <span className="flex items-center gap-0.5">
                              <Hash size={11} />
                              {profile.roll_number}
                            </span>
                          )}
                          {profile?.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone size={11} />
                              {profile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                      <div className="text-[11px] text-slateink">
                        Reg:{" "}
                        {new Date(reg.registered_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>

                      {att && (
                        <div className="mt-1">
                          {att.present ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={11} />
                              Present (+{att.hours}h)
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                              Absent
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}