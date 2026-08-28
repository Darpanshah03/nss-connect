import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Link from "next/link";
import CampAttendanceChecklist from "./CampAttendanceChecklist";
import { ArrowLeft, Tent, CalendarDays, MapPin, Clock, Users } from "lucide-react";

export default async function CampAttendancePage({ params }: { params: { campId: string } }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "official") redirect("/dashboard");

  const supabase = createClient();

  const [{ data: camp }, { data: profiles }, { data: roles }, { data: attendees }] = await Promise.all([
    supabase.from("special_camps").select("*").eq("id", params.campId).single(),
    supabase.from("profiles").select("id, full_name, department, year, tenure_year, roll_number, status").eq("status", "active").order("full_name"),
    supabase.from("roles").select("user_id, role"),
    supabase.from("camp_attendance").select("user_id").eq("camp_id", params.campId),
  ]);

  if (!camp) redirect("/official/camps");

  const officialIds = new Set((roles ?? []).filter(r => r.role === "official").map(r => r.user_id));
  const volunteers = (profiles ?? []).filter(p => !officialIds.has(p.id));
  const initialAttendeeIds = (attendees ?? []).map((a: any) => a.user_id);

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-3xl">
        <Link href="/official/camps" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brandblue mb-4 transition-colors">
          <ArrowLeft size={14} /> Back to Special Camps
        </Link>

        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl"><Tent size={16} /></span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-lg border border-emerald-200">Special Camp</span>
            {camp.hours_value > 0 && (
              <span className="text-[11px] font-bold bg-blue-50 text-brandblue px-2.5 py-0.5 rounded-lg border border-blue-100">+{camp.hours_value} Hours</span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            {camp.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />
              {new Date(camp.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(camp.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {camp.location && <span className="flex items-center gap-1"><MapPin size={14} />{camp.location}</span>}
            <span className="flex items-center gap-1"><Users size={14} />{volunteers.length} Active Volunteers</span>
          </div>
          {camp.description && <p className="text-xs text-slateink mt-2 leading-relaxed">{camp.description}</p>}
        </div>

        <CampAttendanceChecklist
          campId={camp.id}
          volunteers={volunteers.map((v: any) => ({
            id: v.id,
            name: v.full_name ?? "Unknown",
            department: v.department ?? "",
            year: v.year ?? 1,
            tenureYear: v.tenure_year ?? 1,
            rollNumber: v.roll_number ?? null,
          }))}
          initialAttendeeIds={initialAttendeeIds}
        />
      </main>
    </div>
  );
}