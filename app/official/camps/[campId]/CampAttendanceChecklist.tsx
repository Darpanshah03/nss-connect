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

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, dept, or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-brandblue"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setAttended(new Set(volunteers.map((v) => v.id))); setSaved(false); }} className="text-xs font-semibold text-brandblue bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl inline-flex items-center gap-1">
            <CheckSquare size={13} /> Select All
          </button>
          <button onClick={() => { setAttended(new Set()); setSaved(false); }} className="text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl inline-flex items-center gap-1">
            <Square size={13} /> Deselect All
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2.5 text-center">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Attended Camp</div>
          <div className="text-xl font-extrabold font-mono text-emerald-700 mt-0.5">{attended.size}</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Did Not Attend</div>
          <div className="text-xl font-extrabold font-mono text-slate-700 mt-0.5">{volunteers.length - attended.size}</div>
        </div>
      </div>

      {/* Volunteer List */}
      <div className="bg-white border border-slate-200 rounded-3xl divide-y divide-slate-100 overflow-hidden shadow-xs">
        {filtered.map((v) => {
          const isPresent = attended.has(v.id);
          return (
            <label key={v.id} className={`flex items-center gap-3.5 px-5 py-3.5 cursor-pointer transition-colors ${isPresent ? "bg-emerald-50/30 hover:bg-emerald-50/50" : "hover:bg-slate-50"}`}>
              <input type="checkbox" checked={isPresent} onChange={() => toggle(v.id)} className="w-4 h-4 rounded accent-brandblue cursor-pointer" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900">{v.name}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Year {v.tenureYear ?? 1}</span>
                </div>
                <div className="text-[11px] text-slateink mt-0.5 flex flex-wrap gap-x-2">
                  {v.department && <span>{v.department}</span>}
                  {v.year && <span>· Acad Yr {v.year}</span>}
                  {v.rollNumber && <span>· {v.rollNumber}</span>}
                </div>
              </div>
              <div className="shrink-0">
                {isPresent ? (
                  <span className="text-xs font-bold text-brandgreen bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                    <Tent size={12} /> Attended
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">Not Marked</span>
                )}
              </div>
            </label>
          );
        })}

        {volunteers.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-slateink">No active volunteers found in the roster.</div>
        )}

        {volunteers.length > 0 && filtered.length === 0 && (
          <div className="p-8 text-center text-xs sm:text-sm text-slateink">No volunteers match "{search}".</div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={pending || volunteers.length === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl py-3.5 text-xs sm:text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.99]"
      >
        {pending ? (
          <><Loader2 size={16} className="animate-spin" />Saving Camp Attendance...</>
        ) : (
          `Save — ${attended.size} Volunteer${attended.size !== 1 ? "s" : ""} Marked as Attended`
        )}
      </button>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={18} className="text-brandgreen shrink-0" />
          <span className="text-xs font-semibold">Camp attendance saved! Volunteer profiles updated.</span>
        </div>
      )}
    </div>
  );
}