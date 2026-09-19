import { EVENT_CATEGORIES } from "./eventCategories";

export type EventHistoryStatus = "attended" | "missed" | "pending" | "not_registered";

export type EventHistoryEntry = {
  eventId: string;
  title: string;
  category: string | null;
  eventDate: string;
  hoursValue: number;
  status: EventHistoryStatus;
  hoursAwarded: number;
};

// Builds a full past-events record for one volunteer: every event that has
// already happened, classified as:
//   - attended: marked present, with the hours they earned
//   - missed: registered, but marked absent
//   - pending: registered, event has passed, but attendance hasn't been
//     marked yet by an official
//   - not_registered: never registered at all
// Cancelled events are excluded entirely — they never happened, so neither
// "attended" nor "missed" makes sense for them. Scoped to past events only,
// same as the volunteer-facing /events page's own past/upcoming split.
export async function getEventHistoryForUser(
  supabase: any,
  userId: string
): Promise<EventHistoryEntry[]> {
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: allEvents }, { data: myRegs }, { data: myAttendance }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, category, event_date, hours_value, status")
      .neq("status", "cancelled")
      .order("event_date", { ascending: false }),
    supabase.from("registrations").select("event_id").eq("user_id", userId),
    supabase.from("attendance").select("event_id, present, hours_awarded").eq("user_id", userId),
  ]);

  const registeredIds = new Set((myRegs ?? []).map((r: any) => r.event_id));
  type AttendanceRecord = {
  event_id: string;
  present: boolean | null;
  hours_awarded: number | null;
};

const attendanceByEvent = new Map<string, AttendanceRecord>(
  (myAttendance ?? []).map((a: AttendanceRecord) => [a.event_id, a])
);

  const pastEvents = (allEvents ?? []).filter(
    (e: any) => e.status === "past" || e.event_date < today
  );

  return pastEvents.map((e: any) => {
    const att = attendanceByEvent.get(e.id);
    let status: EventHistoryStatus;
    let hoursAwarded = 0;

    if (att) {
      status = att.present ? "attended" : "missed";
      hoursAwarded = att.present ? Number(att.hours_awarded) : 0;
    } else if (registeredIds.has(e.id)) {
      status = "pending";
    } else {
      status = "not_registered";
    }

    return {
      eventId: e.id,
      title: e.title,
      category: e.category,
      eventDate: e.event_date,
      hoursValue: Number(e.hours_value),
      status,
      hoursAwarded,
    };
  });
}