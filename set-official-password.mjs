// One-time bootstrap script — sets a password on an existing Supabase auth
// user directly via the admin API, with no email involved.
//
// Usage:
//   node scripts/set-official-password.mjs nss@pvppcoe.ac.in YourNewPassword123
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to already
// be in your .env.local (same values you set up earlier).

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

function loadEnv() {
  const content = readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

loadEnv();

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error("Usage: node scripts/set-official-password.mjs <email> <password>");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const { data: users, error: listErr } = await supabase.auth.admin.listUsers();
if (listErr) {
  console.error("Failed to list users:", listErr.message);
  process.exit(1);
}

const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, { password });
if (updateErr) {
  console.error("Failed to set password:", updateErr.message);
  process.exit(1);
}

console.log(`Password set for ${email}. You can now log in at /login with this email and password.`);