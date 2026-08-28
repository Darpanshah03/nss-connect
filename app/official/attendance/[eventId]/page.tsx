import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import AttendanceChecklist from "./AttendanceChecklist";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin, Users } from "lucide-react";

export default async function AttendancePage({ params }: { params: { eventId: string } }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "official") redirect("/dashboard");

  const supabase = createClient();

  const [{ data: event }, { data: registrations }, { data: attendanceList }] =
    await Promise.all([
      supabase.from("events").select("*").eq("id", params.eventId).single(),
      supabase
        .from("registrations")
        .select("user_id, profiles(id, full_name, department, year, tenure_year, roll_number, phone)")
        .eq("event_id", params.eventId),
      supabase
        .from("attendance")
        .select("user_id, present, hours_awarded")
        .eq("event_id", params.eventId),
    ]);

  if (!event) redirect("/official/events");

  const initialPresentIds =
    attendanceList && attendanceList.length > 0
      ? attendanceList.filter((a) => a.present).map((a) => a.user_id)
      : (registrations ?? []).map((r: any) => r.user_id);

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-3xl">
        <Link
          href="/official/events"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brandblue mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Manage Events
        </Link>

        {/* Event Summary Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-brandblue px-2.5 py-0.5 rounded-lg border border-blue-100">
              {event.category || "General Event"}
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100">
              +{event.hours_value} Hours Credit
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Attendance — {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />
              {new Date(event.event_date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {event.event_time ? ` (${event.event_time})` : ""}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={14} />
              {event.location}
            </span>
            <span className="flex items-center gap-1">
              <Users size={14} />
              {registrations?.length ?? 0} Registered
            </span>
          </div>
        </div>

        <AttendanceChecklist
          eventId={event.id}
          hoursValue={Number(event.hours_value)}
          initialPresentIds={initialPresentIds}
          volunteers={(registrations ?? []).map((r: any) => ({
            id: r.user_id,
            name: r.profiles?.full_name ?? "Unknown Volunteer",
            department: r.profiles?.department ?? "",
            year: r.profiles?.year ?? 1,
            tenureYear: r.profiles?.tenure_year ?? 1,
            rollNumber: r.profiles?.roll_number ?? null,
          }))}
        />
      </main>
    </div>
  );
}

