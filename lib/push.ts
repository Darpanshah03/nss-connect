import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:your-real-contact-email@example.com", // TODO: replace with a real address you check
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushToSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url: string }
) {
  return webpush.sendNotification(subscription, JSON.stringify(payload));
}