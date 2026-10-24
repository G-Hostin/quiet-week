"""Merge the hand-kept release lists into data/releases.json and check basic rules.

Run: python3 -I scripts/merge-releases.py
Checks: every entry has a date, a source URL, a verification date; keys are unique;
dates fall in Nov 2026 - Mar 2027. Prints counts only.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data")


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


releases = load("releases-games-1.json") + load("releases-games-2.json") + load("releases-movies.json")
events = load("steam-events.json")
errors = []
seen = set()
for r in releases:
    k = r["key"]
    if k in seen:
        errors.append("duplicate key " + k)
    seen.add(k)
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", r.get("date", "")):
        errors.append(k + ": bad date")
    if not ("2026-11-01" <= r["date"] <= "2027-03-31"):
        errors.append(k + ": date outside window")
    src = r.get("source") or {}
    if not str(src.get("url", "")).startswith("https://"):
        errors.append(k + ": missing https source")
    if not r.get("verifiedOn"):
        errors.append(k + ": missing verifiedOn")
    if not r.get("qlooId") and not r.get("standIn"):
        errors.append(k + ": no Qloo id and no stand-in")
releases.sort(key=lambda r: (r["date"], r["kind"], r["title"]))
out = {"updated": "2026-10-23", "releases": releases, "steamEvents": events}
with open(os.path.join(DATA, "releases.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
games = sum(1 for r in releases if r["kind"] == "game")
print("releases:", len(releases), "games:", games, "movies:", len(releases) - games, "steam events:", len(events))
print("unique sources:", len({r["source"]["url"] for r in releases} | {e["source"]["url"] for e in events}))
print("errors:", errors or "none")
