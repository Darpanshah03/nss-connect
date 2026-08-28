"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Viewer } from "@/lib/getViewer";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Trophy,
  UserCheck,
  LogOut,
  ShieldAlert,
  Sparkles,
  GraduationCap,
  Tent,
} from "lucide-react";

export default function Nav({ viewer }: { viewer: NonNullable<Viewer> }) {
  const pathname = usePathname();
  const isOfficial = viewer.role === "official";
  const isCore = viewer.role === "core";

  const links = isOfficial
    ? [
        { href: "/official/events", label: "Events & Attendance", icon: CalendarDays },
        { href: "/official/volunteers", label: "Volunteers & Tenure", icon: Users },
        { href: "/official/camps", label: "Special Camps", icon: Tent },
        { href: "/achievements", label: "Achievements", icon: Trophy },
        { href: "/team", label: "Team Directory", icon: Sparkles },
      ]
    : [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/events", label: "Events", icon: CalendarDays },
        { href: "/achievements", label: "Achievements", icon: Trophy },
        { href: "/team", label: "NSS Team", icon: Sparkles },
        { href: "/profile", label: "Profile", icon: UserCheck },
      ];

  const renderBadge = () => {
    if (isOfficial) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full shadow-xs">
          <ShieldAlert size={12} className="shrink-0 text-red-600" />
          Official Admin
        </span>
      );
    }
    if (isCore && viewer.position) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-xs ring-1 ring-amber-400/30 animate-pulse-slow">
          <Sparkles size={12} className="shrink-0 text-amber-600 fill-amber-500" />
          {viewer.position}
        </span>
      );
    }
    if (viewer.status === "graduated") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-100 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full">
          <GraduationCap size={12} className="shrink-0" />
          Graduated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full">
        Year {viewer.tenureYear || 1} Volunteer
      </span>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-brandred to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            N
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-xs text-ink truncate leading-tight">
              {viewer.fullName}
            </div>
            <div className="mt-0.5">{renderBadge()}</div>
          </div>
        </div>

        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            title="Sign out"
            className="p-2 text-slateink hover:text-red-600 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <LogOut size={16} />
          </button>
        </form>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-slate-200 min-h-screen p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-3 px-2 py-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brandred to-orange-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            N
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-ink">NSS Connect</div>
            <div className="text-[11px] text-slateink">Unit Portal</div>
          </div>
        </div>

        {/* User profile card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4">
          <div className="text-xs font-semibold text-ink truncate">{viewer.fullName}</div>
          <div className="text-[11px] text-slateink truncate mb-2">
            {viewer.department ? `${viewer.department}` : viewer.email}
          </div>
          <div>{renderBadge()}</div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1 flex-1">
          {links.map((l) => {
            const Icon = l.icon;
            const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? "bg-brandblue text-white shadow-xs font-semibold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-ink"
                }`}
              >
                <Icon size={16} className={active ? "text-white" : "text-slateink"} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Role contextual note */}
        <div className="pt-3 mt-auto border-t border-slate-100">
          {isOfficial ? (
            <p className="text-[11px] text-slateink px-2 leading-relaxed">
              🛡️ Official account with unit-wide administrative & event controls.
            </p>
          ) : isCore ? (
            <p className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/60 rounded-lg p-2 leading-relaxed">
              ⭐ Core Team Head: You have elevated view access for event attendees and attendance logs.
            </p>
          ) : (
            <p className="text-[11px] text-slateink px-2 leading-relaxed">
              Volunteer tenure: 2 years. Active participation counts toward verified certificates.
            </p>
          )}

          <form action="/auth/signout" method="POST" className="mt-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-slateink hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 flex shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {links.map((l) => {
          const Icon = l.icon;
          const active = pathname === l.href || (l.href !== "/" && pathname?.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors ${
                active ? "text-brandblue font-semibold" : "text-slateink hover:text-ink"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  active ? "bg-blue-50 text-brandblue" : "text-slate-500"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className="truncate max-w-[64px] text-center">{l.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

