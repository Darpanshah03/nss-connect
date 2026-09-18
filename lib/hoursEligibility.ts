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
  EVENT_CATEGORIES.forEach((cat) => (earnedByCategory[cat] = 0));

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
    return { category: cat, required, earned, met: earned >= required };
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

// Capped total for ONE volunteer — used on /dashboard and /profile.
export async function getCappedTotalHours(
  supabase: any,
  userId: string,
  tenureYear: 1 | 2
): Promise<number> {
  const year1 = await checkYearEligibility(supabase, userId, 1, false);
  let total = year1.breakdown.reduce(
    (sum, b) => sum + Math.min(b.earned, b.required),
    0
  );

  if (tenureYear === 2) {
    const year2 = await checkYearEligibility(supabase, userId, 2, false);
    total += year2.breakdown.reduce(
      (sum, b) => sum + Math.min(b.earned, b.required),
      0
    );
  }

  return Math.round(total * 100) / 100;
}

// Capped total for EVERY volunteer at once, in exactly 2 queries regardless
// of how many volunteers there are — used on /official/volunteers, where
// calling getCappedTotalHours() in a loop per volunteer would mean 100+
// separate round trips to Supabase. Since capped-total hitting exactly 120
// (or 240 for Year 2) can only happen when every category minimum is met,
// this doubles as "has this volunteer met promotion/graduation hour
// requirements" without needing to run the full eligibility check per user.
export async function getCappedHoursMapForAllUsers(
  supabase: any,
  tenureYearByUser: Map<string, number>
): Promise<Map<string, number>> {
  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("user_id, nss_year, hours_awarded, events(category)")
    .eq("present", true);

  const { data: adjustmentRows } = await supabase
    .from("hour_adjustments")
    .select("user_id, nss_year, category, hours");

  // earned[user_id][nss_year][category] = hours
  const earned: Record<string, Record<number, Record<string, number>>> = {};

  function addHours(userId: string, nssYear: number, category: string | undefined, hours: number) {
    if (!category || !(category in CATEGORY_MIN_HOURS)) return;
    if (!earned[userId]) earned[userId] = {};
    if (!earned[userId][nssYear]) earned[userId][nssYear] = {};
    earned[userId][nssYear][category] = (earned[userId][nssYear][category] ?? 0) + hours;
  }

  (attendanceRows ?? []).forEach((row: any) => {
    addHours(row.user_id, row.nss_year, row.events?.category, Number(row.hours_awarded));
  });

  (adjustmentRows ?? []).forEach((row: any) => {
    addHours(row.user_id, row.nss_year, row.category, Number(row.hours));
  });

  const result = new Map<string, number>();

  tenureYearByUser.forEach((tenureYear, userId) => {
    let total = 0;
    for (const cat of EVENT_CATEGORIES) {
      const required = CATEGORY_MIN_HOURS[cat] ?? 0;
      const y1 = earned[userId]?.[1]?.[cat] ?? 0;
      total += Math.min(y1, required);
    }
    if (tenureYear === 2) {
      for (const cat of EVENT_CATEGORIES) {
        const required = CATEGORY_MIN_HOURS[cat] ?? 0;
        const y2 = earned[userId]?.[2]?.[cat] ?? 0;
        total += Math.min(y2, required);
      }
    }
    result.set(userId, Math.round(total * 100) / 100);
  });

  return result;
}