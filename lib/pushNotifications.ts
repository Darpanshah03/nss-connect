"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPushToSubscription } from "@/lib/push";

// Called from the client once a volunteer grants notification permission.
export async function savePushSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "endpoint" }
  );
  if (error) throw new Error(error.message);
}

// Called from postEvent right after a new event is created. Never let a
// push failure block event creation — the caller wraps this in try/catch.
export async function broadcastNewEventNotification(
  eventTitle: string,
  excludeUserId: string
) {
  const supabase = createClient();
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .neq("user_id", excludeUserId);

  if (!subs || subs.length === 0) return;

  const payload = {
    title: "New NSS Event Posted",
    body: `"${eventTitle}" is now open for registration.`,
    url: "/events",
  };

  await Promise.all(
    subs.map(async (s) => {
      try {
        await sendPushToSubscription(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err: any) {
        // 404/410 means the browser's subscription is dead (uninstalled,
        // data cleared, etc.) — clean it up so we stop wasting sends on it.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
        }
      }
    })
  );
}