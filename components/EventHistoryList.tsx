"use client";

import { useState } from "react";
import { EVENT_CATEGORIES } from "@/lib/eventCategories";
import type { EventHistoryEntry } from "@/lib/attendanceHistory";
import { CheckCircle2, XCircle, Clock, CalendarX } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  attended: "Attended",
  missed: "Missed",
  pending: "Pending",
  not_registered: "Not Registered",
};

const STATUS_STYLE: Record<string, string> = {
  attended: "bg-emerald-50 text-emerald-700 border-emerald-200",
  missed: "bg-red-50 text-red-600 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  not_registered: "bg-slate-100 text-slate-500 border-slate-200",
};

const STATUS_ICON: Record<string, any> = {
  attended: CheckCircle2,
  missed: XCircle,
  pending: Clock,
  not_registered: CalendarX,
};

export default function EventHistoryList({ entries }: { entries: EventHistoryEntry[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const counts = {
    attended: entries.filter((e) => e.status === "attended").length,
    missed: entries.filter((e) => e.status === "missed").length,
    pending: entries.filter((e) => e.status === "pending").length,
    not_registered: entries.filter((e) => e.status === "not_registered").length,
  };

  const filtered = entries.filter((e) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Summary counts — click to filter by that status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {(["attended", "missed", "pending", "not_registered"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(statusFilter === key ? "all" : key)}
            className={`rounded-xl border p-2.5 text-left transition-colors ${
              statusFilter === key ? STATUS_STYLE[key] : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
          >
            <div className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {STATUS_LABEL[key]}
            </div>
            <div className="text-lg font-extrabold font-mono text-slate-900">{counts[key]}</div>
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-600 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {EVENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {statusFilter !== "all" && (
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Clear status filter
          </button>
        )}
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
          {filtered.map((e) => {
            const Icon = STATUS_ICON[e.status];
            return (
              <div key={e.eventId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{e.title}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap gap-x-2">
                    <span>
                      {new Date(e.eventDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {e.category && <span>· {e.category}</span>}
                  </div>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg border ${STATUS_STYLE[e.status]}`}
                >
                  <Icon size={12} />
                  {STATUS_LABEL[e.status]}
                  {e.status === "attended" ? ` · +${e.hoursAwarded}h` : ""}
                </span>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-500">No events match this filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}