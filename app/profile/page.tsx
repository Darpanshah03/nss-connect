import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import { updateProfile } from "./actions";
import { checkYearEligibility } from "@/lib/hoursEligibility";
import {
  User,
  Sparkles,
  GraduationCap,
  Clock,
  LogOut,
  Save,
  Lock,
  CheckCircle2,
  XCircle,
  Tent,
} from "lucide-react";

function isEmpty(v: any) {
  return v === null || v === undefined || v === "";
}

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");

  const supabase = createClient();
  const { data: hoursTotal } = await supabase.rpc("total_hours", { uid: viewer.id });

  const eligibility = await checkYearEligibility(
    supabase,
    viewer.id,
    (viewer.tenureYear === 2 ? 2 : 1) as 1 | 2,
    true
  );

  const anyEditable =
    isEmpty(viewer.fullName) ||
    isEmpty(viewer.department) ||
    isEmpty(viewer.year) ||
    isEmpty(viewer.phone) ||
    isEmpty(viewer.rollNumber);

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

        {/* Year Requirements Progress Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 flex items-center gap-2">
            <Clock size={16} className="text-brandblue" />
            Year {viewer.tenureYear} Requirements
          </h3>
          <p className="text-xs text-slateink mb-4">
            {viewer.tenureYear === 1
              ? "Complete these to become eligible for promotion to Year 2."
              : "Complete these, plus attending a Special Camp during your tenure, to graduate."}
          </p>

          <div className="space-y-2.5">
            {eligibility.breakdown.map((b) => {
              const pct = Math.min(100, Math.round((b.earned / b.required) * 100));
              return (
                <div key={b.category}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-800">
                      {b.met ? (
                        <CheckCircle2 size={13} className="text-emerald-600" />
                      ) : (
                        <XCircle size={13} className="text-slate-300" />
                      )}
                      {b.category}
                    </span>
                    <span className={`font-mono font-bold ${b.met ? "text-emerald-700" : "text-slate-600"}`}>
                      {b.earned}/{b.required} hrs
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${b.met ? "bg-emerald-500" : "bg-brandblue"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`mt-4 flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs ${
              eligibility.campAttended
                ? "bg-emerald-50 border-emerald-200"
                : "bg-slate-50 border-slate-200"
            }`}
          >
            <span className="flex items-center gap-1.5 font-semibold text-slate-800">
              <Tent size={14} className={eligibility.campAttended ? "text-emerald-600" : "text-slate-400"} />
              Special Camp Attendance
            </span>
            <span className={`font-bold ${eligibility.campAttended ? "text-emerald-700" : "text-slate-500"}`}>
              {eligibility.campAttended ? "Attended ✓" : "Not attended yet"}
            </span>
          </div>

          <p className="text-[11px] text-slateink mt-3">
            Short on hours? Talk to your NSS official — they can add verified hours for activities
            completed outside the app.
          </p>
        </div>

        {/* Edit Info Form */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs mb-6">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 mb-1 flex items-center gap-2">
            <User size={16} className="text-brandblue" />
            Your Info
          </h3>
          <p className="text-xs text-slateink mb-4">
            You can fill in any detail that's currently blank. Once a field is saved, it's locked —
            contact your NSS official to correct it after that.
          </p>

          <form action={updateProfile} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              {isEmpty(viewer.fullName) ? (
                <input
                  name="full_name"
                  required
                  placeholder="Your full name"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 outline-none focus:border-brandblue"
                />
              ) : (
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-700">
                  <span>{viewer.fullName}</span>
                  <Lock size={13} className="text-slate-400 shrink-0" />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                {isEmpty(viewer.department) ? (
                  <input
                    name="department"
                    placeholder="e.g. Information Technology"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700">
                    <span>{viewer.department}</span>
                    <Lock size={13} className="text-slate-400 shrink-0" />
                  </div>
                )}
              </div>

              {/* Academic Year */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                {isEmpty(viewer.year) ? (
                  <select
                    name="year"
                    defaultValue=""
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue bg-white"
                  >
                    <option value="" disabled>
                      Select year
                    </option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700">
                    <span>Year {viewer.year}</span>
                    <Lock size={13} className="text-slate-400 shrink-0" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                {isEmpty(viewer.phone) ? (
                  <input
                    name="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700">
                    <span>{viewer.phone}</span>
                    <Lock size={13} className="text-slate-400 shrink-0" />
                  </div>
                )}
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll / PRN Number</label>
                {isEmpty(viewer.rollNumber) ? (
                  <input
                    name="roll_number"
                    placeholder="e.g. IT2024045"
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-brandblue"
                  />
                ) : (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700">
                    <span>{viewer.rollNumber}</span>
                    <Lock size={13} className="text-slate-400 shrink-0" />
                  </div>
                )}
              </div>
            </div>

            {anyEditable ? (
              <button
                type="submit"
                className="bg-brandblue hover:bg-brandblueDark text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
              >
                <Save size={14} />
                Save Info
              </button>
            ) : (
              <p className="text-[11px] text-slateink flex items-center gap-1.5">
                <Lock size={12} />
                All fields are filled in. Contact your NSS official to change anything above.
              </p>
            )}
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