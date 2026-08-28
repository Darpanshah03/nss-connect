"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const fullName = (formData.get("full_name") as string)?.trim();
  const department = (formData.get("department") as string)?.trim() || null;
  const year = parseInt(formData.get("year") as string) || 1;
  const phone = (formData.get("phone") as string)?.trim() || null;
  const rollNumber = (formData.get("roll_number") as string)?.trim() || null;

  if (!fullName) throw new Error("Full name is required.");

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      department,
      year,
      phone,
      roll_number: rollNumber,
    })
    .eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/team");
}