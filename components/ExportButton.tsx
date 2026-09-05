"use client";

import { Download } from "lucide-react";
import { exportToCsv } from "@/lib/exportToCsv";

export default function ExportButton({
  filename,
  rows,
  label = "Export to Excel",
}: {
  filename: string;
  rows: Record<string, any>[];
  label?: string;
}) {
  return (
    <button
      onClick={() => exportToCsv(filename, rows)}
      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-700 hover:bg-slate-50"
    >
      <Download size={14} />
      {label}
    </button>
  );
}