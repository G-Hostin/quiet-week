"""Print the key figures of the precomputed examples.

Run: python3 -I scripts/summary.py
"""
import json
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EX = os.path.join(HERE, "data", "examples")
for name in ("action-western", "cozy-farm", "metroidvania"):
    a = json.load(open(os.path.join(EX, name + ".json"), encoding="utf-8"))
    levels = [w["level"] for w in a["weeks"]]
    g = a["verdict"]["gta"]
    print(name, "| weeks", len(levels), "| red", levels.count("clash"), "yellow", levels.count("overlap"),
          "green", levels.count("clear"), "grey", levels.count("open"),
          "| GTA", g["answer"], round(g["affinity"], 2), "rank", g["rank"], "of", g["of"],
          "| summary by", a["verdict"]["summaryBy"], "| calls", len(a["evidence"]["calls"]), "| model", a["stats"]["model"])
