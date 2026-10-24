"""Summarise raw Qloo answers from ../test-donnees/v2 (names, ids, affinity, dates). No keys involved.

Run: python3 -I scripts/inspect-raw.py file1 file2 ...
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(os.path.dirname(HERE), "test-donnees", "v2")

for name in sys.argv[1:]:
    p = os.path.join(RAW, name if name.endswith(".json") else name + ".json")
    d = json.load(open(p, encoding="utf-8"))
    res = d.get("results")
    if isinstance(res, dict):
        res = res.get("entities") or []
    res = res or []
    print("##", name, "n=", len(res), "keys=", list(d.keys())[:5])
    for e in res[:20]:
        q = e.get("query") or {}
        pr = e.get("properties") or {}
        print("  -", e.get("name"), "|", e.get("entity_id"), "| aff", q.get("affinity"), "| pop", e.get("popularity"),
              "| date", pr.get("release_date") or pr.get("release_year"), "| img", bool((pr.get("image") or {}).get("url")),
              "| qkeys", list(q.keys()))
