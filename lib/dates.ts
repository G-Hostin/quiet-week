// Date helpers in UTC (no time-zone drift between server, browser and tests).

export function parseDay(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = parseDay(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toDay(d);
}

/** Monday of the week containing the day. */
export function mondayOf(iso: string): string {
  const d = parseDay(iso);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  return addDays(iso, -dow);
}

/** First Monday on or after the day. */
export function mondayOnOrAfter(iso: string): string {
  const m = mondayOf(iso);
  return m === iso ? m : m < iso ? addDays(m, 7) : m;
}

export function daysBetweenInclusiveOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const s = aStart > bStart ? aStart : bStart;
  const e = aEnd < bEnd ? aEnd : bEnd;
  if (s > e) return 0;
  return Math.round((parseDay(e).getTime() - parseDay(s).getTime()) / 86_400_000) + 1;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function shortDate(iso: string): string {
  const d = parseDay(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function longDate(iso: string): string {
  const d = parseDay(iso);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

export function monthName(iso: string, long = false): string {
  const d = parseDay(iso);
  return (long ? MONTHS_LONG : MONTHS)[d.getUTCMonth()];
}

export function weekLabel(start: string): string {
  return `Week of ${shortDate(start)}`;
}

export function lastDayOfMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  return toDay(new Date(Date.UTC(y, m, 0)));
}
