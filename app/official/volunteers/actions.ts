"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

// Creates a real login account directly — the official sets the password
// themselves and hands it to the volunteer. No email is sent, so this
// doesn't depend on Resend/SMTP being configured at all.
export async function createVolunteerAccount(formData: FormData) {
  const { supabase } = await verifyOfficial();

  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const fullName = (formData.get("full_name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim() || null;
  const year = parseInt(formData.get("year") as string) || null;
  const tenureYear = parseInt(formData.get("tenure_year") as string) || 1;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const rollNumber = (formData.get("roll_number") as string)?.trim() || null;
  const position = (formData.get("position") as string)?.trim() || null;

  if (!email || !email.includes("@")) throw new Error("A valid email is required.");
  if (!password || password.length < 8) throw new Error("Password must be at least 8 characters.");
  if (!fullName) throw new Error("Full name is required.");

  const admin = createAdminClient();

  // email_confirm: true means they can log in immediately with this
  // password — no confirmation email step at all.
  const { data, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createErr) {
    if (createErr.message.toLowerCase().includes("already registered")) {
      throw new Error("An account with this email already exists.");
    }
    throw new Error(createErr.message);
  }

  const newUserId = data.user.id;

  // Your on_auth_user_created trigger already made default profiles/roles
  // rows — this fills in the extra fields the trigger doesn't set.
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