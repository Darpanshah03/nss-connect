import { createClient } from "@/lib/supabase/server";

export type Viewer = {
  id: string;
  email?: string;
  fullName: string;
  department: string | null;
  year: number | null;
  tenureYear: number;
  status: "active" | "graduated" | "removed";
  phone: string | null;
  rollNumber: string | null;
  role: "volunteer" | "core" | "official";
  position: string | null;
} | null;

export async function getViewer(): Promise<Viewer> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  let [{ data: profile, error: profileError }, { data: role, error: roleError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, department, year, tenure_year, status, phone, roll_number")
      .eq("id", user.id)
      .single(),
    supabase.from("roles").select("role, position").eq("user_id", user.id).single(),
  ]);

  // PGRST116 = "no rows found" from .single() — this is the ONLY case where
  // it's actually safe to assume the row genuinely doesn't exist yet and
  // create a default. Any other error code means the read failed for some
  // other reason (network blip, connection pool issue, etc.) — in that
  // case we must NOT overwrite anything, since doing so could silently
  // downgrade a real official/core account back to 'volunteer' the moment
  // an unrelated, transient read failure happens to occur.
  const profileGenuinelyMissing = profileError?.code === "PGRST116";
  const roleGenuinelyMissing = roleError?.code === "PGRST116";

  if (profileError && !profileGenuinelyMissing) {
    throw new Error(`Could not load profile: ${profileError.message}`);
  }
  if (roleError && !roleGenuinelyMissing) {
    throw new Error(`Could not load role: ${roleError.message}`);
  }

  if (profileGenuinelyMissing) {
    const defaultName =
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Volunteer";
    await supabase.from("profiles").upsert({
      id: user.id,
      full_name: defaultName,
      tenure_year: 1,
      status: "active",
    });
    profile = {
      full_name: defaultName,
      department: null,
      year: 1,
      tenure_year: 1,
      status: "active",
      phone: null,
      roll_number: null,
    };
  }

  if (roleGenuinelyMissing) {
    await supabase.from("roles").upsert({
      user_id: user.id,
      role: "volunteer",
    });
    role = {
      role: "volunteer",
      position: null,
    };
  }

  return {
    id: user.id,
    email: user.email,
    fullName: profile?.full_name ?? user.email?.split("@")[0] ?? "Volunteer",
    department: profile?.department ?? null,
    year: profile?.year ?? null,
    tenureYear: profile?.tenure_year ?? 1,
    status: (profile?.status as NonNullable<Viewer>["status"]) ?? "active",
    phone: profile?.phone ?? null,
    rollNumber: profile?.roll_number ?? null,
    role: (role?.role as NonNullable<Viewer>["role"]) ?? "volunteer",
    position: role?.position ?? null,
  };
}