"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function CoreMemberCard({
  member,
  position,
  hours,
}: {
  member: {
    id: string;
    full_name: string;
    department: string | null;
    year: number | null;
    tenure_year: number;
    photo_url: string | null;
    photo_url_original: string | null;
  };
  position: string | null;
  hours: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left w-full bg-white border-2 border-amber-200/80 rounded-3xl p-5 shadow-xs hover:border-amber-400 transition-all relative overflow-hidden group"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

        <div className="flex items-start justify-between gap-3 mb-2.5">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={member.full_name}
              className="w-10 h-14 rounded-2xl object-cover border border-amber-200 shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-900 flex items-center justify-center font-bold text-sm border border-amber-200 shadow-2xs">
              {member.full_name?.charAt(0) || "H"}
            </div>
          )}

          {position && (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl shadow-xs ring-1 ring-amber-400/30">
              <Sparkles size={12} className="text-amber-600 fill-amber-500" />
              {position}
            </span>
          )}
        </div>

        <h3 className="font-bold text-base text-slate-900">{member.full_name}</h3>

        <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-x-2">
          <span>{member.department ?? "NSS Unit"}</span>
          {member.year && <span>· Acad Year {member.year}</span>}
        </div>

        <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            Tenure: Year {member.tenure_year} Head
          </span>
          <span className="font-mono font-bold text-xs text-brandblue bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            {hours} Verified Hrs
          </span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {(member.photo_url_original || member.photo_url) && (
              <img
                src={member.photo_url_original || member.photo_url || ""}
                alt={member.full_name}
                className="w-full max-h-[55vh] object-contain bg-slate-50"
              />
            )}
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-900 mb-1">{member.full_name}</h3>
              {position && (
                <span className="inline-flex items-center gap-1 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 rounded-xl mb-2">
                  <Sparkles size={12} className="text-amber-600 fill-amber-500" />
                  {position}
                </span>
              )}
              <div className="text-sm text-slate-600 mt-2 space-y-1">
                <div>
                  {member.department ?? "NSS Unit"}
                  {member.year ? ` · Academic Year ${member.year}` : ""}
                </div>
                <div>NSS Tenure: Year {member.tenure_year}</div>
                <div className="font-bold text-brandblue">{hours} Verified Hours</div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full mt-4 border border-slate-200 rounded-xl py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}