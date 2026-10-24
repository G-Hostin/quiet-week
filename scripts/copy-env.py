"""Copy QLOO_API_KEY and GEMINI_API_KEY from ../.env into .env.local without printing them.

Run: python3 -I scripts/copy-env.py
Prints only which names were found (never values).
"""
import os

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(os.path.dirname(HERE), ".env")
DST = os.path.join(HERE, ".env.local")
WANTED = ("QLOO_API_KEY", "GEMINI_API_KEY")

found = {}
with open(SRC, encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        for name in WANTED:
            if line.startswith(name + "="):
                found[name] = line.split("=", 1)[1].strip().strip('"').strip("'")

with open(DST, "w", encoding="utf-8") as f:
    for name in WANTED:
        if name in found:
            f.write("%s=%s\n" % (name, found[name]))
    f.write("GEMINI_MODEL=gemini-3.5-flash-lite\n")
    f.write("GEMINI_FALLBACK_MODEL=gemini-3.5-flash\n")
os.chmod(DST, 0o600)
for name in WANTED:
    print(name, "found" if name in found else "MISSING")
