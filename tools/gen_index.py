#!/usr/bin/env python3
"""Scan metadata/*.json and build metadata/index.json.

Usage:
    python tools/gen_index.py

Scans every <name>.json in metadata/ (skips index.json itself), reads the
entries, and writes a consolidated metadata/index.json with a count and an
ordered assets array. When Pillow is installed, the real width/height and
ratio of each image are auto-filled.
"""
import json
import math
import os
import sys
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META_DIR = os.path.join(ROOT, "metadata")
INDEX_PATH = os.path.join(META_DIR, "index.json")

try:
    from PIL import Image

    HAVE_PIL = True
except ImportError:
    HAVE_PIL = False


def ratio_from_size(w, h):
    if not w or not h:
        return None
    g = math.gcd(w, h)
    return f"{w // g}:{h // g}"


def real_dims(path):
    if not HAVE_PIL:
        return None, None
    try:
        with Image.open(path) as im:
            return im.width, im.height
    except Exception:
        return None, None


def main():
    if not os.path.isdir(META_DIR):
        print(f"metadata/ not found at {META_DIR}", file=sys.stderr)
        sys.exit(1)

    assets = []
    for name in sorted(os.listdir(META_DIR)):
        if not name.endswith(".json") or name == "index.json":
            continue
        full = os.path.join(META_DIR, name)
        try:
            with open(full, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"skip {name}: {e}", file=sys.stderr)
            continue

        rel = data.get("path") or data.get("file")
        if rel:
            ap = os.path.join(ROOT, rel)
            w, h = real_dims(ap)
            if w and h:
                data["width"] = w
                data["height"] = h
                if not data.get("ratio"):
                    data["ratio"] = ratio_from_size(w, h)
        assets.append(data)

    tz = timezone(timedelta(hours=8))
    index = {
        "generated_at": datetime.now(tz).isoformat(),
        "version": 1,
        "count": len(assets),
        "assets": assets,
    }
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    note = " (with real dimensions)" if HAVE_PIL else " (Pillow not installed: dimensions skipped)"
    print(f"wrote {INDEX_PATH} with {len(assets)} asset(s){note}")


if __name__ == "__main__":
    main()
