"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Tent,
  Award,
  Menu,
  X,
  LogOut,
  ChevronRight,
  UserRound,
} from "lucide-react";
import type { Viewer } from "@/lib/getViewer";

const volunteerItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Events", href: "/events", icon: CalendarDays },
  { name: "Camps", href: "/official/camps", icon: Tent },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "NSS Team", href: "/team", icon: UserRound },
  { name: "Profile", href: "/profile", icon: UserRound },
];

const officialItems = [
  { name: "Events", href: "/official/events", icon: CalendarDays },
  { name: "Volunteers", href: "/official/volunteers", icon: Users },
  { name: "Camps", href: "/official/camps", icon: Tent },
  { name: "Achievements", href: "/achievements", icon: Award },
  { name: "NSS Team", href: "/team", icon: UserRound },
];

export default function Nav({ viewer }: { viewer: NonNullable<Viewer> }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = viewer.role === "official" ? officialItems : volunteerItems;
  const sectionLabel = viewer.role === "official" ? "Official" : "Volunteer";

  function NavLink({
    href,
    icon: Icon,
    name,
  }: {
    href: string;
    icon: React.ElementType;
    name: string;
  }) {
    const active = pathname === href || pathname.startsWith(`${href}/`);

    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? "bg-saffron/10 text-saffron shadow-sm ring-1 ring-saffron/20"
            : "text-navy/60 hover:bg-steel/60 hover:text-navy"
        }`}
      >
        <Icon
          className={`h-5 w-5 ${
            active ? "text-saffron" : "text-navy/50 group-hover:text-navy"
          }`}
        />
        <span>{name}</span>
        {active && <ChevronRight className="ml-auto h-4 w-4 text-saffron/60" />}
      </Link>
    );
  }

  function NavContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 px-4 py-6">
          <div className="gradient-tricolour flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md">
            <span className="font-display text-lg font-bold">N</span>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold leading-tight text-navy">NSS</h1>
            <p className="text-xs text-navy/50">VPPCOE&amp;VA</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-navy/40">
            {sectionLabel}
          </p>
          <div className="space-y-1">
            {items.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div className="border-t border-steel p-3">
          <div className="card flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 via-green-500 to-blue-500 text-sm font-bold text-white">
              {viewer.fullName ? viewer.fullName.slice(0, 1).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{viewer.fullName}</p>
              <p className="truncate text-xs text-navy/50">{viewer.email}</p>
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                aria-label="Sign out"
                className="rounded-lg p-2 text-navy/50 transition-colors hover:bg-steel/60 hover:text-wheelred"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-steel bg-paper/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="gradient-tricolour flex h-9 w-9 items-center justify-center rounded-lg text-white">
            <span className="font-display font-bold">N</span>
          </div>
          <span className="font-display font-bold text-navy">NSS</span>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-navy/60 hover:bg-steel/60"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-navy/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[280px] border-l border-steel bg-white shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-steel px-4">
              <span className="font-display font-bold text-navy">Menu</span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-navy/60 hover:bg-steel/60"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100%-64px)]">
              <NavContent />
            </div>
          </div>
        </div>
      )}

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-steel bg-white md:block">
        <NavContent />
      </aside>

      <div className="hidden w-72 shrink-0 md:block" aria-hidden="true" />
    </>
  );
}
