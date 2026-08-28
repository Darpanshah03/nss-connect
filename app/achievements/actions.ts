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

  if (role?.role !== "official") {
    throw new Error("Only the official account can manage achievements.");
  }

  return { supabase, user };
}

export async function postAchievement(formData: FormData) {
  const { supabase, user } = await verifyOfficial();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const category = (formData.get("category") as string) || "unit";
  const badgeIcon = (formData.get("badge_icon") as string) || "trophy";
  const userId = (formData.get("user_id") as string) || null;
  const achievedOn =
    (formData.get("achieved_on") as string) || new Date().toISOString().split("T")[0];

  if (!title) throw new Error("Achievement title is required.");

  const { error } = await supabase.from("achievements").insert({
    title,
    description,
    category,
    badge_icon: badgeIcon,
    user_id: userId || null,
    achieved_on: achievedOn,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/achievements");
  revalidatePath("/dashboard");
}

export async function deleteAchievement(achievementId: string) {
  const { supabase } = await verifyOfficial();

  const { error } = await supabase
    .from("achievements")
    .delete()
    .eq("id", achievementId);

  if (error) throw new Error(error.message);

  revalidatePath("/achievements");
}