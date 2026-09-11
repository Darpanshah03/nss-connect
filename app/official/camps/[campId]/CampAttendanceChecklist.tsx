"use client";

import { useState, useTransition } from "react";
import { saveCampAttendance } from "../actions";
import { CheckCircle2, Search, CheckSquare, Square, Loader2, Tent } from "lucide-react";

type Volunteer = {
  id: string;
  name: string;
  department: string;
  year?: number;
  tenureYear?: number;
  rollNumber?: string | null;
};

export default function CampAttendanceChecklist({
  campId,
  volunteers,
  initialAttendeeIds,
}: {
  campId: string;
  volunteers: Volunteer[];
  initialAttendeeIds: string[];
}) {
  const [attended, setAttended] = useState<Set<string>>(new Set(initialAttendeeIds));
  const [search, setSearch] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const filtered = volunteers.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.department.toLowerCase().includes(search.toLowerCase()) ||
      (v.rollNumber && v.rollNumber.toLowerCase().includes(search.toLowerCase()))
  );

  function toggle(id: string) {
    setAttended((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveCampAttendance(campId, Array.from(attended));
      setSaved(true);
    });
  }

  const pct = volunteers.length ? Math.round((attended.size / volunteers.length) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-foreground p-5 text-background">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] opacity-60">Camp attendance</p>
            <p className="font-display text-3xl font-extrabold tracking-tight">
              {attended.size}
              <span className="text-lg opacity-50"> / {volunteers.length}</span>
            </p>
          </div>
          <p className="font-mono text-sm opacity-70">{pct}% marked</p>
        </div>
        <div className="relative mt-4 h-2 w-full overflow-hidden rounded-full bg-background/20">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name, department or roll number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setAttended(new Set(volunteers.map((v) => v.id))); setSaved(false); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-bold text-primary transition hover:bg-primary/15"
          >
            <CheckSquare size={14} /> Select all
          </button>
          <button
            onClick={() => { setAttended(new Set()); setSaved(false); }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground transition hover:bg-muted/70"
          >
            <Square size={14} /> Clear
          </button>
        </div>
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
        <ul className="divide-y divide-border">
          {filtered.map((v) => {
            const isPresent = attended.has(v.id);
            return (
              <li key={v.id}>
                <label
                  className={`flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition-colors sm:px-5 ${
                    isPresent ? "bg-emerald-500/[0.07]" : "hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isPresent}
                    onChange={() => toggle(v.id)}
                    className="h-4.5 w-4.5 cursor-pointer rounded accent-emerald-600"
                  />
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${
                      isPresent ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {v.name.slice(0, 2).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-bold text-foreground">{v.name}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Yr {v.tenureYear ?? 1}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
                      {v.department && <span>{v.department}</span>}
                      {v.year && <span>· Acad Yr {v.year}</span>}
                      {v.rollNumber && <span className="font-mono">· {v.rollNumber}</span>}
                    </div>
                  </div>
                  <span className="shrink-0">
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                        <Tent size={12} /> Attended
                      </span>
                    ) : (
                      <span className="rounded-xl bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        Not marked
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        {volunteers.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No active volunteers in the roster.</div>
        )}
        {volunteers.length > 0 && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-muted-foreground">No volunteers match “{search}”.</div>
        )}
      </div>

      {/* Sticky save */}
      <div className="sticky bottom-3 z-10">
        <button
          onClick={handleSave}
          disabled={pending || volunteers.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-sm font-extrabold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
        >
          {pending ? (
            <><Loader2 size={16} className="animate-spin" /> Saving camp attendance…</>
          ) : (
            `Save — ${attended.size} volunteer${attended.size !== 1 ? "s" : ""} attended`
          )}
        </button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 size={18} className="shrink-0" />
          <span className="text-sm font-semibold">Camp attendance saved — volunteer profiles updated.</span>
        </div>
      )}
    </div>
  );
}
