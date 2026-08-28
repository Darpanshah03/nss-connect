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
    <select
      defaultValue={currentPosition ?? ""}
      disabled={pending}
      onChange={(e) => startTransition(() => setPosition(userId, e.target.value || null))}
      className="text-xs border border-slate-200 rounded-lg px-2 py-1.5"
    >
      <option value="">No position</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
