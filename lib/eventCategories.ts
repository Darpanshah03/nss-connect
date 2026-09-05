// lib/eventCategories.ts
export const EVENT_CATEGORIES = [
  "Area Based-1 (AB1)",
  "Area Based-2 (AB2)",
  "College Level",
  "University Level",
];

// Minimum hours required per category, per NSS year (Year 1 or Year 2).
// Keyed by the same strings as EVENT_CATEGORIES so they can never drift apart.
export const CATEGORY_MIN_HOURS: Record<string, number> = {
  "Area Based-1 (AB1)": 40,
  "Area Based-2 (AB2)": 40,
  "College Level": 20,
  "University Level": 20,
};