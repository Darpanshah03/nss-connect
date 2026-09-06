"use client";

import { useState, useTransition } from "react";
import { deleteAchievement } from "./actions";
import { Trophy, Award, Star, Medal, Heart, Trash2, CalendarDays } from "lucide-react";

function getIcon(iconName: string) {
  switch (iconName) {
    case "star":
      return <Star size={20} className="text-amber-500 fill-amber-500" />;
    case "medal":
      return <Medal size={20} className="text-blue-500" />;
    case "heart":
      return <Heart size={20} className="text-rose-500 fill-rose-500" />;
    case "award":
      return <Award size={20} className="text-purple-500" />;
    case "trophy":
    default:
      return <Trophy size={20} className="text-amber-600 fill-amber-500" />;
  }
}

export default function AchievementCard({ item, isOfficial }: { item: any; isOfficial: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const isUnit = item.category === "unit";
  const profile = item.profiles;

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    startTransition(async () => {
      await deleteAchievement(item.id);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-left w-full bg-white border border-slate-200/90 rounded-3xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between relative overflow-hidden"
      >
        <div
          className={`absolute top-0 inset-x-0 h-1.5 ${
            isUnit
              ? "bg-gradient-to-r from-amber-400 to-orange-500"
              : "bg-gradient-to-r from-blue-500 to-indigo-600"
          }`}
        />

        <div>
          {item.photo_url && (
            <img
              src={item.photo_url}
              alt={item.title}
              className="w-full h-36 object-cover rounded-2xl mb-3 border border-slate-100"
            />
          )}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 shadow-2xs">
              {getIcon(item.badge_icon || "trophy")}
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${
                  isUnit
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-blue-50 text-brandblue border-blue-200"
                }`}
              >
                {isUnit ? "Unit Milestone" : "Volunteer Spotlight"}
              </span>

              {isOfficial && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={pending}
                  title="Delete achievement"
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug mb-1.5">
            {item.title}
          </h3>

          {item.description && (
            <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-3">
              {item.description}
            </p>
          )}

          {profile && (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-brandblue flex items-center justify-center text-[10px] font-bold shrink-0">
                {profile.full_name?.charAt(0) || "V"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">{profile.full_name}</div>
                <div className="text-[10px] text-slateink truncate">
                  {profile.department ? `${profile.department} ` : ""}
                  {profile.year ? `· Acad Year ${profile.year}` : ""}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slateink">
          <span className="flex items-center gap-1">
            <CalendarDays size={12} />
            {new Date(item.achieved_on).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="font-semibold text-emerald-700">Official NSS Honor</span>
        </div>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {item.photo_url && (
              <img
                src={item.photo_url}
                alt={item.title}
                className="w-full max-h-[50vh] object-contain bg-slate-50"
              />
            )}
            <div className="p-5">
              <span
                className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border mb-2 ${
                  isUnit
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-blue-50 text-brandblue border-blue-200"
                }`}
              >
                {isUnit ? "Unit Milestone" : "Volunteer Spotlight"}
              </span>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-slate-600 leading-relaxed mb-3">{item.description}</p>
              )}
              {profile && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-brandblue flex items-center justify-center text-xs font-bold shrink-0">
                    {profile.full_name?.charAt(0) || "V"}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{profile.full_name}</div>
                    <div className="text-xs text-slateink">
                      {profile.department ? `${profile.department} ` : ""}
                      {profile.year ? `· Acad Year ${profile.year}` : ""}
                    </div>
                  </div>
                </div>
              )}
              <div className="text-xs text-slateink flex items-center gap-1">
                <CalendarDays size={12} />
                {new Date(item.achieved_on).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
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