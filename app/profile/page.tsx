import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import { updateProfile } from "./actions";
import {
  User,
  Sparkles,
  GraduationCap,
  Clock,
  LogOut,
  Save,
  ShieldAlert,
  Hash,
  Phone,
  BookOpen,
} from "lucide-react";

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const supabase = createClient();
  const { data: hoursTotal } = await supabase.rpc("total_hours", { uid: viewer.id });

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Your Volunteer Profile</h1>
          <p className="text-xs sm:text-sm text-slateink mt-0.5">
            View your verified NSS credentials, tenure standing, and update contact details.
          </p>
        </div>

        {/* Identity & Badge Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-6 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brandblue to-indigo-700 text-white flex items-center justify-center font-bold text-lg shadow-xs">
                {viewer.fullName.charAt(0)}
              </div>

              <div>
                <h2 className="font-bold text-base text-slate-900">{viewer.fullName}</h2>
                <div className="text-xs text-slateink">{viewer.email}</div>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {viewer.role === "core" && viewer.position ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl shadow-xs ring-1 ring-amber-400/30">
                  <Sparkles size={13} className="text-amber-600 fill-amber-500" />
                  {viewer.position}
                </span>
              ) : viewer.status === "graduated" ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1.5 rounded-xl">
                  <GraduationCap size={14} />
                  Graduated (2-Yr Tenure)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl">
                  Year {viewer.tenureYear} Volunteer
                </span>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">Verified Hours</div>
              <div className="text-xl font-bold font-mono text-brandblue mt-0.5">
                {Number(hoursTotal ?? 0)} <span className="text-xs font-normal">hrs</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
              <div className="text-[10px] uppercase font-bold text-slate-500">Tenure Status</div>
              <div className="text-sm font-bold text-slate-800 mt-1 capitalize">
                {viewer.status} · Year {viewer.tenureYear}
              </div>
            </div>
          </div>
        </div>

        {/* Edit Info Form */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-4 flex items-center gap-2">
            <User size={16} className="text-brandblue" />
            Edit Profile Information
          </h3>

          <form action={updateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                name="full_name"
                defaultValue={viewer.fullName}
                required
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none focus:border-brandblue"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <input
                  name="department"
                  defaultValue={viewer.department ?? ""}
                  placeholder="e.g. Information Technology"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Academic Year
                </label>
                <select
                  name="year"
                  defaultValue={viewer.year?.toString() ?? "1"}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  name="phone"
                  type="tel"
                  defaultValue={viewer.phone ?? ""}
                  placeholder="+91 98765 43210"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll / PRN Number
                </label>
                <input
                  name="roll_number"
                  defaultValue={viewer.rollNumber ?? ""}
                  placeholder="e.g. IT2024045"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                />
              </div>
            </div>

            <button
              type="submit"
              className="bg-brandblue hover:bg-brandblueDark text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Save size={14} />
              Save Profile
            </button>
          </form>
        </div>

        {/* Sign Out Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-xs sm:text-sm text-slate-900">Signed In As</div>
            <div className="text-xs text-slateink">{viewer.email}</div>
          </div>

          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl transition-colors inline-flex items-center gap-1.5"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}