import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createCamp, deleteCamp } from "./actions";
import { Tent, Plus, CalendarDays, MapPin, Trash2, Users, Eye } from "lucide-react";

export default async function CampsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const isOfficial = viewer.role === "official";
  const supabase = createClient();

  const { data: camps } = await supabase
    .from("special_camps")
    .select("*, camp_attendance(user_id)")
    .order("start_date", { ascending: false });

  return (
    <div className="min-h-screen bg-[#F8FAFC] md:flex">
      <Nav viewer={viewer} />
      <main className="min-w-0 flex-1 px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8">
        <div className="mb-6">
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-xl bg-emerald-100 p-1.5 text-emerald-800">
              <Tent size={18} />
            </span>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Special Camps</h1>
          </div>
          <p className="text-xs text-slateink sm:text-sm">
            {isOfficial
              ? "Manage annual NSS special camps and mark which volunteers attended each camp."
              : "View NSS special camps and check your camp attendance records."}
          </p>
        </div>

        {isOfficial && (
          <div className="mb-8 rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-800"><Plus size={16} /></div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 sm:text-base">Create New Special Camp</h2>
                <p className="text-xs text-slateink">Annual camps like NSS District Camp, State Camp, Republic Day Camp, etc.</p>
              </div>
            </div>

            <form action={createCamp} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Camp Name *</label>
                <input name="name" required placeholder="e.g. NSS District Special Camp 2024-25" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-brandblue" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Start Date *</label>
                  <input name="start_date" type="date" required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">End Date *</label>
                  <input name="end_date" type="date" required className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Location</label>
                  <input name="location" placeholder="e.g. Kaas Plateau, Satara" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">Hours Credit</label>
                  <input name="hours_value" type="number" min="0" step="0.5" defaultValue="0" className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">Description</label>
                <textarea name="description" rows={2} placeholder="Brief description of the camp activities..." className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brandblue" />
              </div>
              <button type="submit" className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700">
                Create Camp
              </button>
            </form>
          </div>
        )}

        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 sm:text-base">
          <Tent size={16} className="text-emerald-700" />
          All Special Camps ({camps?.length ?? 0})
        </h2>

        <div className="space-y-3">
          {(camps ?? []).map((camp: any) => {
            const attendeeCount = camp.camp_attendance?.length ?? 0;
            const attendedByViewer = camp.camp_attendance?.some((a: any) => a.user_id === viewer.id);

            return (
              <div key={camp.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 sm:text-base">{camp.name}</h3>
                    {camp.hours_value > 0 && (
                      <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        +{camp.hours_value} hrs
                      </span>
                    )}
                    {!isOfficial && attendedByViewer && (
                      <span className="rounded-lg border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        You attended
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slateink">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {new Date(camp.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" → "}
                      {new Date(camp.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {camp.location && <span className="flex items-center gap-1"><MapPin size={12} />{camp.location}</span>}
                    <span className="flex items-center gap-1 font-semibold text-brandblue"><Users size={12} />{attendeeCount} Attended</span>
                  </div>
                  {camp.description && <p className="mt-1 line-clamp-1 text-xs text-slateink">{camp.description}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                  <Link
                    href={`/official/camps/${camp.id}`}
                    className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors ${
                      isOfficial
                        ? "bg-brandblue text-white hover:bg-brandblueDark"
                        : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {isOfficial ? <Users size={13} /> : <Eye size={13} />}
                    {isOfficial ? "Mark Attendance" : "View Camp"}
                  </Link>

                  {isOfficial && (
                    <form action={async () => { "use server"; await deleteCamp(camp.id); }}>
                      <button type="submit" className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete camp">
                        <Trash2 size={15} />
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}

          {(camps ?? []).length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-xs text-slateink sm:text-sm">
              <Tent className="mx-auto mb-2 text-slate-300" size={36} />
              <p className="font-semibold text-slate-700">No special camps created yet</p>
              {isOfficial && <p className="mt-1 text-xs">Create your first annual NSS camp above.</p>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
