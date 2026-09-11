import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Link from "next/link";
import CampAttendanceChecklist from "./CampAttendanceChecklist";
import { ArrowLeft, Tent, CalendarDays, MapPin, Users, CheckCircle2 } from "lucide-react";

export default async function CampAttendancePage({ params }: { params: { campId: string } }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const isOfficial = viewer.role === "official";
  const supabase = createClient();

  const [{ data: camp }, { data: profiles }, { data: roles }, { data: attendees }] = await Promise.all([
    supabase.from("special_camps").select("*").eq("id", params.campId).single(),
    supabase
      .from("profiles")
      .select("id, full_name, department, year, tenure_year, roll_number, status")
      .eq("status", "active")
      .order("full_name"),
    supabase.from("roles").select("user_id, role"),
    supabase.from("camp_attendance").select("user_id").eq("camp_id", params.campId),
  ]);

  if (!camp) redirect("/official/camps");

  const officialIds = new Set((roles ?? []).filter((r) => r.role === "official").map((r) => r.user_id));
  const volunteers = (profiles ?? []).filter((p) => !officialIds.has(p.id));
  const attendeeIds = new Set((attendees ?? []).map((a: any) => a.user_id));
  const initialAttendeeIds = Array.from(attendeeIds);
  const attendeeProfiles = volunteers.filter((v) => attendeeIds.has(v.id));
  const viewerAttended = attendeeIds.has(viewer.id);

  return (
    <div className="min-h-screen bg-[#F8FAFC] md:flex">
      <Nav viewer={viewer} />
      <main className="min-w-0 flex-1 px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8">
        <Link
          href="/official/camps"
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-brandblue"
        >
          <ArrowLeft size={14} /> Back to Special Camps
        </Link>

        <div className="mb-6 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-xl bg-emerald-100 p-1.5 text-emerald-800"><Tent size={16} /></span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Special Camp
            </span>
            {camp.hours_value > 0 && (
              <span className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-brandblue">
                +{camp.hours_value} Hours
              </span>
            )}
            {!isOfficial && viewerAttended && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                <CheckCircle2 size={12} /> You attended
              </span>
            )}
          </div>

          <h1 className="mb-2 text-xl font-bold text-slate-900 sm:text-2xl">{camp.name}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="flex items-center gap-1">
              <CalendarDays size={14} />
              {new Date(camp.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              {" → "}
              {new Date(camp.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {camp.location && <span className="flex items-center gap-1"><MapPin size={14} />{camp.location}</span>}
            <span className="flex items-center gap-1"><Users size={14} />{attendeeIds.size} Attended</span>
          </div>
          {camp.description && <p className="mt-2 text-xs leading-relaxed text-slateink">{camp.description}</p>}
        </div>

        {isOfficial ? (
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
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900 sm:text-base">Camp Attendance</h2>
              <p className="mt-0.5 text-xs text-slateink">
                This is a read-only attendance record. Only NSS officials can mark attendance.
              </p>
            </div>

            {attendeeProfiles.length === 0 ? (
              <div className="p-10 text-center text-sm text-slateink">
                No attendance has been marked for this camp yet.
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {attendeeProfiles.map((v: any) => (
                  <li key={v.id} className="flex items-center gap-3 px-5 py-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-xs font-extrabold text-emerald-700">
                      {(v.full_name ?? "U").slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900">{v.full_name ?? "Unknown"}</p>
                      <p className="text-[11px] text-slateink">
                        {v.department || "NSS Volunteer"}
                        {v.roll_number ? ` · ${v.roll_number}` : ""}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 size={12} /> Attended
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
