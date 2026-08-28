import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// SERVER-ONLY. Never import this file from a "use client" component —
// the service role key bypasses Row Level Security entirely.
// It must only be called from Server Actions / Route Handlers.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is missing from your environment. " +
      "Copy it from Supabase Project Settings > API and add it to .env.local."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}