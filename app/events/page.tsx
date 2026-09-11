import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/getViewer";
import RegisterButton from "./RegisterButton";
import {
  CalendarDays,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default async function EventsPage() {
  const viewer = await getViewer();

  if (!viewer) {
    redirect("/login");
  }

  // Official users use the official event-management page.
  if (viewer.role === "official") {
    redirect("/official/events");
  }

  const supabase = createClient();

  /*
   * ---------------------------------------------------------
   * DATA
   * ---------------------------------------------------------
   * Do not change these tables:
   *   registrations -> event registration
   *   attendance    -> actual attendance / hours
   */

  const [{ data: events }, { data: myRegs }, { data: myAttendance }] =
    await Promise.all([
      supabase
        .from("events")
        .select(
          "id, title, description, category, event_date, event_time, location, capacity, hours_value, status"
        )
        .order("event_date", { ascending: true }),

      supabase
        .from("registrations")
        .select("event_id")
        .eq("user_id", viewer.id),

      supabase
        .from("attendance")
        .select("event_id, present, hours_awarded")
        .eq("user_id", viewer.id),
    ]);

  /*
   * ---------------------------------------------------------
   * REGISTRATION MAP
   * ---------------------------------------------------------
   */

  const registeredIds = new Set(
    (myRegs ?? []).map((registration) => registration.event_id)
  );

  /*
   * ---------------------------------------------------------
   * ATTENDANCE MAP
   * ---------------------------------------------------------
   *
   * This is deliberately separate from registration.
   *
   * Registered does NOT mean attended.
   * Attendance determines Attended / Missed.
   */

  const attendanceByEvent = new Map<
    string,
    {
      present: boolean;
      hours_awarded: number;
    }
  >();

  for (const attendance of myAttendance ?? []) {
    attendanceByEvent.set(attendance.event_id, {
      present: Boolean(attendance.present),
      hours_awarded: Number(attendance.hours_awarded ?? 0),
    });
  }

  /*
   * ---------------------------------------------------------
   * EVENT GROUPING
   * ---------------------------------------------------------
   *
   * Event status takes priority over the date.
   *
   * This prevents a completed event such as Ganpati Aagman
   * from appearing under Upcoming simply because its date is
   * today.
   */

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = (events ?? []).filter((event) => {
    if (event.status === "upcoming") {
      return event.event_date >= today;
    }

    return false;
  });

  const past = (events ?? []).filter((event) => {
    if (
      event.status === "past" ||
      event.status === "cancelled"
    ) {
      return true;
    }

    // Defensive fallback for older records whose status may
    // not have been updated yet.
    if (!event.status) {
      return event.event_date < today;
    }

    return event.event_date < today;
  });

  /*
   * Core members can view event rosters.
   * Volunteers cannot.
   */
  const canViewRoster = viewer.role === "core";

  /*
   * ---------------------------------------------------------
   * HELPERS
   * ---------------------------------------------------------
   */

  function formatDate(date: string | null) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function getAttendanceStatus(eventId: string) {
    const attendance = attendanceByEvent.get(eventId);

    /*
     * No attendance row means the officer has not recorded
     * attendance yet.
     */
    if (!attendance) {
      return {
        type: "pending" as const,
        label: "Attendance pending",
      };
    }

    /*
     * present=true is the authoritative attendance state.
     *
     * hours_awarded is displayed separately. Even if hours are
     * 0 for some reason, present=true still means Attended.
     */
    if (attendance.present) {
      return {
        type: "attended" as const,
        label: "Attended",
        hours: attendance.hours_awarded,
      };
    }

    /*
     * An explicit attendance row with present=false means
     * the volunteer was marked absent.
     */
    return {
      type: "missed" as const,
      label: "Missed",
    };
  }

  return (
    <div className="min-h-screen bg-background md:flex">
      {/* Fixed sidebar + desktop spacer */}
      <div className="shrink-0">
        {/* Nav is expected to render its own fixed sidebar */}
      </div>

      <main className="min-w-0 flex-1 px-4 pb-24 pt-16 md:px-8 md:py-8 md:pb-8">
        {/* -------------------------------------------------
            HEADER
        -------------------------------------------------- */}

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="chip-muted mb-3">Volunteer</p>

            <h1 className="page-title">Events</h1>

            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Register for upcoming drives and camps. Your attendance
              is confirmed by the officer on site.
            </p>
          </div>

          <div className="card flex gap-6 px-5 py-4">
            <div>
              <div className="font-display text-2xl">
                {upcoming.length}
              </div>

              <div className="text-xs text-muted-foreground">
                Upcoming
              </div>
            </div>

            <div className="w-px bg-border" />

            <div>
              <div className="font-display text-2xl">
                {registeredIds.size}
              </div>

              <div className="text-xs text-muted-foreground">
                Registered
              </div>
            </div>
          </div>
        </header>

        {/* -------------------------------------------------
            UPCOMING EVENTS
        -------------------------------------------------- */}

        <section className="mb-12">
          <h2 className="mb-4 font-display text-lg">
            Upcoming
          </h2>

          {upcoming.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />

              <p className="font-medium">
                No upcoming events
              </p>

              <p className="text-sm text-muted-foreground">
                New drives are posted by your programme officer.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((event) => {
                const isRegistered = registeredIds.has(event.id);

                return (
                  <article
                    key={event.id}
                    className="card group relative overflow-hidden p-0"
                  >
                    <div className="h-1.5 w-full bg-gradient-to-r from-brandsaffron via-brandwhite to-brandgreen" />

                    <div className="flex h-full flex-col p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg leading-tight">
                          {event.title}
                        </h3>

                        {isRegistered && (
                          <span className="chip-success shrink-0">
                            Registered
                          </span>
                        )}
                      </div>

                      {event.description && (
                        <p className="mb-5 line-clamp-3 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}

                      <dl className="mb-6 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4 shrink-0" />

                          <span className="text-foreground">
                            {formatDate(event.event_date)}
                          </span>
                        </div>

                        {event.event_time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />

                            <span className="text-foreground">
                              {event.event_time}
                            </span>
                          </div>
                        )}

                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />

                            <span className="text-foreground">
                              {event.location}
                            </span>
                          </div>
                        )}

                        {event.hours_value != null && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />

                            <span className="text-foreground">
                              {event.hours_value} service hours
                            </span>
                          </div>
                        )}

                        {event.capacity != null && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4 shrink-0" />

                            <span className="text-foreground">
                              Capacity: {event.capacity}
                            </span>
                          </div>
                        )}
                      </dl>

                      <div className="mt-auto">
                        {canViewRoster ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <RegisterButton
                              eventId={event.id}
                              isRegistered={isRegistered}
                            />

                            <Link
                              href={`/events/${event.id}/attendees`}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98]"
                            >
                              <Users className="h-4 w-4" />

                              <span>Roster</span>
                            </Link>
                          </div>
                        ) : (
                          <RegisterButton
                            eventId={event.id}
                            isRegistered={isRegistered}
                          />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* -------------------------------------------------
            PAST EVENTS
        -------------------------------------------------- */}

        {past.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-lg">
              Past events
            </h2>

            <div className="table-shell overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">
                      Event
                    </th>

                    <th className="px-4 py-3 font-medium">
                      Date
                    </th>

                    <th className="hidden px-4 py-3 font-medium sm:table-cell">
                      Location
                    </th>

                    <th className="px-4 py-3 text-right font-medium">
                      Status
                    </th>

                    {canViewRoster && (
                      <th className="px-4 py-3 text-right font-medium">
                        Roster
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {past.map((event) => {
                    const isRegistered = registeredIds.has(event.id);
                    const attendanceStatus = getAttendanceStatus(
                      event.id
                    );

                    return (
                      <tr
                        key={event.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          <div>{event.title}</div>

                          {isRegistered && (
                            <div className="mt-1 text-[11px] font-medium text-muted-foreground">
                              You registered for this event
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(
                            event.event_date
                          ).toLocaleDateString("en-IN")}
                        </td>

                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                          {event.location ?? "—"}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {attendanceStatus.type === "attended" ? (
                            <div className="inline-flex flex-col items-end gap-1">
                              <span className="chip-success inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Attended
                              </span>

                              {attendanceStatus.hours > 0 && (
                                <span className="text-[11px] font-semibold text-brandgreen">
                                  +{attendanceStatus.hours} hrs
                                </span>
                              )}
                            </div>
                          ) : attendanceStatus.type === "missed" ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                              <XCircle className="h-3.5 w-3.5" />
                              Missed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Attendance pending
                            </span>
                          )}
                        </td>

                        {canViewRoster && (
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/events/${event.id}/attendees`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                            >
                              <Users className="h-3.5 w-3.5" />
                              View roster
                            </Link>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}