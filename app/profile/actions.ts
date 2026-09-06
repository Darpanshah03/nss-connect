"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const LOCKABLE_FIELDS = ["full_name", "department", "year", "phone", "roll_number"] as const;
type LockableField = (typeof LOCKABLE_FIELDS)[number];

// Volunteers can only fill in a field that's currently empty — once set,
// only an official can change it (via updateVolunteerInfo in
// app/official/volunteers/actions.ts). This is enforced here server-side,
// not just by disabling inputs in the UI, so it can't be bypassed by a
// crafted request.
export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { data: current, error: fetchErr } = await supabase
    .from("profiles")
    .select("full_name, department, year, phone, roll_number")
    .eq("id", user.id)
    .single();

  if (fetchErr || !current) throw new Error("Could not load your current profile.");

  const submitted: Record<LockableField, any> = {
    full_name: (formData.get("full_name") as string)?.trim() || null,
    department: (formData.get("department") as string)?.trim() || null,
    year: formData.get("year") ? parseInt(formData.get("year") as string) : null,
    phone: (formData.get("phone") as string)?.trim() || null,
    roll_number: (formData.get("roll_number") as string)?.trim() || null,
  };

  const updates: Record<string, any> = {};

  for (const field of LOCKABLE_FIELDS) {
    const currentValue = (current as any)[field];
    const isCurrentlyEmpty =
      currentValue === null || currentValue === undefined || currentValue === "";
    const submittedValue = submitted[field];
    const hasNewValue = submittedValue !== null && submittedValue !== "";

    if (isCurrentlyEmpty && hasNewValue) {
      updates[field] = submittedValue;
    }
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/team");
}