"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerForEvent } from "./actions";
import { Check, Loader2, Plus } from "lucide-react";

export default function RegisterButton({
  eventId,
  isRegistered,
}: {
  eventId: string;
  isRegistered: boolean;
}) {
  const [registered, setRegistered] = useState(isRegistered);
  const [error, setError] = useState<string | null>(null);

  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRegister() {
    if (registered || pending) return;

    setError(null);

    startTransition(() => {
      registerForEvent(eventId)
        .then(() => {
          setRegistered(true);
          router.refresh();
        })
        .catch((err) => {
          setError(
            err instanceof Error
              ? err.message
              : "Could not register for this event."
          );
        });
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleRegister}
        disabled={registered || pending}
        className={
          registered
            ? "flex w-full items-center justify-center gap-2 rounded-xl border border-brandgreen/30 bg-brandgreen/10 px-4 py-2.5 text-sm font-semibold text-brandgreen transition disabled:cursor-default"
            : "btn-primary w-full justify-center disabled:cursor-wait disabled:opacity-60"
        }
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registering…
          </>
        ) : registered ? (
          <>
            <Check className="h-4 w-4" />
            You're registered
          </>
        ) : (
          <>
            <Plus className="h-4 w-4" />
            Register for event
          </>
        )}
      </button>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium leading-5 text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}