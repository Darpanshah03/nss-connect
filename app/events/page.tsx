import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import RegisterButton from "./RegisterButton";
import { CalendarDays, MapPin, Users, Clock } from "lucide-react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import Nav from "@/components/Nav";

export default async function EventsPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role === "official") redirect("/official/events");

  const supabase = createClient();

  const [{ data: events }, { data: myRegs }, { data: myAttendance }] = await Promise.all([
    supabase.from("events").select("*").order("event_date", { ascending: true }),
    supabase.from("registrations").select("event_id").eq("user_id", viewer.id),
    supabase.from("attendance").select("event_id, present, hours_awarded").eq("user_id", viewer.id),
  ]);

  const registeredIds = new Set((myRegs ?? []).map((r) => r.event_id));
  const attendanceByEvent = new Map(
    (myAttendance ?? []).map((row) => [row.event_id, row])
  );

  const today = new Date().toISOString().slice(0, 10);

  const upcoming = (events ?? []).filter(
    (event) => event.status === "upcoming" && event.event_date >= today
  );

  const past = (events ?? []).filter(
    (event) =>
      event.status === "past" ||
      event.status === "cancelled" ||
      event.event_date < today
  );

  const canViewRoster = viewer.role === "core";

  return (
    <div className="min-h-screen bg-surface md:flex">
      <Nav viewer={viewer} />
      <main className="min-w-0 flex-1 px-4 pb-24 pt-16 md:px-8 md:py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="chip-muted mb-3">Volunteer</p>
            <h1 className="page-title">Events</h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Register for upcoming drives and camps. Your attendance is confirmed by the officer on site.
            </p>
          </div>
          <div className="card flex gap-6 px-5 py-4">
            <div>
              <div className="font-display text-2xl">{upcoming.length}</div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </div>
            <div className="w-px bg-border" />
            <div>
              <div className="font-display text-2xl">{registeredIds.size}</div>
              <div className="text-xs text-muted-foreground">Registered</div>
            </div>
          </div>
        </header>

        <section className="mb-12">
          <h2 className="mb-4 font-display text-lg">Upcoming</h2>
          {upcoming.length === 0 ? (
            <div className="card flex flex-col items-center gap-2 px-6 py-14 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">No upcoming events</p>
              <p className="text-sm text-muted-foreground">New drives are posted by your programme officer.</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((event) => {
                const isRegistered = registeredIds.has(event.id);

                return (
                  <article key={event.id} className="card group relative overflow-hidden p-0">
                    <div className="h-1.5 w-full bg-gradient-to-r from-brandsaffron via-brandwhite to-brandgreen" />
                    <div className="flex h-full flex-col p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg leading-tight">{event.title}</h3>
                        {isRegistered && <span className="chip-success shrink-0">Registered</span>}
                      </div>

                      <p className="mb-5 line-clamp-3 text-sm text-muted-foreground">
                        {event.description || "NSS unit event"}
                      </p>

                      <dl className="mb-6 space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          <span className="text-foreground">
                            {new Date(event.event_date).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {event.event_time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="text-foreground">{event.event_time}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="text-foreground">{event.location}</span>
                          </div>
                        )}
                        {event.hours_value != null && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="text-foreground">{event.hours_value} service hours</span>
                          </div>
                        )}
                      </dl>

                      <div className="mt-auto">
                        {canViewRoster ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <RegisterButton eventId={event.id} isRegistered={isRegistered} />
                            <Link
                              href={`/events/${event.id}/attendees`}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 active:scale-[0.98]"
                            >
                              <Users className="h-4 w-4" />
                              <span>Roster</span>
                            </Link>
                          </div>
                        ) : (
                          <RegisterButton eventId={event.id} isRegistered={isRegistered} />
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg">Past Events</h2>
          {past.length === 0 ? (
            <div className="card px-6 py-10 text-center text-sm text-muted-foreground">
              No past events yet.
            </div>
          ) : (
            <div className="table-shell overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    {canViewRoster && <th className="px-4 py-3 text-right font-medium">Roster</th>}
                  </tr>
                </thead>
                <tbody>
                  {past.map((event) => {
                    const attendance = attendanceByEvent.get(event.id);
                    const isAttended = attendance?.present === true;
                    const isMissed = attendance?.present === false;

                    return (
                      <tr key={event.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{event.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(event.event_date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{event.location ?? "—"}</td>
                        <td className="px-4 py-3">
                          {isAttended ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="chip-success">Attended</span>
                              {Number(attendance?.hours_awarded ?? 0) > 0 && (
                                <span className="text-xs font-semibold text-brandgreen">
                                  +{attendance?.hours_awarded} hrs
                                </span>
                              )}
                            </div>
                          ) : isMissed ? (
                            <span className="chip-muted">Missed</span>
                          ) : (
                            <span className="chip-muted">Attendance pending</span>
                          )}
                        </td>
                        {canViewRoster && (
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/events/${event.id}/attendees`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
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
          )}
        </section>
      </main>
    </div>
  );
}
