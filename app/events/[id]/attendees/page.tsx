import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ExportButton from "@/components/ExportButton";
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  UserCheck,
  Users,
} from "lucide-react";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import Nav from "@/components/Nav";

export default async function AttendeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await getViewer();

  if (!viewer) redirect("/login");

  const { id } = await params;

  const supabase = createClient();

  const [
    { data: event },
    { data: registrations },
    { data: attendance },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single(),

    // Correct table: registrations
    supabase
      .from("registrations")
      .select(
        "id, user_id, registered_at, profiles(id, full_name, roll_number, department, year)"
      )
      .eq("event_id", id),

    // Attendance is stored separately
    supabase
      .from("attendance")
      .select("user_id, present, hours_awarded")
      .eq("event_id", id),
  ]);

  if (!event) {
    redirect("/events");
  }

  const attendanceByUser = new Map(
    (attendance ?? []).map((record) => [
      record.user_id,
      record,
    ])
  );

  /*
   * Build the final attendee rows by combining:
   *
   * registrations → who registered
   * attendance    → whether they were marked present
   */
  const rows = (registrations ?? []).map((registration) => {
    const attendanceRecord = attendanceByUser.get(
      registration.user_id
    );

    return {
      id: registration.id,
      user_id: registration.user_id,
      registered_at: registration.registered_at,
      profile: Array.isArray(registration.profiles)
        ? registration.profiles[0]
        : registration.profiles,
      present: attendanceRecord?.present ?? false,
      hours_awarded: attendanceRecord?.hours_awarded ?? 0,
    };
  });

  const presentCount = rows.filter(
    (row) => row.present
  ).length;

  const exportRows = rows.map((row) => ({
    Name: row.profile?.full_name ?? "Unknown",
    "Roll Number": row.profile?.roll_number ?? "",
    Department: row.profile?.department ?? "",
    Year: row.profile?.year ?? "",
    Attendance: row.present ? "Present" : "Pending",
    "Hours Awarded": row.hours_awarded,
  }));

  const exportFilename = `attendees-${event.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  return (
    <div className="min-h-screen bg-surface md:flex">
      <Nav viewer={viewer} />

      <main className="w-full flex-1 px-4 pb-24 pt-16 md:ml-72 md:px-8 md:py-10 md:pb-10">
        {/* Back */}
        <Link
          href={
            viewer.role === "official"
              ? "/official/events"
              : "/events"
          }
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to events
        </Link>

        {/* Event header */}
        <header className="card mb-8 overflow-hidden p-0">
          <div className="h-1.5 w-full bg-gradient-to-r from-brandsaffron via-brandwhite to-brandgreen" />

          <div className="flex flex-wrap items-end justify-between gap-6 p-6">
            <div className="min-w-0">
              <p className="chip-muted mb-3">
                Attendance roster
              </p>

              <h1 className="page-title break-words">
                {event.title}
              </h1>

              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {event.event_date && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 shrink-0" />

                    {new Date(
                      event.event_date
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}

                    {event.event_time
                      ? ` (${event.event_time})`
                      : ""}
                  </span>
                )}

                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {event.location}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" />
                  {rows.length} Registered
                </span>
              </div>
            </div>

            {/* Summary + export */}
            <div className="flex flex-wrap items-center gap-5">
              <div className="text-right">
                <div className="font-display text-3xl font-bold leading-none text-foreground">
                  {presentCount}
                  <span className="text-lg text-muted-foreground">
                    /{rows.length}
                  </span>
                </div>

                <div className="mt-1 text-xs text-muted-foreground">
                  Marked present
                </div>
              </div>

              <ExportButton
                filename={`${exportFilename}.csv`}
                rows={exportRows}
                label="Export Attendance"
              />
            </div>
          </div>
        </header>

        {/* Empty state */}
        {rows.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <UserCheck className="h-8 w-8 text-muted-foreground" />

            <p className="font-medium text-foreground">
              No registrations yet
            </p>

            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Volunteers who register for this event will appear
              here.
            </p>
          </div>
        ) : (
          <div className="table-shell overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">
                    #
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Volunteer
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Roll Number
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Department
                  </th>

                  <th className="px-4 py-3 font-medium">
                    Year
                  </th>

                  <th className="px-4 py-3 text-right font-medium">
                    Attendance
                  </th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row, index) => {
                  const name =
                    row.profile?.full_name ??
                    "Unknown Volunteer";

                  const initials = name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part: string) => part[0])
                    .join("")
                    .toUpperCase();

                  return (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 text-muted-foreground">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted font-display text-xs font-bold text-foreground">
                            {initials || "?"}
                          </span>

                          <div className="min-w-0">
                            <div className="font-medium text-foreground">
                              {name}
                            </div>

                            <div className="mt-0.5 text-xs text-muted-foreground">
                              Registered volunteer
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {row.profile?.roll_number ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {row.profile?.department ?? "—"}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {row.profile?.year
                          ? `Year ${row.profile.year}`
                          : "—"}
                      </td>

                      <td className="px-4 py-3 text-right">
                        {row.present ? (
                          <span className="chip-success">
                            Present
                          </span>
                        ) : (
                          <span className="chip-muted">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}