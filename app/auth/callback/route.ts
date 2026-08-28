import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data?.user;

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      if (!profile) {
        await supabase.from("profiles").upsert({
          id: user.id,
          full_name:
            user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Volunteer",
          tenure_year: 1,
          status: "active",
        });
      }

      const { data: role } = await supabase
        .from("roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!role) {
        await supabase.from("roles").upsert({
          user_id: user.id,
          role: "volunteer",
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}