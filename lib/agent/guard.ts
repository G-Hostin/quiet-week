// Guards on the agent's written verdict: only Qloo numbers, only real dates, no forecasts.

const FORBIDDEN = [
  /\bsales?\b/i,
  /\bsell(s|ing)?\b/i,
  /\brevenue/i,
  /\bwishlists?\b/i,
  /\bunits?\b/i,
  /\bforecast/i,
  /\bpredict/i,
  /\bguarantee/i,
  /%/,
  /\bpercent/i,
  /\$\s?\d/,
];

const MONTHS: Record<string, string> = {
  jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
  jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
};
const DATE_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2})\b/gi;

export interface GuardResult {
  ok: boolean;
  reason?: string;
}

/** "Jan 4", "January 4", "Nov. 19" -> "01-04", "11-19". */
export function datesIn(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(DATE_RE)) out.push(`${MONTHS[m[1].slice(0, 3).toLowerCase()]}-${m[2].padStart(2, "0")}`);
  return out;
}

/**
 * Accept the text only if:
 * - every decimal number is one of the affinities Qloo returned (compared at two decimals);
 * - every whole number is a day of month, 2026/2027, or a count/rank we passed in;
 * - every "Mon D" date is one the tools returned (week starts/ends, release dates), when a list is given;
 * - it makes no sales or forecast claim.
 */
export function checkSummary(
  text: string,
  allowedAffinities: number[],
  allowedInts: number[] = [],
  allowedDays?: string[],
): GuardResult {
  if (!text || text.length < 40) return { ok: false, reason: "too short" };
  if (text.length > 900) return { ok: false, reason: "too long" };
  for (const re of FORBIDDEN) if (re.test(text)) return { ok: false, reason: `forbidden claim (${re.source})` };
  const allowed = new Set(allowedAffinities.map((a) => a.toFixed(2)));
  const decimals = text.match(/\d*\.\d+/g) || [];
  for (const d of decimals) {
    if (!allowed.has(Number(d).toFixed(2))) return { ok: false, reason: `number ${d} was not returned by Qloo` };
  }
  const ints = (text.replace(/\d*\.\d+/g, " ").match(/\b\d+\b/g) || []).map(Number);
  const okInts = new Set([...allowedInts, 2026, 2027]);
  for (const n of ints) {
    if (okInts.has(n) || (n >= 1 && n <= 31)) continue;
    return { ok: false, reason: `number ${n} is not a date or a Qloo figure` };
  }
  if (allowedDays) {
    const okDays = new Set(allowedDays.map((d) => d.slice(5, 10)));
    for (const d of datesIn(text)) {
      if (!okDays.has(d)) return { ok: false, reason: `date ${d} is not one of the weeks or releases returned by the tools` };
    }
  }
  return { ok: true };
}
