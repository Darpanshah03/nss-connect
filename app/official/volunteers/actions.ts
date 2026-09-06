"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { checkYearEligibility, EligibilityResult } from "@/lib/hoursEligibility";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";

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

export async function setTenureYear(
  userId: string,
  tenureYear: number
): Promise<{ success: boolean; eligibility?: EligibilityResult }> {
  const { supabase } = await verifyOfficial();

  if (tenureYear !== 1 && tenureYear !== 2) {
    throw new Error("Tenure year must be 1 or 2.");
  }

  if (tenureYear === 2) {
    const result = await checkYearEligibility(supabase, userId, 1, false);
    if (!result.eligible) {
      return { success: false, eligibility: result };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ tenure_year: tenureYear })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
  return { success: true };
}

export async function setVolunteerStatus(
  userId: string,
  status: "active" | "graduated" | "removed"
): Promise<{ success: boolean; eligibility?: EligibilityResult }> {
  const { supabase } = await verifyOfficial();

  if (status === "graduated") {
    const result = await checkYearEligibility(supabase, userId, 2, true);
    if (!result.eligible) {
      return { success: false, eligibility: result };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
  return { success: true };
}

export async function addHourAdjustment(
  userId: string,
  nssYear: 1 | 2,
  category: string,
  hours: number,
  reason: string
) {
  const { supabase, user } = await verifyOfficial();

  if (!EVENT_CATEGORIES.includes(category)) {
    throw new Error("Invalid category.");
  }
  if (!hours || hours <= 0) {
    throw new Error("Hours must be a positive number.");
  }

  const { error } = await supabase.from("hour_adjustments").insert({
    user_id: userId,
    nss_year: nssYear,
    category,
    hours,
    reason: reason?.trim() || null,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
}

export async function deleteVolunteerPermanently(userId: string) {
  const { supabase, user } = await verifyOfficial();

  if (userId === user.id) {
    throw new Error("You cannot delete your own official account.");
  }

  const { data: targetRole } = await supabase
    .from("roles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (targetRole?.role === "official") {
    throw new Error(
      "Official accounts can't be permanently deleted from this panel. Change their role to core/volunteer first if this is intentional."
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}

export async function setProfilePhoto(userId: string, formData: FormData) {
  const { supabase } = await verifyOfficial();

  const croppedFile = formData.get("photo") as File | null;
  const originalFile = formData.get("photo_original") as File | null;
  if (!croppedFile || croppedFile.size === 0) {
    throw new Error("No photo selected.");
  }

  const croppedPath = `profiles/${userId}-cropped.jpg`;
  const { error: croppedErr } = await supabase.storage
    .from("nss-media")
    .upload(croppedPath, croppedFile, { contentType: "image/jpeg", upsert: true });
  if (croppedErr) throw new Error(`Photo upload failed: ${croppedErr.message}`);
  const { data: croppedUrlData } = supabase.storage.from("nss-media").getPublicUrl(croppedPath);

  let originalUrl: string | null = null;
  if (originalFile && originalFile.size > 0) {
    const ext = originalFile.name.split(".").pop() || "jpg";
    const originalPath = `profiles/${userId}-original.${ext}`;
    const { error: originalErr } = await supabase.storage
      .from("nss-media")
      .upload(originalPath, originalFile, { contentType: originalFile.type, upsert: true });
    if (originalErr) throw new Error(`Original photo upload failed: ${originalErr.message}`);
    const { data: originalUrlData } = supabase.storage.from("nss-media").getPublicUrl(originalPath);
    originalUrl = originalUrlData.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      photo_url: croppedUrlData.publicUrl,
      ...(originalUrl ? { photo_url_original: originalUrl } : {}),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}

// Official-only, unrestricted editing of a volunteer's info fields — unlike
// updateProfile (self-service, fill-empty-fields-only), this can change
// any field at any time, e.g. to correct a typo or fill in something the
// volunteer already locked in incorrectly.
export async function updateVolunteerInfo(
  userId: string,
  updates: {
    full_name?: string;
    department?: string | null;
    year?: number | null;
    phone?: string | null;
    roll_number?: string | null;
  }
) {
  const { supabase } = await verifyOfficial();

  const payload: Record<string, any> = {};
  if (updates.full_name !== undefined) {
    const trimmed = updates.full_name.trim();
    if (!trimmed) throw new Error("Full name cannot be empty.");
    payload.full_name = trimmed;
  }
  if (updates.department !== undefined) payload.department = updates.department?.trim() || null;
  if (updates.year !== undefined) payload.year = updates.year;
  if (updates.phone !== undefined) payload.phone = updates.phone?.trim() || null;
  if (updates.roll_number !== undefined) payload.roll_number = updates.roll_number?.trim() || null;

  if (Object.keys(payload).length === 0) return;

  const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
  if (error) throw new Error(error.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
  revalidatePath("/profile");
}

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

  const { error: profileErr } = await supabase
    .from("profiles")
    .upsert({
      id: newUserId,
      full_name: fullName,
      department,
      year,
      tenure_year: tenureYear,
      status: "active",
      phone,
      roll_number: rollNumber,
    });

  if (profileErr) throw new Error(profileErr.message);

  const { error: roleErr } = await supabase
    .from("roles")
    .upsert({
      user_id: newUserId,
      role: position ? "core" : "volunteer",
      position: position || null,
    }, { onConflict: "user_id" });

  if (roleErr) throw new Error(roleErr.message);

  revalidatePath("/official/volunteers");
  revalidatePath("/team");
}