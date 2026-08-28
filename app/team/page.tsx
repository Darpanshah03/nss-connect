import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import {
  Sparkles,
  Users,
  GraduationCap,
  Award,
  ShieldAlert,
  Clock,
  ChevronRight,
} from "lucide-react";

export default async function TeamPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const supabase = createClient();

  const [{ data: profiles }, { data: roles }, { data: hours }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, department, year, tenure_year, status, created_at")
      .order("full_name"),
    supabase.from("roles").select("user_id, role, position"),
    supabase.from("attendance").select("user_id, hours_awarded").eq("present", true),
  ]);

  const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r]));
  const hoursByUser = new Map<string, number>();
  (hours ?? []).forEach((h) =>
    hoursByUser.set(h.user_id, (hoursByUser.get(h.user_id) ?? 0) + Number(h.hours_awarded))
  );

  const nonOfficials = (profiles ?? []).filter(
    (p) => roleByUser.get(p.id)?.role !== "official"
  );

  // Categorize
  const coreHeads = nonOfficials.filter(
    (p) => p.status === "active" && roleByUser.get(p.id)?.role === "core"
  );

  const year2Volunteers = nonOfficials.filter(
    (p) =>
      p.status === "active" &&
      roleByUser.get(p.id)?.role !== "core" &&
      p.tenure_year === 2
  );

  const year1Volunteers = nonOfficials.filter(
    (p) =>
      p.status === "active" &&
      roleByUser.get(p.id)?.role !== "core" &&
      (p.tenure_year ?? 1) === 1
  );

  const graduatedAlumni = nonOfficials.filter((p) => p.status === "graduated");

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-blue-100 text-brandblue rounded-xl">
              <Sparkles size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">NSS Unit Directory</h1>
          </div>
          <p className="text-xs sm:text-sm text-slateink">
            Meet the Core Team leadership, senior volunteers, and new cohorts dedicated to community service.
          </p>
        </div>

        {/* Section 1: Core Team Leadership (Heads) */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-amber-500 fill-amber-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Core Team & Heads ({coreHeads.length})
            </h2>
          </div>

          {coreHeads.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-6 text-center text-xs sm:text-sm text-slateink">
              Core Team Heads will be selected and assigned by the NSS Official account.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              {coreHeads.map((member) => {
                const role = roleByUser.get(member.id);
                const hrs = hoursByUser.get(member.id) ?? 0;

                return (
                  <div
                    key={member.id}
                    className="bg-white border-2 border-amber-200/80 rounded-3xl p-5 shadow-xs hover:border-amber-400 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-sm border border-amber-200 shadow-2xs">
                        {member.full_name?.charAt(0) || "H"}
                      </div>

                      {role?.position && (
                        <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl shadow-xs ring-1 ring-amber-400/30">
                          <Sparkles size={12} className="text-amber-600 fill-amber-500" />
                          {role.position}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900">{member.full_name}</h3>

                    <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-2">
                      <span>{member.department ?? "NSS Unit"}</span>
                      {member.year && <span>· Acad Year {member.year}</span>}
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Tenure: Year {member.tenure_year} Head
                      </span>
                      <span className="font-mono font-bold text-xs text-brandblue bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                        {hrs} Verified Hrs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Year 2 Senior Volunteers */}
        {year2Volunteers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-brandblue" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Year 2 Senior Volunteers ({year2Volunteers.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {year2Volunteers.map((vol) => {
                const hrs = hoursByUser.get(vol.id) ?? 0;
                return (
                  <div
                    key={vol.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {vol.full_name}
                      </div>
                      <div className="text-[11px] text-slateink mt-0.5 truncate">
                        {vol.department ? `${vol.department}` : "Volunteer"}
                        {vol.year ? ` · Year ${vol.year}` : ""}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                      {hrs}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 3: Year 1 Volunteers */}
        {year1Volunteers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-slate-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Year 1 Volunteer Cohort ({year1Volunteers.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {year1Volunteers.map((vol) => {
                const hrs = hoursByUser.get(vol.id) ?? 0;
                return (
                  <div
                    key={vol.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                        {vol.full_name}
                      </div>
                      <div className="text-[11px] text-slateink mt-0.5 truncate">
                        {vol.department ? `${vol.department}` : "Volunteer"}
                        {vol.year ? ` · Year ${vol.year}` : ""}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                      {hrs}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 4: Graduated Alumni */}
        {graduatedAlumni.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap size={18} className="text-purple-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Graduated NSS Alumni ({graduatedAlumni.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {graduatedAlumni.map((alumnus) => {
                const hrs = hoursByUser.get(alumnus.id) ?? 0;
                return (
                  <div
                    key={alumnus.id}
                    className="bg-purple-50/50 border border-purple-200/70 rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-purple-950 truncate">
                        {alumnus.full_name}
                      </div>
                      <div className="text-[11px] text-purple-700 mt-0.5">
                        {alumnus.department} · 2-Year Tenure Completed
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-purple-800 bg-purple-100 px-2 py-1 rounded-lg">
                      {hrs}h Total
                    </span>
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