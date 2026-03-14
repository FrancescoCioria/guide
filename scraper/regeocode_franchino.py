#!/usr/bin/env python3
"""Re-geocode Franchino data using addresses (original coords are fake/sequential)."""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

DATA = Path(__file__).parent.parent / "data" / "franchino.json"


def geocode(address: str) -> tuple[float, float] | None:
    try:
        q = urllib.parse.quote(address + ", Italia")
        url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1&countrycodes=it"
        req = urllib.request.Request(url, headers={
            "User-Agent": "GuideApp/1.0 (educational project)",
            "Accept-Language": "it",
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read())
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"])
        return None
    except Exception as e:
        print(f"    Error: {address}: {e}")
        return None


def main():
    with open(DATA) as f:
        locales = json.load(f)

    print(f"Re-geocoding {len(locales)} Franchino entries...")
    updated = 0
    failed = 0

    for i, loc in enumerate(locales):
        addr = loc.get("address", "")
        if not addr or len(addr) < 5:
            loc["lat"] = None
            loc["lng"] = None
            failed += 1
            continue

        coords = geocode(addr)
        if coords:
            loc["lat"] = coords[0]
            loc["lng"] = coords[1]
            updated += 1
        else:
            loc["lat"] = None
            loc["lng"] = None
            failed += 1

        time.sleep(1.05)

        if (i + 1) % 25 == 0:
            print(f"  {i + 1}/{len(locales)} (ok: {updated}, fail: {failed})")
            with open(DATA, "w") as f:
                json.dump(locales, f, ensure_ascii=False, indent=2)

    with open(DATA, "w") as f:
        json.dump(locales, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Updated: {updated}, Failed: {failed}")


if __name__ == "__main__":
    main()
