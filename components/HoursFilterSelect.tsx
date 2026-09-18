"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function HoursFilterSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("hours", e.target.value);
    } else {
      params.delete("hours");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      defaultValue={searchParams.get("hours") ?? ""}
      onChange={handleChange}
      className="text-xs font-semibold border border-steel rounded-xl px-3 py-2 bg-white text-navy/70 outline-none focus:border-saffron cursor-pointer"
    >
      <option value="">All Hours</option>
      <option value="120">Completed 120 hrs</option>
      <option value="240">Completed 240 hrs</option>
    </select>
  );
}