"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAttendance(
  eventId: string,
  presentUserIds: string[],
  hoursValue: number,
  walkInUserIds: string[] = []
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: registered } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("event_id", eventId);

  const registeredIds = new Set((registered ?? []).map((r) => r.user_id));

  const newWalkIns = walkInUserIds.filter((id) => !registeredIds.has(id));
  if (newWalkIns.length > 0) {
    const walkInRegistrationRows = newWalkIns.map((user_id) => ({
      event_id: eventId,
      user_id,
      status: "walk-in",
    }));
    const { error: regError } = await supabase
      .from("registrations")
      .upsert(walkInRegistrationRows, { onConflict: "event_id,user_id" });
    if (regError) throw new Error(regError.message);
  }

  const allUserIds = Array.from(new Set([...registeredIds, ...walkInUserIds]));

  // Snapshot each volunteer's current tenure_year so these hours are
  // permanently tied to the NSS year they were actually earned in.
  const { data: profilesData } = await supabase
    .from("profiles")
    .select("id, tenure_year")
    .in("id", allUserIds);

  const tenureByUser = new Map(
    (profilesData ?? []).map((p: any) => [p.id, p.tenure_year ?? 1])
  );

  const rows = allUserIds.map((user_id) => ({
    event_id: eventId,
    user_id,
    present: presentUserIds.includes(user_id),
    hours_awarded: presentUserIds.includes(user_id) ? hoursValue : 0,
    marked_by: user.id,
    nss_year: tenureByUser.get(user_id) ?? 1,
  }));

  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "event_id,user_id" });
  if (error) throw new Error(error.message);

  await supabase.from("events").update({ status: "past" }).eq("id", eventId);

  revalidatePath("/official/events");
  revalidatePath(`/official/attendance/${eventId}`);
}