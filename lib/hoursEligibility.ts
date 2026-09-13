// lib/hoursEligibility.ts

import { EVENT_CATEGORIES, CATEGORY_MIN_HOURS } from "./eventCategories";

export type CategoryBreakdown = {
  category: string;
  required: number;
  earned: number;
  met: boolean;
};

export type EligibilityResult = {
  eligible: boolean;
  breakdown: CategoryBreakdown[];
  campRequired: boolean;
  campAttended: boolean;
};

export async function checkYearEligibility(
  supabase: any,
  userId: string,
  nssYear: 1 | 2,
  requireCamp: boolean
): Promise<EligibilityResult> {
  const earnedByCategory: Record<string, number> = {};

  EVENT_CATEGORIES.forEach((cat) => {
    earnedByCategory[cat] = 0;
  });

  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("hours_awarded, events(category)")
    .eq("user_id", userId)
    .eq("nss_year", nssYear)
    .eq("present", true);

  (attendanceRows ?? []).forEach((row: any) => {
    const cat = row.events?.category;

    if (cat && cat in earnedByCategory) {
      earnedByCategory[cat] += Number(row.hours_awarded);
    }
  });

  const { data: adjustmentRows } = await supabase
    .from("hour_adjustments")
    .select("category, hours")
    .eq("user_id", userId)
    .eq("nss_year", nssYear);

  (adjustmentRows ?? []).forEach((row: any) => {
    if (row.category in earnedByCategory) {
      earnedByCategory[row.category] += Number(row.hours);
    }
  });

  const breakdown: CategoryBreakdown[] = EVENT_CATEGORIES.map((cat) => {
    const required = CATEGORY_MIN_HOURS[cat] ?? 0;
    const earned = Math.round(earnedByCategory[cat] * 100) / 100;

    return {
      category: cat,
      required,
      earned,
      met: earned >= required,
    };
  });

  const hoursEligible = breakdown.every((b) => b.met);

  let campAttended = true;

  if (requireCamp) {
    const { count } = await supabase
      .from("camp_attendance")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);

    campAttended = (count ?? 0) > 0;
  }

  return {
    eligible: hoursEligible && (!requireCamp || campAttended),
    breakdown,
    campRequired: requireCamp,
    campAttended,
  };
}

// The "total hours" figure shown on /dashboard and /profile should never
// let excess hours in one category compensate for a shortfall elsewhere.
// Each category's contribution is capped at its own required maximum.
// Year 1 always applies; Year 2 is added only for volunteers who have
// been promoted, since requirements reset each year.

export async function getCappedTotalHours(
  supabase: any,
  userId: string,
  tenureYear: 1 | 2
): Promise<number> {
  const year1 = await checkYearEligibility(
    supabase,
    userId,
    1,
    false
  );

  let total = year1.breakdown.reduce(
    (sum, b) => sum + Math.min(b.earned, b.required),
    0
  );

  if (tenureYear === 2) {
    const year2 = await checkYearEligibility(
      supabase,
      userId,
      2,
      false
    );

    total += year2.breakdown.reduce(
      (sum, b) => sum + Math.min(b.earned, b.required),
      0
    );
  }

  return Math.round(total * 100) / 100;
}