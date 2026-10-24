// Hand-kept release calendar (data/releases.json), loaded on the server or at build time.
import releasesJson from "../data/releases.json";
import type { Release, ReleaseData, SteamEvent } from "./types";

export const RELEASE_DATA = releasesJson as unknown as ReleaseData;

export function releasesInWindow(start: string, end: string): Release[] {
  return RELEASE_DATA.releases.filter((r) => r.date >= start && r.date <= end);
}

export function eventsInWindow(start: string, end: string): SteamEvent[] {
  return RELEASE_DATA.steamEvents.filter((e) => e.end >= start && e.start <= end);
}

export const DEFAULT_WINDOW = { start: "2026-11-01", end: "2027-03-31" };
