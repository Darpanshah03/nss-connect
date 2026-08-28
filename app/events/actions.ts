"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// One-way First-Come-First-Serve registration
export async function registerForEvent(eventId: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in to register for events.");

  // Check volunteer status
  const { data: profile } = await supabase
    .from("profiles")
    .select("status")
    .eq("id", user.id)
    .single();

  if (profile && profile.status !== "active") {
    throw new Error(
      `Your account is marked as ${profile.status}. Only active volunteers can register for new events.`
    );
  }

  // Attempt RPC first for atomic locking
  const { data: rpcResult, error: rpcError } = await supabase.rpc("register_for_event", {
    p_event_id: eventId,
    p_user_id: user.id,
  });

  if (!rpcError && rpcResult) {
    if (!rpcResult.success) {
      throw new Error(rpcResult.error || "Could not complete registration.");
    }
  } else {
    // Fallback if RPC is not installed yet
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("id, capacity, status, registrations(user_id)")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      throw new Error("Event not found.");
    }

    if (event.status !== "upcoming") {
      throw new Error("Registrations are closed for this event.");
    }

    const registrations = (event.registrations as any[]) ?? [];
    if (registrations.some((r) => r.user_id === user.id)) {
      throw new Error("You are already registered for this event.");
    }

    if (registrations.length >= event.capacity) {
      throw new Error("This event has reached full capacity (First-Come-First-Serve).");
    }

    const { error: insertErr } = await supabase
      .from("registrations")
      .insert({ event_id: eventId, user_id: user.id });

    if (insertErr) {
      throw new Error(insertErr.message);
    }
  }

  revalidatePath("/events");
  revalidatePath("/dashboard");
  return { success: true };
}

