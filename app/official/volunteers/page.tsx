import { redirect } from "next/navigation";
import { getViewer } from "@/lib/getViewer";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";
import VolunteerActions from "./VolunteerActions";
import AddVolunteerModal from "./AddVolunteerModal";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  Sparkles,
  UserCheck,
  UserX,
  Search,
  Phone,
  Hash,
} from "lucide-react";
import ExportButton from "@/components/ExportButton";

const POSITIONS = [
  "NSS Leader",
  "NSS Co-Leader",
  "Event Management Head",
  "Social Media Head",
  "Documentation Head",
  "Creativity Head",
  "Cultural Head",
];

export default async function VolunteersPage({
  searchParams,
}: {
  searchParams?: { filter?: string; q?: string };
}) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "official") redirect("/dashboard");

  const supabase = createClient();
  const filter = searchParams?.filter ?? "active";
  const searchQuery = searchParams?.q?.toLowerCase() ?? "";

  const [{ data: profiles }, { data: roles }, { data: hours }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, department, year, tenure_year, status, phone, roll_number")
      .order("created_at", { ascending: false }),
    supabase.from("roles").select("user_id, role, position"),
    supabase.from("attendance").select("user_id, hours_awarded").eq("present", true),
  ]);

  const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r]));
  const hoursByUser = new Map<string, number>();
  (hours ?? []).forEach((h) =>
    hoursByUser.set(h.user_id, (hoursByUser.get(h.user_id) ?? 0) + Number(h.hours_awarded))
  );

  const allVolunteers = (profiles ?? []).filter((p) => {
    const r = roleByUser.get(p.id);
    return r?.role !== "official";
  });

  const totalCount = allVolunteers.length;
  const activeCount = allVolunteers.filter((v) => v.status === "active").length;
  const year1Count = allVolunteers.filter((v) => v.status === "active" && (v.tenure_year ?? 1) === 1).length;
  const year2Count = allVolunteers.filter((v) => v.status === "active" && v.tenure_year === 2).length;
  const coreCount = allVolunteers.filter(
    (v) => v.status === "active" && roleByUser.get(v.id)?.role === "core"
  ).length;
  const graduatedCount = allVolunteers.filter((v) => v.status === "graduated").length;
  const removedCount = allVolunteers.filter((v) => v.status === "removed").length;

  const filteredVolunteers = allVolunteers.filter((v) => {
    const role = roleByUser.get(v.id);
    const matchesSearch =
      !searchQuery ||
      v.full_name?.toLowerCase().includes(searchQuery) ||
      v.department?.toLowerCase().includes(searchQuery) ||
      v.roll_number?.toLowerCase().includes(searchQuery);

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "active") return v.status === "active";
    if (filter === "year1") return v.status === "active" && (v.tenure_year ?? 1) === 1;
    if (filter === "year2") return v.status === "active" && v.tenure_year === 2;
    if (filter === "core") return v.status === "active" && role?.role === "core";
    if (filter === "graduated") return v.status === "graduated";
    if (filter === "removed") return v.status === "removed";
    return true;
  });

  return (
    <div className="md:flex min-h-screen bg-paper">
      <Nav viewer={viewer} />
      <main className="min-w-0 flex-1 px-4 pt-16 pb-24 md:px-8 md:py-8 md:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy">
              Volunteers & Tenure Management
            </h1>
            <p className="text-xs sm:text-sm text-navy/50 mt-0.5">
              Manage 2-year volunteer lifecycle, promote Core Team heads, and mark graduations.
            </p>
          </div>
          <div className="flex gap-2">
            <AddVolunteerModal positions={POSITIONS} />
            <ExportButton
              filename="nss-volunteers"
              rows={filteredVolunteers.map((v) => ({
                Name: v.full_name,
                Department: v.department ?? "",
                "Academic Year": v.year ?? "",
                "Tenure Year": v.tenure_year ?? 1,
                Status: v.status,
                Position: roleByUser.get(v.id)?.position ?? "",
                "Hours Logged": hoursByUser.get(v.id) ?? 0,
                Phone: v.phone ?? "",
                "Roll Number": v.roll_number ?? "",
              }))}
            />
          </div>
        </div>

        {/* Stats Grid — one accent color per meaning, everything else quiet */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-6">
          <div className="bg-white border border-steel rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-navy/45 uppercase tracking-wide">Active Volunteers</div>
            <div className="text-2xl font-extrabold font-mono text-green mt-1">{activeCount}</div>
            <div className="text-[10px] text-navy/40 mt-0.5">Total registered: {totalCount}</div>
          </div>
          <div className="bg-white border border-steel rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-navy/45 uppercase tracking-wide">Year 1 & 2 Active</div>
            <div className="text-2xl font-extrabold font-mono text-navy mt-1">
              {year1Count} <span className="text-xs font-normal text-navy/40">Y1</span> · {year2Count}{" "}
              <span className="text-xs font-normal text-navy/40">Y2</span>
            </div>
            <div className="text-[10px] text-navy/40 mt-0.5">2-Year tenure cycle</div>
          </div>
          <div className="bg-white border border-steel rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-navy/45 uppercase tracking-wide">Core Team (Heads)</div>
            <div className="text-2xl font-extrabold font-mono text-saffron mt-1">{coreCount}</div>
            <div className="text-[10px] text-navy/40 mt-0.5">Assigned leadership</div>
          </div>
          <div className="bg-white border border-steel rounded-2xl p-3.5">
            <div className="text-[11px] font-semibold text-navy/45 uppercase tracking-wide">Graduated NSS</div>
            <div className="text-2xl font-extrabold font-mono text-indigo-600 mt-1">{graduatedCount}</div>
            <div className="text-[10px] text-navy/40 mt-0.5">Tenure completed</div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white border border-steel rounded-2xl p-3 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { key: "active", label: "Active" },
              { key: "year1", label: "Year 1" },
              { key: "year2", label: "Year 2" },
              { key: "core", label: "Core Heads" },
              { key: "graduated", label: "Graduated" },
              { key: "removed", label: "Removed" },
              { key: "all", label: "All" },
            ].map((t) => {
              const active = filter === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/official/volunteers?filter=${t.key}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? "bg-saffron text-white"
                      : "text-navy/60 hover:bg-steel/60"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Volunteers List */}
        <div className="space-y-3">
          {filteredVolunteers.map((p) => {
            const role = roleByUser.get(p.id);
            const totalHours = hoursByUser.get(p.id) ?? 0;
            const isCore = role?.role === "core";

            return (
              <div
                key={p.id}
                className="bg-white border border-steel rounded-2xl p-4 sm:p-5 hover:border-navy/20 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-bold text-sm sm:text-base text-navy">
                      {p.full_name}
                    </span>

                    {isCore && role?.position && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-saffron/15 text-navy border border-saffron/40 px-2.5 py-0.5 rounded-lg">
                        <Sparkles size={11} className="text-saffron fill-saffron" />
                        {role.position}
                      </span>
                    )}

                    {p.status === "graduated" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-lg">
                        <GraduationCap size={11} />
                        Graduated
                      </span>
                    )}

                    {p.status === "removed" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-wheelred/10 text-wheelred px-2 py-0.5 rounded-lg">
                        Removed
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-navy/50 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{p.department ?? "Dept not specified"}</span>
                    {p.year && <span>Acad Year {p.year}</span>}
                    <span className="font-semibold text-navy/70">
                      NSS Tenure: Year {p.tenure_year ?? 1}
                    </span>
                    {p.roll_number && (
                      <span className="flex items-center gap-0.5">
                        <Hash size={11} />
                        {p.roll_number}
                      </span>
                    )}
                    {p.phone && (
                      <span className="flex items-center gap-0.5">
                        <Phone size={11} />
                        {p.phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-steel">
                  <div className="flex items-center gap-1.5 bg-paper border border-steel px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] uppercase font-bold text-navy/40">Hours:</span>
                    <span className="font-mono font-bold text-sm text-navy">
                      {totalHours}h
                    </span>
                  </div>

                  <VolunteerActions
                    userId={p.id}
                    fullName={p.full_name}
                    department={p.department}
                    phone={p.phone}
                    rollNumber={p.roll_number}
                    year={p.year}
                    currentPosition={role?.position ?? null}
                    tenureYear={p.tenure_year ?? 1}
                    status={p.status ?? "active"}
                    positions={POSITIONS}
                  />
                </div>
              </div>
            );
          })}

          {filteredVolunteers.length === 0 && (
            <div className="bg-white border border-dashed border-steel rounded-2xl p-8 text-center text-xs sm:text-sm text-navy/50">
              No volunteers found under filter <strong>"{filter}"</strong>.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}