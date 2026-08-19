#!/usr/bin/env python3
"""Scan asset image sidecars across the repo and build metadata/index.json.

Usage:
    python tools/gen_index.py

For every image file under the asset directories, looks for a same-named
``.json`` sidecar sitting next to it (e.g. ``wallpapers/game/foo/foo.avif``
+ ``wallpapers/game/foo/foo.json``). Each sidecar is read and aggregated into
``metadata/index.json`` with a count and an ordered assets array. When Pillow
is installed, the real width/height and ratio of each image are auto-filled.

This layout keeps each image's metadata co-located with the image file, so
moving or reorganizing folders never orphans the metadata; only renames need a
small helper to keep the ``.json`` basename and the inner ``file``/``path``
fields in sync.
"""
import json
import math
import os
import sys
from datetime import datetime, timezone, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
META_DIR = os.path.join(ROOT, "metadata")
INDEX_PATH = os.path.join(META_DIR, "index.json")
# 同源副本，供 GitHub Pages 站点实时读取（避开 jsDelivr 缓存）
DOCS_INDEX_PATH = os.path.join(ROOT, "docs", "assets", "index.json")

# 不扫描的目录（依赖、生成的站点、脚本自身、旧/生成的元数据目录）
EXCLUDE_DIRS = {".git", ".workbuddy", "node_modules", "site", "docs", "tools", "metadata"}
# 视为图片资产的扩展名
IMAGE_EXTS = {".avif", ".webp", ".png", ".jpg", ".jpeg", ".gif", ".bmp"}

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


def find_sidecars():
    """Yield (sidecar_path, image_path) for every image that has a sibling json."""
    results = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        # 原地剪枝，避免进入无关目录
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for fn in filenames:
            ext = os.path.splitext(fn)[1].lower()
            if ext not in IMAGE_EXTS:
                continue
            img = os.path.join(dirpath, fn)
            stem = os.path.splitext(fn)[0]
            sidecar = os.path.join(dirpath, stem + ".json")
            if os.path.isfile(sidecar):
                results.append((sidecar, img))
    # 稳定排序：按图片相对仓库根的路径
    results.sort(key=lambda p: os.path.relpath(p[1], ROOT))
    return results


def main():
    assets = []
    for sidecar, img in find_sidecars():
        try:
            with open(sidecar, encoding="utf-8") as f:
                data = json.load(f)
        except Exception as e:
            print(f"skip {os.path.relpath(sidecar, ROOT)}: {e}", file=sys.stderr)
            continue

        # path 缺省时按图片相对仓库根推导
        if not data.get("path"):
            data["path"] = os.path.relpath(img, ROOT).replace(os.sep, "/")
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
    os.makedirs(META_DIR, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    os.makedirs(os.path.dirname(DOCS_INDEX_PATH), exist_ok=True)
    with open(DOCS_INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    note = " (with real dimensions)" if HAVE_PIL else " (Pillow not installed: dimensions skipped)"
    print(f"wrote {INDEX_PATH} and {DOCS_INDEX_PATH} with {len(assets)} asset(s){note}")


if __name__ == "__main__":
    main()
