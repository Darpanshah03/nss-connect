"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (role?.role !== "official") {
    throw new Error("Unauthorized: Only official accounts can perform this action.");
  }
  return { supabase, user };
}

export async function setPosition(userId: string, position: string | null) {
  const { supabase } = await verifyOfficial();

  const { error } = await supabase
    .from("roles")
    .upsert({
      user_id: userId,
      role: position ? "core" : "volunteer",
      position: position?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}

export async function setTenureYear(userId: string, tenureYear: number) {
  const { supabase } = await verifyOfficial();

  if (tenureYear !== 1 && tenureYear !== 2) {
    throw new Error("Tenure year must be 1 or 2.");
  }

  const { error } = await supabase
    .from("profiles")
    .update({ tenure_year: tenureYear })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}

export async function setVolunteerStatus(
  userId: string,
  status: "active" | "graduated" | "removed"
) {
  const { supabase } = await verifyOfficial();

  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}

export async function inviteVolunteer(formData: FormData) {
  const { supabase } = await verifyOfficial(); // keeps your existing auth check

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const fullName = (formData.get("full_name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim() || null;
  const year = parseInt(formData.get("year") as string) || null;
  const tenureYear = parseInt(formData.get("tenure_year") as string) || 1;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const rollNumber = (formData.get("roll_number") as string)?.trim() || null;
  const position = (formData.get("position") as string)?.trim() || null;

  if (!email || !email.includes("@")) throw new Error("A valid email is required.");
  if (!fullName) throw new Error("Full name is required.");

  const admin = createAdminClient();

  // This creates the real auth user AND sends the one-time "set your password"
  // email in a single call. Your existing on_auth_user_created trigger fires
  // immediately after, creating default profiles/roles rows.
  const { data, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/set-password`,
  });

  if (inviteErr) throw new Error(inviteErr.message);

  const newUserId = data.user.id;

  // Fill in the extra fields your trigger doesn't set. Small delay isn't
  // needed — the trigger runs inside the same transaction as user creation.
  const { error: profileErr } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      department,
      year,
      tenure_year: tenureYear,
      phone,
      roll_number: rollNumber,
    })
    .eq("id", newUserId);

  if (profileErr) throw new Error(profileErr.message);

  if (position) {
    const { error: roleErr } = await supabase
      .from("roles")
      .update({ role: "core", position })
      .eq("user_id", newUserId);
    if (roleErr) throw new Error(roleErr.message);
  }

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}

