import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import Link from "next/link";
import { checkYearEligibility } from "@/lib/hoursEligibility";
import {
  Clock,
  CalendarCheck2,
  CalendarDays,
  Sparkles,
  CheckCircle2,
  MapPin,
  ChevronRight,
  GraduationCap,
  Award,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role === "official") redirect("/official/events");

  const supabase = createClient();

  const [{ data: hoursTotal }, { data: myRegistrations }, { data: myAttendance }, { data: campAttended }] =
    await Promise.all([
      supabase.rpc("total_hours", { uid: viewer.id }),
      supabase
        .from("registrations")
        .select("event_id, registered_at, events(id, title, category, event_date, event_time, location, status, hours_value)")
        .eq("user_id", viewer.id),
      supabase
        .from("attendance")
        .select("event_id, present, hours_awarded, marked_at, events(id, title, category, event_date, location)")
        .eq("user_id", viewer.id)
        .eq("present", true)
        .order("marked_at", { ascending: false }),
      supabase
        .from("camp_attendance")
        .select("camp_id, special_camps(id, name, start_date, end_date, location)")
        .eq("user_id", viewer.id),
    ]);

  const isYear2 = viewer.tenureYear === 2;

  // Category-based eligibility for the CURRENT year — same source of truth
  // used on /profile and by the official's promotion/graduation gate. The
  // flat hours target below is just a simple motivator; this is what
  // actually determines "done" vs "not done".
  const eligibility = await checkYearEligibility(
    supabase,
    viewer.id,
    (isYear2 ? 2 : 1) as 1 | 2,
    false
  );

  const upcoming = (myRegistrations ?? [])
    // @ts-expect-error - joined shape
    .filter((r) => r.events?.status === "upcoming")
    // @ts-expect-error - joined shape
    .sort((a, b) => new Date(a.events.event_date).getTime() - new Date(b.events.event_date).getTime());

  const completedEvents = myAttendance ?? [];
  const totalVerifiedHours = Number(hoursTotal ?? 0);

  // NSS Hours targets — a simple flat-total motivator, NOT the actual
  // eligibility rule. The real rule (40/40/20/20 per category) lives in
  // `eligibility` above and on /profile. Reaching this flat number does
  // NOT by itself mean requirements are met — see the messaging below.
  const YEAR1_TARGET = 120;
  const TOTAL_TARGET = 240;
  const hoursTarget = isYear2 ? TOTAL_TARGET : YEAR1_TARGET;
  const hoursProgress = Math.min(100, Math.round((totalVerifiedHours / hoursTarget) * 100));
  const hoursRemaining = Math.max(0, hoursTarget - totalVerifiedHours);
  const reachedFlatTarget = totalVerifiedHours >= hoursTarget;

  return (
    <div className="md:flex min-h-screen bg-[#F8FAFC]">
      <Nav viewer={viewer} />
      <main className="flex-1 w-full px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8 max-w-4xl">
        {/* Welcome Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Welcome, {viewer.fullName.split(" ")[0]}!
              </h1>
              <p className="text-xs sm:text-sm text-slateink mt-0.5">
                {viewer.department ? `${viewer.department} ` : ""}
                {viewer.year ? `· Academic Year ${viewer.year}` : ""} · NSS Tenure Year {viewer.tenureYear}
              </p>
            </div>

            {viewer.role === "core" && viewer.position && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1 rounded-xl text-xs font-bold shadow-xs">
                <Sparkles size={14} className="text-amber-600 fill-amber-500" />
                <span>{viewer.position}</span>
              </div>
            )}
          </div>
        </div>

        {/* Graduated banner if applicable */}
        {viewer.status === "graduated" && (
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <GraduationCap className="text-purple-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-purple-900">NSS 2-Year Tenure Completed!</h3>
              <p className="text-xs text-purple-700 mt-0.5">
                You have successfully graduated from the NSS Volunteer Programme. Your verified hours and achievements remain on record.
              </p>
            </div>
          </div>
        )}

        {/* Core Head Quick Tools Banner */}
        {viewer.role === "core" && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brandblue text-white rounded-xl">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">Core Team Privileges Active</div>
                <div className="text-[11px] text-slateink">
                  You can view attendee rosters for all upcoming and past events.
                </div>
              </div>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold bg-white border border-blue-200 text-brandblue px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
            >
              Browse Event Rosters
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          {/* Hours Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slateink mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Verified Hours</span>
              <Clock size={16} className="text-brandblue" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {totalVerifiedHours}
              <span className="text-xs font-normal text-slateink ml-1">hrs</span>
            </div>
            <div className="mt-2 text-[11px] text-brandgreen font-medium flex items-center gap-1">
              <CheckCircle2 size={12} />
              Officially Verified
            </div>
          </div>

          {/* Upcoming Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-slateink mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Upcoming Events</span>
              <CalendarDays size={16} className="text-orange-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {upcoming.length}
            </div>
            <div className="mt-2 text-[11px] text-slateink">
              Registered spots
            </div>
          </div>

          {/* Completed Events Card */}
          <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between text-slateink mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Completed Events</span>
              <CalendarCheck2 size={16} className="text-brandgreen" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
              {completedEvents.length}
            </div>
            <div className="mt-2 text-[11px] text-slateink">
              Attended & logged
            </div>
          </div>
        </div>

        {/* NSS Hours Progress Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-bold text-slate-700">
                NSS Hours Progress — {isYear2 ? "Year 2 (Target: 240 Total)" : "Year 1 (Target: 120 hrs)"}
              </div>
              <div className="text-[11px] text-slateink mt-0.5">
                {reachedFlatTarget
                  ? eligibility.eligible
                    ? "🎉 Requirements met! Category minimums and total hours are both satisfied."
                    : `You've logged ${totalVerifiedHours} hrs total, but some categories still need attention — see the breakdown on your Profile.`
                  : `${hoursRemaining} hrs remaining to reach the ${isYear2 ? "2-year (240 hrs)" : "Year 1 (120 hrs)"} total`}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-sm font-extrabold font-mono text-brandblue">{totalVerifiedHours}<span className="text-xs font-normal text-slateink">/{hoursTarget}</span></div>
              <div className="text-[10px] text-slateink">{hoursProgress}%</div>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${
                reachedFlatTarget && eligibility.eligible ? "bg-emerald-500" : "bg-brandblue"
              }`}
              style={{ width: `${hoursProgress}%` }}
            />
          </div>

          {reachedFlatTarget && !eligibility.eligible && (
            <div className="mt-2 text-[11px] text-amber-700 bg-amber-50 rounded-xl px-3 py-1.5 border border-amber-200 flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={12} className="shrink-0" />
                Hours are unevenly spread across categories — this can block promotion/graduation.
              </span>
              <Link href="/profile" className="font-semibold whitespace-nowrap hover:underline">
                View breakdown →
              </Link>
            </div>
          )}
        </div>

        {/* Special Camps Badge */}
        {(campAttended ?? []).length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Award size={16} className="text-emerald-700" />
              <span className="text-xs font-bold text-emerald-900">Special Camps Attended</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(campAttended ?? []).map((c: any) => (
                <span key={c.camp_id} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white border border-emerald-200 text-emerald-900 px-2.5 py-1 rounded-xl">
                  🏕️ {c.special_camps?.name ?? "Special Camp"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section 1: Upcoming Registered Events */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <CalendarDays size={16} className="text-brandblue" />
              Your Upcoming Events
            </h2>
            <Link href="/events" className="text-xs font-semibold text-brandblue hover:underline">
              Find More Events →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <CalendarDays className="mx-auto text-slate-300 mb-2" size={32} />
              <p className="text-xs sm:text-sm font-medium text-slate-700">No upcoming event registrations</p>
              <p className="text-xs text-slateink mt-1 max-w-xs mx-auto">
                Browse available NSS unit events and reserve your spot on a first-come, first-served basis.
              </p>
              <Link
                href="/events"
                className="mt-4 inline-block bg-brandblue text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r: any) => (
                <div
                  key={r.event_id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-brandblue px-2 py-0.5 rounded-md">
                        {r.events.category || "General"}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        +{r.events.hours_value} Hours
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm sm:text-base text-slate-900 mt-1.5 truncate">
                      {r.events.title}
                    </h3>
                    <div className="text-xs text-slateink mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={13} />
                        {new Date(r.events.event_date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {r.events.event_time ? ` (${r.events.event_time})` : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={13} />
                        {r.events.location}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-xs font-bold text-brandgreen bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Registered
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Completed Events & Verified Hours Ledger */}
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Award size={16} className="text-brandgreen" />
            Completed Events & Hours History
          </h2>

          {completedEvents.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs sm:text-sm text-slateink">
              No completed events logged yet. Once you attend events and attendance is officially verified, your hours will appear here.
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="divide-y divide-slate-100">
                {completedEvents.map((att: any) => (
                  <div
                    key={att.event_id}
                    className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {att.events?.title || "NSS Event"}
                      </div>
                      <div className="text-[11px] text-slateink mt-0.5 flex flex-wrap gap-x-2">
                        <span>
                          {att.events?.event_date
                            ? new Date(att.events.event_date).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Past Event"}
                        </span>
                        {att.events?.location && <span>· {att.events.location}</span>}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-mono text-xs sm:text-sm px-2.5 py-1 rounded-xl">
                        +{att.hours_awarded} hrs
                      </span>
                      <div className="text-[10px] text-brandgreen font-medium mt-0.5">Present ✓</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}