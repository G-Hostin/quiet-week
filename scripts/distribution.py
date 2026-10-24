"""Show the real score distribution of the precomputed examples, to choose the colour rule.

Run: python3 -I scripts/distribution.py
"""
import json
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EX = os.path.join(HERE, "data", "examples")
SHORT = {"clash": "R", "overlap": "Y", "clear": "G", "open": "-"}

for name in sorted(os.listdir(EX)):
    if not name.endswith(".json"):
        continue
    a = json.load(open(os.path.join(EX, name), encoding="utf-8"))
    print("##", a["id"], "| audience:", ", ".join(x["name"] for x in a["audience"]))
    games = [r for r in a["releases"] if r["kind"] == "game"]
    movies = [r for r in a["releases"] if r["kind"] == "movie"]
    for label, group in (("games", games), ("movies", movies)):
        vals = sorted([r["affinity"] for r in group if r["affinity"] is not None], reverse=True)
        unscored = [r["title"] for r in group if r["affinity"] is None]
        if vals:
            mid = vals[len(vals) // 2]
            print("  %s: n=%d min=%.2f median=%.2f max=%.2f unscored=%s" % (label, len(vals), vals[-1], mid, vals[0], unscored))
    for r in sorted(a["releases"], key=lambda r: -(r["affinity"] or 0)):
        via = (" via " + r["standIn"]["title"]) if r["via"] == "stand-in" else (" (own)" if r["via"] == "own" else "")
        aff = "%.3f" % r["affinity"] if r["affinity"] is not None else " n/a "
        print("   %s %s %-6s %s %s%s" % (aff, SHORT[r["level"]], r["kind"], r["date"], r["title"], via))
    print("  weeks:", "".join(SHORT[w["level"]] for w in a["weeks"]))
