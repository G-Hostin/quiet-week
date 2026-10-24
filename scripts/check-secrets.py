"""Check that no key value from .env.local appears in the files git would commit.

Run: python3 -I scripts/check-secrets.py
Prints only True/False lines, never a value. Exit code 1 if a key is found.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(HERE, ".env.local")
NAMES = ("QLOO_API_KEY", "GEMINI_API_KEY")

values = []
with open(ENV, encoding="utf-8") as f:
    for line in f:
        for n in NAMES:
            if line.startswith(n + "="):
                v = line.split("=", 1)[1].strip().strip('"').strip("'")
                if len(v) >= 8:
                    values.append(v)

out = subprocess.run(["git", "ls-files", "--cached", "--others", "--exclude-standard"], cwd=HERE, capture_output=True, text=True)
files = [x for x in out.stdout.splitlines() if x]
found = False
for rel in files:
    p = os.path.join(HERE, rel)
    try:
        data = open(p, "rb").read()
    except OSError:
        continue
    for v in values:
        if v.encode() in data:
            found = True
            print("key found in a tracked file: True (file:", rel, ")")
print("keys loaded:", len(values) == len(NAMES))
print("files checked:", len(files) > 0)
print(".env.local ignored by git:", ".env.local" not in files)
print("no key in tracked files:", not found)
sys.exit(1 if found else 0)
