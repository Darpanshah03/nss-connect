"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

async function verifyOfficial() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
  const { data: role } = await supabase.from("roles").select("role").eq("user_id", user.id).single();
  if (role?.role !== "official") throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createCamp(formData: FormData) {
  const { supabase, user } = await verifyOfficial();

  const name = (formData.get("name") as string)?.trim();
  const location = (formData.get("location") as string)?.trim() || null;
  const start_date = formData.get("start_date") as string;
  const end_date = formData.get("end_date") as string;
  const description = (formData.get("description") as string)?.trim() || null;
  const hours_value = parseFloat(formData.get("hours_value") as string) || 0;

  if (!name || !start_date || !end_date) throw new Error("Name, start date and end date are required.");

  const { error } = await supabase.from("special_camps").insert({
    name, location, start_date, end_date, description, hours_value, created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/official/camps");
}

export async function deleteCamp(campId: string) {
  const { supabase } = await verifyOfficial();
  const { error } = await supabase.from("special_camps").delete().eq("id", campId);
  if (error) throw new Error(error.message);
  revalidatePath("/official/camps");
}

export async function saveCampAttendance(campId: string, presentUserIds: string[]) {
  const { supabase, user } = await verifyOfficial();

  // Delete existing attendance for this camp and re-insert
  await supabase.from("camp_attendance").delete().eq("camp_id", campId);

  if (presentUserIds.length > 0) {
    const rows = presentUserIds.map(uid => ({
      camp_id: campId,
      user_id: uid,
      marked_by: user.id,
    }));
    const { error } = await supabase.from("camp_attendance").insert(rows);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/official/camps");
  revalidatePath(`/official/camps/${campId}`);
  revalidatePath("/dashboard");
}