"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/lib/pushNotifications";
import { Bell, BellRing, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationOptIn() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      return;
    }
    if (Notification.permission === "default") {
      setVisible(true);
    }
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setVisible(false);
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("Notifications aren't configured yet.");

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      await savePushSubscription(subscription.toJSON() as any);
      setVisible(false);
    } catch (e: any) {
      setError(e.message ?? "Could not enable notifications.");
    } finally {
      setBusy(false);
    }
  }

  if (!visible || dismissed) return null;

  return (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-brandblue text-white shrink-0">
          <Bell size={16} />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900">Get notified about new events</div>
          <div className="text-[11px] text-slateink">
            Turn on notifications so you never miss a new event posting.
          </div>
          {error && <div className="text-[11px] text-red-600 mt-1">{error}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy}
          className="text-xs font-bold bg-brandblue hover:bg-brandblueDark text-white px-3 py-2 rounded-xl inline-flex items-center gap-1.5"
        >
          <BellRing size={13} />
          {busy ? "Enabling..." : "Enable"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1"
          title="Dismiss"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}