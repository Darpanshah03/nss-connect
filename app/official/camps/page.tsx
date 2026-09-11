import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Link from "next/link";
import { createCamp, deleteCamp } from "./actions";
import { Tent, Plus, CalendarDays, MapPin, Clock, Trash2, Users } from "lucide-react";

export default async function CampsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "official") redirect("/dashboard");

  const supabase = createClient();
  const { data: camps } = await supabase
    .from("special_camps")
    .select("*, camp_attendance(user_id)")
    .order("start_date", { ascending: false });

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="min-w-0 flex-1 px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl">
              <Tent size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Special Camps</h1>
          </div>
          <p className="text-xs sm:text-sm text-slateink">
            Manage annual NSS special camps and mark which volunteers attended each camp.
          </p>
        </div>

        {/* Create New Camp Form */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl"><Plus size={16} /></div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Create New Special Camp</h2>
              <p className="text-xs text-slateink">Annual camps like NSS District Camp, State Camp, Republic Day Camp, etc.</p>
            </div>
          </div>

          <form action={createCamp} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Camp Name *</label>
              <input name="name" required placeholder="e.g. NSS District Special Camp 2024-25" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-brandblue" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input name="start_date" type="date" required className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                <input name="end_date" type="date" required className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input name="location" placeholder="e.g. Kaas Plateau, Satara" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hours Credit</label>
                <input name="hours_value" type="number" min="0" step="0.5" defaultValue="0" className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea name="description" rows={2} placeholder="Brief description of the camp activities..." className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brandblue" />
            </div>

            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-xs transition-all">
              Create Camp
            </button>
          </form>
        </div>

        {/* Existing Camps */}
        <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Tent size={16} className="text-emerald-700" />
          All Special Camps ({camps?.length ?? 0})
        </h2>

        <div className="space-y-3">
          {(camps ?? []).map((camp: any) => {
            const attendeeCount = camp.camp_attendance?.length ?? 0;
            return (
              <div key={camp.id} className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">{camp.name}</h3>
                    {camp.hours_value > 0 && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-lg">
                        +{camp.hours_value} hrs
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slateink flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1">
                      <CalendarDays size={12} />
                      {new Date(camp.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      {" → "}
                      {new Date(camp.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {camp.location && <span className="flex items-center gap-1"><MapPin size={12} />{camp.location}</span>}
                    <span className="flex items-center gap-1 font-semibold text-brandblue">
                      <Users size={12} />{attendeeCount} Attended
                    </span>
                  </div>
                  {camp.description && <p className="text-xs text-slateink mt-1 line-clamp-1">{camp.description}</p>}
                </div>

                <div className="shrink-0 flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <Link
                    href={`/official/camps/${camp.id}`}
                    className="text-xs font-bold bg-brandblue text-white px-3.5 py-2 rounded-xl hover:bg-brandblueDark transition-colors flex items-center gap-1"
                  >
                    <Users size={13} />
                    Mark Attendance
                  </Link>
                  <form action={async () => { "use server"; await deleteCamp(camp.id); }}>
                    <button type="submit" className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors" title="Delete camp">
                      <Trash2 size={15} />
                    </button>
                  </form>
                </div>
              </div>
            );
          })}

          {(camps ?? []).length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-xs sm:text-sm text-slateink">
              <Tent className="mx-auto text-slate-300 mb-2" size={36} />
              <p className="font-semibold text-slate-700">No special camps created yet</p>
              <p className="text-xs mt-1">Create your first annual NSS camp above.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}