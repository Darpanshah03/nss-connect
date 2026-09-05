"use client";

import { useMemo, useState, useTransition } from "react";
import { saveAttendance } from "../actions";
import {
  CheckCircle2,
  Search,
  CheckSquare,
  Square,
  Loader2,
  UserPlus,
  X,
  PlusCircle,
} from "lucide-react";
import Link from "next/link";

type Volunteer = {
  id: string;
  name: string;
  department: string;
  year?: number;
  tenureYear?: number;
  rollNumber?: string | null;
};

export default function AttendanceChecklist({
  eventId,
  hoursValue,
  volunteers,
  allVolunteers,
  initialPresentIds,
}: {
  eventId: string;
  hoursValue: number;
  volunteers: Volunteer[];
  allVolunteers: Volunteer[];
  initialPresentIds?: string[];
}) {
  // Registered volunteers (from the event's registrations table)
  const registeredIds = useMemo(() => new Set(volunteers.map((v) => v.id)), [volunteers]);

  // Walk-ins: volunteers who weren't registered but showed up and got added here
  const [walkInIds, setWalkInIds] = useState<Set<string>>(new Set());

  const [present, setPresent] = useState<Set<string>>(
    new Set(initialPresentIds ?? volunteers.map((v) => v.id))
  );

  const [search, setSearch] = useState("");
  const [walkInQuery, setWalkInQuery] = useState("");
  const [showWalkInSearch, setShowWalkInSearch] = useState(false);

  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const volunteerById = useMemo(() => {
    const map = new Map<string, Volunteer>();
    volunteers.forEach((v) => map.set(v.id, v));
    allVolunteers.forEach((v) => {
      if (!map.has(v.id)) map.set(v.id, v);
    });
    return map;
  }, [volunteers, allVolunteers]);

  // Full roster shown in the checklist = registered + any walk-ins added
  const roster = useMemo(() => {
    const walkInVolunteers = Array.from(walkInIds)
      .map((id) => volunteerById.get(id))
      .filter((v): v is Volunteer => Boolean(v));
    return [...volunteers, ...walkInVolunteers];
  }, [volunteers, walkInIds, volunteerById]);

  const filteredRoster = roster.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.department.toLowerCase().includes(search.toLowerCase()) ||
      (v.rollNumber && v.rollNumber.toLowerCase().includes(search.toLowerCase()))
  );

  // Candidates for walk-in add: active volunteers not already on the roster
  const walkInCandidates = useMemo(() => {
    if (!walkInQuery.trim()) return [];
    const q = walkInQuery.toLowerCase();
    const onRoster = new Set(roster.map((v) => v.id));
    return allVolunteers
      .filter((v) => !onRoster.has(v.id))
      .filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.department.toLowerCase().includes(q) ||
          (v.rollNumber && v.rollNumber.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [walkInQuery, roster, allVolunteers]);

  function toggle(id: string) {
    setPresent((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setSaved(false);
  }

  function selectAll() {
    setPresent(new Set(roster.map((v) => v.id)));
    setSaved(false);
  }

  function deselectAll() {
    setPresent(new Set());
    setSaved(false);
  }

  function addWalkIn(id: string) {
    setWalkInIds((prev) => new Set(prev).add(id));
    setPresent((prev) => new Set(prev).add(id)); // a walk-in showed up, so mark present by default
    setWalkInQuery("");
    setSaved(false);
  }

  function removeWalkIn(id: string) {
    setWalkInIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setPresent((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveAttendance(eventId, Array.from(present), hoursValue, Array.from(walkInIds));
      setSaved(true);
    });
  }

  const presentCount = present.size;
  const absentCount = roster.length - presentCount;
  const totalHoursAwarded = presentCount * hoursValue;

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search within roster */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search volunteers by name, dept, or roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-brandblue"
          />
        </div>

        {/* Quick Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowWalkInSearch((s) => !s)}
            className="text-xs font-semibold text-white bg-brandblue hover:bg-brandblueDark px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1"
          >
            <UserPlus size={13} />
            Add Walk-in
          </button>
          <button
            type="button"
            onClick={selectAll}
            className="text-xs font-semibold text-brandblue bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1"
          >
            <CheckSquare size={13} />
            Select All
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors inline-flex items-center gap-1"
          >
            <Square size={13} />
            Deselect All
          </button>
        </div>
      </div>

      {/* Walk-in Search & Add Panel */}
      {showWalkInSearch && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-brandblue flex items-center gap-1.5">
              <UserPlus size={13} />
              Search & add a volunteer who wasn't registered
            </span>
            <button
              type="button"
              onClick={() => {
                setShowWalkInSearch(false);
                setWalkInQuery("");
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={15} />
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Type a name, department, or roll number..."
              value={walkInQuery}
              onChange={(e) => setWalkInQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-blue-200 bg-white rounded-xl outline-none focus:border-brandblue"
            />
          </div>

          {walkInQuery.trim() && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
              {walkInCandidates.length === 0 && (
                <div className="px-3 py-2.5 text-xs text-slateink">
                  No matching active volunteers found (or they're already on the roster).
                </div>
              )}
              {walkInCandidates.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => addWalkIn(v.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900">{v.name}</div>
                    <div className="text-[11px] text-slateink truncate">
                      {v.department}
                      {v.rollNumber ? ` · ${v.rollNumber}` : ""}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] font-bold text-brandblue flex items-center gap-1">
                    <PlusCircle size={13} />
                    Add
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Live Count Summary Banner */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Present</div>
          <div className="text-xl font-extrabold font-mono text-emerald-700 mt-0.5">{presentCount}</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider">Absent</div>
          <div className="text-xl font-extrabold font-mono text-red-700 mt-0.5">{absentCount}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-brandblue uppercase tracking-wider">Awarding</div>
          <div className="text-xl font-extrabold font-mono text-brandblue mt-0.5">
            {totalHoursAwarded} <span className="text-xs font-normal">hrs</span>
          </div>
        </div>
      </div>

      {/* Volunteers Checklist */}
      <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-xs">
        {filteredRoster.map((v) => {
          const isPresent = present.has(v.id);
          const isWalkIn = walkInIds.has(v.id);
          return (
            <label
              key={v.id}
              className={`flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-colors ${
                isPresent ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={isPresent}
                onChange={() => toggle(v.id)}
                className="w-4 h-4 rounded text-brandblue accent-brandblue cursor-pointer"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{v.name}</span>
                  <span className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                    Tenure Year {v.tenureYear ?? 1}
                  </span>
                  {isWalkIn && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <UserPlus size={10} />
                      Walk-in
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slateink mt-0.5 flex flex-wrap gap-x-2">
                  {v.department && <span>{v.department}</span>}
                  {v.year && <span>· Acad Year {v.year}</span>}
                  {v.rollNumber && <span>· {v.rollNumber}</span>}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isPresent ? (
                  <span className="text-xs font-bold text-brandgreen bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    +{hoursValue}h
                  </span>
                ) : (
                  <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">
                    Absent (0h)
                  </span>
                )}

                {isWalkIn && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      removeWalkIn(v.id);
                    }}
                    title="Remove walk-in"
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </label>
          );
        })}

        {roster.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-slateink">
            No volunteers have registered for this event yet. Use "Add Walk-in" above if someone shows up.
          </div>
        )}

        {roster.length > 0 && filteredRoster.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-slateink">
            No volunteers on the roster match "{search}".
          </div>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={pending || roster.length === 0}
        className="w-full bg-brandblue hover:bg-brandblueDark text-white rounded-2xl py-3.5 text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {pending ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Saving & Awarding Hours…
          </>
        ) : (
          `Save Verified Attendance (${presentCount} Present · Award ${hoursValue} hrs each)`
        )}
      </button>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-brandgreen shrink-0" />
            <span className="text-xs font-semibold">
              Attendance saved successfully! Verified hours added to volunteer ledgers.
            </span>
          </div>
          <Link
            href="/official/events"
            className="text-xs font-bold text-brandblue bg-white border border-emerald-200 px-3 py-1.5 rounded-xl hover:bg-emerald-100/50 text-center"
          >
            Back to Events
          </Link>
        </div>
      )}
    </div>
  );
}