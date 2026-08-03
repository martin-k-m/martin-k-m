// The timezone every chart counts its days in, and the date formatting that
// follows from it.
//
// All three generators used to format dates in UTC. That is defensible for a
// page the whole world reads, and it is wrong for this one: these charts are
// about one person's days, and the boundary that matters is the one where they
// stop working and go to bed. At UTC+3 the profile spends the first three hours
// of every local day stamped with yesterday's date and comparing against the
// day before that — the charts looked a day stale every single night, while
// being completely up to date.
//
// It also lines the labels up with the data underneath them. The contribution
// calendar the API returns is already bucketed by day in the account's own
// timezone, so labelling those buckets in UTC was putting one day's counts
// under another day's name for part of the day.
//
// Override with PROFILE_TZ to move it. An invalid zone is caught here rather
// than surfacing as a RangeError from deep inside a formatter three scripts
// later, and falls back to UTC with a warning instead of failing the build.
const REQUESTED = process.env.PROFILE_TZ || "Europe/Helsinki";

function usable(tz) {
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const TZ = usable(REQUESTED) ? REQUESTED : "UTC";
if (TZ !== REQUESTED) {
  console.warn(`  PROFILE_TZ="${REQUESTED}" is not a timezone this runtime knows; using UTC`);
}

/**
 * The calendar day a moment falls on, as YYYY-MM-DD.
 *
 * en-CA is the shortcut: it is the one common locale whose short date format is
 * already ISO order, so this needs no part-juggling and no risk of a locale
 * putting the month first.
 */
export const dayKey = (d = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);

/** "Aug 4, 2026" — the "updated" stamp along the bottom of every chart. */
export const stamp = (d = new Date()) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);

/** "Aug 4" — an axis end, where the year is already obvious from the other end. */
export const dayLabel = (t) =>
  new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short", day: "numeric" }).format(
    new Date(t)
  );

/**
 * "Aug '26" — an axis start.
 *
 * The apostrophe is load-bearing: "Aug 26" reads as the twenty-sixth of August,
 * which is exactly how it was misread when the axis said that.
 */
export const monthYr = (t) => {
  const d = new Date(t);
  const mon = new Intl.DateTimeFormat("en-US", { timeZone: TZ, month: "short" }).format(d);
  const yr = new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric" }).format(d);
  return `${mon} '${yr.slice(-2)}`;
};
