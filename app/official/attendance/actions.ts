"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveAttendance(eventId: string, presentUserIds: string[], hoursValue: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: registered } = await supabase
    .from("registrations")
    .select("user_id")
    .eq("event_id", eventId);

  const rows = (registered ?? []).map((r) => ({
    event_id: eventId,
    user_id: r.user_id,
    present: presentUserIds.includes(r.user_id),
    hours_awarded: presentUserIds.includes(r.user_id) ? hoursValue : 0,
    marked_by: user.id,
  }));

  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "event_id,user_id" });
  if (error) throw new Error(error.message);

  await supabase.from("events").update({ status: "past" }).eq("id", eventId);

  revalidatePath("/official/events");
  revalidatePath(`/official/attendance/${eventId}`);
}
