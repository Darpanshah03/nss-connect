"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyOfficial() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: role } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (role?.role !== "official")
    throw new Error("Only official accounts can manage events.");

  return { supabase, user };
}

export async function postEvent(formData: FormData) {
  const { supabase, user } = await verifyOfficial();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as string)?.trim() || "General";
  const eventDate = formData.get("event_date") as string;
  const eventTime = (formData.get("event_time") as string)?.trim() || null;
  const location = (formData.get("location") as string)?.trim();
  const capacity = Number(formData.get("capacity")) || 30;
  const hoursValue = Number(formData.get("hours_value")) || 0;

  if (!title || !eventDate || !location) {
    throw new Error("Title, event date, and location are required.");
  }

  const { error } = await supabase.from("events").insert({
    title,
    description,
    category,
    event_date: eventDate,
    event_time: eventTime,
    location,
    capacity,
    hours_value: hoursValue,
    status: "upcoming",
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/official/events");
  revalidatePath("/events");
  revalidatePath("/dashboard");
}

export async function deleteEvent(eventId: string) {
  const { supabase } = await verifyOfficial();

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);

  revalidatePath("/official/events");
  revalidatePath("/events");
}

export async function updateEventStatus(
  eventId: string,
  status: "upcoming" | "past" | "cancelled"
) {
  const { supabase } = await verifyOfficial();

  const { error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId);

  if (error) throw new Error(error.message);

  revalidatePath("/official/events");
  revalidatePath("/events");
}

