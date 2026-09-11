"use client";

import { useTransition } from "react";
import { setPosition } from "./actions";

export default function PositionSelect({
  userId,
  currentPosition,
  options,
}: {
  userId: string;
  currentPosition: string | null;
  options: string[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative inline-flex items-center">
      <select
        defaultValue={currentPosition ?? ""}
        disabled={pending}
        onChange={(e) =>
          startTransition(() =>
            setPosition(userId, e.target.value || null)
          )
        }
        className="appearance-none rounded-xl border border-steel bg-white px-3 py-2 pr-9 text-xs font-semibold text-navy shadow-sm outline-none transition hover:border-saffron focus:border-saffron focus:ring-2 focus:ring-saffron/20 disabled:cursor-wait disabled:opacity-50"
        aria-label="Volunteer position"
      >
        <option value="">No position</option>

        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <span
        className={`pointer-events-none absolute right-3 text-[10px] font-bold ${
          pending ? "text-saffron" : "text-navy/40"
        }`}
      >
        {pending ? "…" : "▾"}
      </span>
    </div>
  );
}