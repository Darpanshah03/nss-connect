"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Viewer } from "@/lib/getViewer";
import ThemeToggle from "./ThemeToggle";
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

function ChakraMark({ className }: { className?: string }) {
  const spokes = Array.from({ length: 16 }, (_, i) => (i * 360) / 16);
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="19" className="fill-ink" />
      {spokes.map((angle) => (
        <line
          key={angle}
          x1="20"
          y1="20"
          x2={20 + 14 * Math.cos((angle * Math.PI) / 180)}
          y2={20 + 14 * Math.sin((angle * Math.PI) / 180)}
          className="stroke-saffron"
          strokeWidth="1"
          opacity={0.9}
        />
      ))}
      <circle cx="20" cy="20" r="3.5" className="fill-saffron" />
    </svg>
  );
}

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
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-ink text-surface px-2.5 py-0.5 rounded-full">
          <ShieldAlert size={12} className="shrink-0" />
          Official Admin
        </span>
      );
    }
    if (isCore && viewer.position) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-saffron/15 text-ink border border-saffron/40 px-2.5 py-0.5 rounded-full">
          <Sparkles size={12} className="shrink-0 text-saffron fill-saffron" />
          {viewer.position}
        </span>
      );
    }
    if (viewer.status === "graduated") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 px-2 py-0.5 rounded-full">
          <GraduationCap size={12} className="shrink-0" />
          Graduated
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-steel/60 text-ink/70 border border-steel px-2 py-0.5 rounded-full">
        Year {viewer.tenureYear || 1} Volunteer
      </span>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-b border-steel px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <ChakraMark className="w-8 h-8 shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-xs text-ink truncate leading-tight">
              {viewer.fullName}
            </div>
            <div className="mt-0.5">{renderBadge()}</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              title="Sign out"
              className="p-2 text-ink/40 hover:text-wheelred rounded-lg hover:bg-wheelred/5 transition-colors"
            >
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-surface border-r border-steel min-h-screen p-4 sticky top-0 h-screen overflow-y-auto">
        <div className="chakra-motif flex items-center justify-between px-2 py-3 mb-3">
          <div className="relative z-10 flex items-center gap-3">
            <ChakraMark className="w-9 h-9" />
            <div>
              <div className="font-bold text-sm tracking-tight text-ink">NSS Connect</div>
              <div className="text-[11px] text-ink/45">Unit Portal</div>
            </div>
          </div>
          <ThemeToggle className="relative z-10" />
        </div>

        {/* User profile card */}
        <div className="bg-surface2 border border-steel rounded-xl p-3 mb-4">
          <div className="text-xs font-semibold text-ink truncate">{viewer.fullName}</div>
          <div className="text-[11px] text-ink/45 truncate mb-2">
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
                    ? "bg-saffron text-white font-semibold"
                    : "text-ink/70 hover:bg-steel/50 hover:text-ink"
                }`}
              >
                <Icon size={16} className={active ? "text-white" : "text-ink/40"} />
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Role contextual note */}
        <div className="pt-3 mt-auto border-t border-steel">
          {isOfficial ? (
            <p className="text-[11px] text-ink/45 px-2 leading-relaxed">
              Official account with unit-wide administrative & event controls.
            </p>
          ) : isCore ? (
            <p className="text-[11px] text-ink bg-saffron/10 border border-saffron/30 rounded-lg p-2 leading-relaxed">
              Core Team Head — elevated view access for event attendees and attendance logs.
            </p>
          ) : (
            <p className="text-[11px] text-ink/45 px-2 leading-relaxed">
              Volunteer tenure: 2 years. Active participation counts toward verified certificates.
            </p>
          )}

          <form action="/auth/signout" method="POST" className="mt-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-ink/45 hover:text-wheelred hover:bg-wheelred/5 rounded-lg transition-colors"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-steel flex"
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
                active ? "text-saffron font-semibold" : "text-ink/45 hover:text-ink"
              }`}
            >
              <div className={`p-1 rounded-lg ${active ? "bg-saffron/10 text-saffron" : "text-ink/35"}`}>
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