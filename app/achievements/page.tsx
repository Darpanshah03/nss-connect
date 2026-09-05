import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import { postAchievement, deleteAchievement } from "./actions";
import Link from "next/link";
import {
  Trophy,
  Award,
  Star,
  Medal,
  Heart,
  Sparkles,
  Plus,
  Trash2,
  CalendarDays,
  User,
  ShieldCheck,
} from "lucide-react";

export default async function AchievementsPage({
  searchParams,
}: {
  searchParams?: { tab?: string };
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const supabase = createClient();
  const tab = searchParams?.tab ?? "all";
  const isOfficial = viewer.role === "official";

  let query = supabase
    .from("achievements")
    .select(
        "id, title, description, category, badge_icon, achieved_on, created_at, photo_url, profiles:user_id(id, full_name, department, year)"    )
    .order("achieved_on", { ascending: false });

  if (tab === "unit") query = query.eq("category", "unit");
  if (tab === "individual") query = query.eq("category", "individual");

  const [{ data: achievements }, { data: volunteerProfiles }] = await Promise.all([
    query,
    isOfficial
      ? supabase.from("profiles").select("id, full_name, department").order("full_name")
      : Promise.resolve({ data: [] }),
  ]);

  const items = achievements ?? [];

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "star":
        return <Star size={20} className="text-amber-500 fill-amber-500" />;
      case "medal":
        return <Medal size={20} className="text-blue-500" />;
      case "heart":
        return <Heart size={20} className="text-rose-500 fill-rose-500" />;
      case "award":
        return <Award size={20} className="text-purple-500" />;
      case "trophy":
      default:
        return <Trophy size={20} className="text-amber-600 fill-amber-500" />;
    }
  };

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-100 text-amber-800 rounded-xl">
              <Trophy size={18} className="fill-amber-500 text-amber-600" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">NSS Achievements Wall</h1>
          </div>
          <p className="text-xs sm:text-sm text-slateink">
            Honouring unit accolades, state-level recognitions, and exceptional volunteer contributions.
          </p>
        </div>

        {/* Official Admin Post Form Card */}
        {isOfficial && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-50 text-amber-800 rounded-xl">
                <Plus size={16} />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Post Achievement</h2>
                <p className="text-xs text-slateink">Add a unit award or spotlight an outstanding volunteer</p>
              </div>
            </div>

            <form action={postAchievement} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Photo (Optional)
                </label>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-brandblue hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Achievement Title *
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. Best NSS College Unit Award - University Level"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 outline-none focus:border-brandblue"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Recognition Category *
                  </label>
                  <select
                    name="category"
                    defaultValue="unit"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                  >
                    <option value="unit">🏛️ Unit-Wide Milestone</option>
                    <option value="individual">👤 Volunteer Recognition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge Icon
                  </label>
                  <select
                    name="badge_icon"
                    defaultValue="trophy"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                  >
                    <option value="trophy">🏆 Trophy (Award / Unit)</option>
                    <option value="star">⭐ Star (Excellence)</option>
                    <option value="medal">🥇 Medal (Leader)</option>
                    <option value="award">🎖️ Award (Honor)</option>
                    <option value="heart">❤️ Heart (Service / Blood Drive)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Achieved
                  </label>
                  <input
                    name="achieved_on"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tag Volunteer (Optional for individual spotlight)
                </label>
                <select
                  name="user_id"
                  defaultValue=""
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                >
                  <option value="">None (Unit-wide Achievement)</option>
                  {(volunteerProfiles ?? []).map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.department || "Volunteer"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description / Citations
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Details of the accolade, presenting authority, or special project contributions..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto bg-brandblue hover:bg-brandblueDark text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-xs transition-all"
              >
                Publish to Achievements Wall
              </button>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {[
            { key: "all", label: "All Accolades" },
            { key: "unit", label: "🏛️ Unit Milestones" },
            { key: "individual", label: "⭐ Volunteer Spotlights" },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <Link
                key={t.key}
                href={t.key === "all" ? "/achievements" : `/achievements?tab=${t.key}`}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? "bg-brandblue text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item: any) => {
            const isUnit = item.category === "unit";
            const profile = item.profiles;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between relative overflow-hidden"
              >
                {/* Top highlight bar */}
                <div
                  className={`absolute top-0 inset-x-0 h-1.5 ${
                    isUnit
                      ? "bg-gradient-to-r from-amber-400 to-orange-500"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600"
                  }`}
                />

                <div>
                  {item.photo_url && (
                    <img
                      src={item.photo_url}
                      alt={item.title}
                      className="w-full h-36 object-cover rounded-2xl mb-3 border border-slate-100"
                    />
                  )}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-2xs">
                      {getIcon(item.badge_icon || "trophy")}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                          isUnit
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-brandblue border-blue-200"
                        }`}
                      >
                        {isUnit ? "Unit Milestone" : "Volunteer Spotlight"}
                      </span>

                      {isOfficial && (
                        <form
                          action={async () => {
                            "use server";
                            await deleteAchievement(item.id);
                          }}
                        >
                          <button
                            type="submit"
                            title="Delete achievement"
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </form>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug mb-1.5">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-xs text-slate-600 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  )}

                  {profile && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-brandblue flex items-center justify-center text-[10px] font-bold shrink-0">
                        {profile.full_name?.charAt(0) || "V"}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {profile.full_name}
                        </div>
                        <div className="text-[10px] text-slateink truncate">
                          {profile.department ? `${profile.department} ` : ""}
                          {profile.year ? `· Acad Year ${profile.year}` : ""}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slateink">
                  <span className="flex items-center gap-1">
                    <CalendarDays size={12} />
                    {new Date(item.achieved_on).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="font-semibold text-emerald-700">Official NSS Honor</span>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-10 text-center text-xs sm:text-sm text-slateink">
            <Trophy className="mx-auto text-slate-300 mb-2" size={36} />
            <p className="font-semibold text-slate-700">No achievements recorded yet</p>
            <p className="text-xs text-slateink mt-1">
              Unit recognitions and volunteer spotlights will be showcased here.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}