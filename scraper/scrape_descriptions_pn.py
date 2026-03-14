#!/usr/bin/env python3
"""Scrape descriptions from Pecora Nera locale pages."""

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DATA = Path(__file__).parent.parent / "data" / "pecora_nera.json"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


def scrape_description(url: str) -> str | None:
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        # Extract all substantial <p> tags (the review text)
        paragraphs = re.findall(r'<p[^>]*>([^<]{40,})</p>', html)
        # Filter out boilerplate (newsletter, cookie, etc.)
        filtered = [
            p.strip() for p in paragraphs
            if not any(kw in p.lower() for kw in [
                'newsletter', 'cookie', 'privacy', 'iscriviti',
                'pecora nera', 'copyright', 'tutti i diritti',
            ])
        ]
        if filtered:
            return "\n\n".join(filtered)
        return None
    except Exception as e:
        print(f"    Error: {url}: {e}")
        return None


def main():
    with open(DATA) as f:
        locales = json.load(f)

    already = sum(1 for r in locales if r.get("description"))
    print(f"Total: {len(locales)}, already with description: {already}")

    to_scrape = [(i, loc) for i, loc in enumerate(locales) if not loc.get("description")]
    print(f"Scraping {len(to_scrape)} pages...")

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {
            executor.submit(scrape_description, loc["url"]): (i, loc)
            for i, loc in to_scrape
        }
        done = 0
        found = 0
        for future in as_completed(futures):
            idx, loc = futures[future]
            desc = future.result()
            if desc:
                locales[idx]["description"] = desc
                found += 1
            done += 1
            if done % 100 == 0:
                print(f"  {done}/{len(to_scrape)} scraped ({found} descriptions found)")
                with open(DATA, "w") as f:
                    json.dump(locales, f, ensure_ascii=False, indent=2)

    with open(DATA, "w") as f:
        json.dump(locales, f, ensure_ascii=False, indent=2)

    total_desc = sum(1 for r in locales if r.get("description"))
    print(f"\nDone! {total_desc}/{len(locales)} with descriptions")


if __name__ == "__main__":
    main()
