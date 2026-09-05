// This app is used from a single Pacific-time practice, so dates are
// anchored to a fixed UTC-8 offset rather than the viewer's own browser
// timezone (which would otherwise shift a date depending on where someone
// happens to be sitting when they load the page).
const PACIFIC_OFFSET_HOURS = 8;

// "Today" in Pacific time, as YYYY-MM-DD - used to default date inputs
// (e.g. logging an interaction) instead of new Date().toISOString(), which
// is UTC and rolls over to the next day hours before Pacific midnight does.
export function todayInPacific(): string {
  const shifted = new Date(Date.now() - PACIFIC_OFFSET_HOURS * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

// Formats a stored calendar date (a plain "YYYY-MM-DD" from a Postgres
// DATE column, no time-of-day) for display. Parses the components directly
// instead of `new Date(dateString).toLocaleDateString()`, which treats the
// string as UTC midnight and then re-renders it in the browser's local
// timezone - in a negative UTC offset like Pacific, that silently rolls
// the displayed date back by one day.
export function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString();
}
