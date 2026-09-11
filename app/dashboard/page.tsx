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

  const [
    { data: hoursTotal },
    { data: myRegistrations },
    { data: myAttendance },
    { data: campAttended },
  ] = await Promise.all([
    supabase.rpc("total_hours", { uid: viewer.id }),
    supabase
      .from("registrations")
      .select(
        "event_id, registered_at, events(id, title, category, event_date, event_time, location, status, hours_value)"
      )
      .eq("user_id", viewer.id),
    supabase
      .from("attendance")
      .select(
        "event_id, present, hours_awarded, marked_at, events(id, title, category, event_date, location)"
      )
      .eq("user_id", viewer.id)
      .eq("present", true)
      .order("marked_at", { ascending: false }),
    supabase
      .from("camp_attendance")
      .select(
        "camp_id, special_camps(id, name, start_date, end_date, location)"
      )
      .eq("user_id", viewer.id),
  ]);

  const isYear2 = viewer.tenureYear === 2;

  const eligibility = await checkYearEligibility(
    supabase,
    viewer.id,
    (isYear2 ? 2 : 1) as 1 | 2,
    false
  );

      const upcoming = (myRegistrations ?? [])
    .map((registration) => {
      const event = Array.isArray(registration.events)
        ? registration.events[0]
        : registration.events;

      return {
        ...registration,
        event,
      };
    })
    .filter((registration) => registration.event?.status === "upcoming")
    .sort(
      (a, b) =>
        new Date(a.event?.event_date ?? 0).getTime() -
        new Date(b.event?.event_date ?? 0).getTime()
    );

  const completedEvents = myAttendance ?? [];
  const totalVerifiedHours = Number(hoursTotal ?? 0);

  const YEAR1_TARGET = 120;
  const TOTAL_TARGET = 240;
  const hoursTarget = isYear2 ? TOTAL_TARGET : YEAR1_TARGET;
  const hoursProgress = Math.min(
    100,
    Math.round((totalVerifiedHours / hoursTarget) * 100)
  );
  const hoursRemaining = Math.max(0, hoursTarget - totalVerifiedHours);
  const reachedFlatTarget = totalVerifiedHours >= hoursTarget;

  return (
    <div className="min-h-screen bg-surface md:flex">
      <Nav viewer={viewer} />

      <main className="min-w-0 flex-1 px-4 pb-24 pt-16 md:px-10 md:py-10 md:pb-10">
        {/* Hero header */}
        <section className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-card p-6 text-navy shadow-sm sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brandblue/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-brandorange/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slateink">
                NSS Volunteer Dashboard
              </div>

              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-navy sm:text-4xl">
                Hi, {viewer.fullName.split(" ")[0]} 👋
              </h1>

              <p className="mt-2 text-sm text-slateink">
                {viewer.department ? `${viewer.department} ` : ""}
                {viewer.year ? `· Academic Year ${viewer.year}` : ""} ·
                Tenure Year {viewer.tenureYear}
              </p>

              <p className="mt-1 text-sm text-slateink">
                Serve. Learn. Grow. Together for a better tomorrow.
              </p>
            </div>

            {viewer.role === "core" && viewer.position && (
              <span className="inline-flex items-center gap-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800">
                <Sparkles
                  size={14}
                  className="fill-amber-400 text-amber-500"
                />
                {viewer.position}
              </span>
            )}
          </div>

          {/* Inline hours progress */}
          <div className="relative mt-7">
            <div className="flex items-end justify-between">
              <div className="font-display text-4xl font-bold tabular-nums text-navy">
                {totalVerifiedHours}
                <span className="ml-1 text-base font-medium text-slateink">
                  / {hoursTarget} hrs
                </span>
              </div>

              <div className="text-right text-xs text-slateink">
                {isYear2 ? "Year 2 · 240 total" : "Year 1 · 120 hrs"}
                <div className="font-display text-sm font-bold text-navy">
                  {hoursProgress}%
                </div>
              </div>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all ${
                  reachedFlatTarget && eligibility.eligible
                    ? "bg-emerald-400"
                    : "bg-gradient-to-r from-orange-400 to-amber-300"
                }`}
                style={{ width: `${hoursProgress}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-slateink">
              {reachedFlatTarget
                ? eligibility.eligible
                  ? "Requirements met — category minimums and total hours are both satisfied."
                  : `${totalVerifiedHours} hrs logged, but some categories still need attention.`
                : `${hoursRemaining} hrs remaining to reach your target.`}
            </p>
          </div>

          {reachedFlatTarget && !eligibility.eligible && (
            <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
              <span className="flex items-center gap-2">
                <AlertTriangle size={13} className="shrink-0" />
                Hours are unevenly spread across categories — this can block
                promotion.
              </span>

              <Link
                href="/profile"
                className="whitespace-nowrap font-bold hover:underline"
              >
                View breakdown →
              </Link>
            </div>
          )}
        </section>

        {/* Graduated banner */}
        {viewer.status === "graduated" && (
          <div className="mb-6 flex items-start gap-3 rounded-3xl border border-purple-200 bg-purple-50 p-5">
            <GraduationCap
              className="mt-0.5 shrink-0 text-purple-600"
              size={22}
            />

            <div>
              <h3 className="font-display text-sm font-bold text-purple-900">
                NSS 2-Year Tenure Completed
              </h3>

              <p className="mt-1 text-xs leading-relaxed text-purple-700">
                You have successfully graduated from the NSS Volunteer
                Programme. Your verified hours and achievements remain on
                record.
              </p>
            </div>
          </div>
        )}

        {/* Core tools */}
        {viewer.role === "core" && (
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-brandblue text-white">
                <Sparkles size={18} />
              </div>

              <div>
                <div className="font-display text-sm font-bold text-navy">
                  Core team privileges active
                </div>

                <div className="text-xs text-muted-foreground">
                  You can view attendee rosters for all events.
                </div>
              </div>
            </div>

            <Link href="/events" className="btn-secondary">
              Browse rosters
              <ChevronRight size={14} />
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          <div className="stat-card">
            <div className="stat-label">
              Verified hours
              <Clock size={15} className="text-brandblue" />
            </div>

            <div className="stat-value">
              {totalVerifiedHours}
              <span className="ml-1 text-sm font-medium text-muted-foreground">
                hrs
              </span>
            </div>

            <div className="mt-2 flex items-center gap-1 text-[11px] font-medium text-brandgreen">
              <CheckCircle2 size={12} />
              Officially verified
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              Upcoming
              <CalendarDays size={15} className="text-orange-500" />
            </div>

            <div className="stat-value">{upcoming.length}</div>

            <div className="mt-2 text-[11px] text-muted-foreground">
              Registered spots
            </div>
          </div>

          <div className="stat-card col-span-2 sm:col-span-1">
            <div className="stat-label">
              Completed
              <CalendarCheck2 size={15} className="text-brandgreen" />
            </div>

            <div className="stat-value">{completedEvents.length}</div>

            <div className="mt-2 text-[11px] text-muted-foreground">
              Attended &amp; logged
            </div>
          </div>
        </div>

        {/* Special camps */}
        {(campAttended ?? []).length > 0 && (
          <div className="mb-8 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Award size={16} className="text-emerald-700" />

              <span className="font-display text-sm font-bold text-emerald-900">
                Special camps attended
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(campAttended ?? []).map((c: any) => (
                <span
                  key={c.camp_id}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900"
                >
                  🏕️ {c.special_camps?.name ?? "Special Camp"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming events */}
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">
              <CalendarDays size={16} className="text-brandblue" />
              Your upcoming events
            </h2>

            <Link href="/events" className="link-subtle">
              Find more →
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div className="empty-state">
              <CalendarDays
                className="mx-auto mb-3 text-border"
                size={34}
              />

              <p className="font-display text-sm font-bold">
                No upcoming registrations
              </p>

              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Browse unit events and reserve your spot — first come, first
                served.
              </p>

              <Link
                href="/events"
                className="btn-primary mt-5 inline-flex"
              >
                Browse events
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((r: any) => (
  <div key={r.event_id} className="card-row group">
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip-blue">{r.events.category || "General"}</span>
        <span className="chip-green">+{r.events.hours_value} hrs</span>
      </div>

      <h3 className="mt-2 truncate font-display text-base font-bold">
        {r.events.title}
      </h3>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={13} />
          {new Date(r.events.event_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {r.events.event_time ? ` (${r.events.event_time})` : ""}
        </span>

        <span className="flex items-center gap-1.5">
          <MapPin size={13} />
          {r.events.location}
        </span>
      </div>
    </div>

    <div className="shrink-0 border-t border-border pt-3 sm:border-t-0 sm:pt-0">
      <span className="chip-green px-3 py-1.5">
        <CheckCircle2 size={13} />
        Registered
      </span>
    </div>
  </div>
))}
            </div>
          )}
        </section>

        {/* Hours ledger */}
        <section>
          <h2 className="section-title mb-4">
            <Award size={16} className="text-brandgreen" />
            Completed events &amp; hours history
          </h2>

          {completedEvents.length === 0 ? (
            <div className="empty-state text-xs text-muted-foreground sm:text-sm">
              No completed events yet. Once attendance is verified, your hours
              appear here.
            </div>
          ) : (
            <div className="table-shell">
              <div className="divide-y divide-border">
                {completedEvents.map((att: any) => (
                  <div
                    key={att.event_id}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">
                        {att.events?.title || "NSS Event"}
                      </div>

                      <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                        <span>
                          {att.events?.event_date
                            ? new Date(
                                att.events.event_date
                              ).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Past Event"}
                        </span>

                        {att.events?.location && (
                          <span>· {att.events.location}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 font-display text-sm font-bold tabular-nums text-emerald-800">
                        +{att.hours_awarded} hrs
                      </span>

                      <div className="mt-1 text-[10px] font-medium text-brandgreen">
                        Present ✓
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}