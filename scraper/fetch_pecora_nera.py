#!/usr/bin/env python3
"""Fetch all locales from La Pecora Nera website."""

import json
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE_API = "https://www.lapecoranera.net/wp-json/wp/v2"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}
OUTPUT_DIR = Path(__file__).parent.parent / "data"
OUTPUT_DIR.mkdir(exist_ok=True)


def api_get(url: str):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def fetch_all_locales() -> list[dict]:
    """Fetch all locale posts from WP REST API."""
    locales = []
    page = 1
    per_page = 100
    while True:
        url = f"{BASE_API}/locale?per_page={per_page}&page={page}&orderby=title&order=asc"
        print(f"  Fetching page {page}...")
        try:
            data = api_get(url)
        except urllib.error.HTTPError as e:
            if e.code == 400:  # past last page
                break
            raise
        if not data:
            break
        locales.extend(data)
        if len(data) < per_page:
            break
        page += 1
        time.sleep(0.3)
    return locales


def fetch_taxonomies() -> dict:
    """Fetch taxonomy terms for categories, regions, tipologia."""
    taxonomies = {}
    for tax in ["categoria-locale", "regione-locale", "tipologia-locale"]:
        terms = {}
        page = 1
        while True:
            url = f"{BASE_API}/{tax}?per_page=100&page={page}"
            try:
                data = api_get(url)
            except urllib.error.HTTPError:
                break
            if not data:
                break
            for t in data:
                terms[t["id"]] = t["name"]
            if len(data) < 100:
                break
            page += 1
        taxonomies[tax] = terms
        print(f"  {tax}: {len(terms)} terms")
    return taxonomies


def scrape_address(locale_url: str) -> str | None:
    """Scrape address from individual locale page's Google Maps embed."""
    try:
        req = urllib.request.Request(locale_url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        # Try Google Maps embed URL first
        match = re.search(r'google\.com/maps\?q=([^&"]+)', html)
        if match:
            addr = urllib.parse.unquote(match.group(1)).replace("+", " ")
            return addr

        # Try finding address in structured content
        match = re.search(
            r'(?:Via|Piazza|Corso|Viale|Largo|Vicolo|Strada|Piazzale|Piazzetta|Lungomare|Borgo|Galleria|Contrada)'
            r'[^<"]{5,80}',
            html,
        )
        if match:
            return match.group(0).strip()

        return None
    except Exception as e:
        print(f"    Error scraping {locale_url}: {e}")
        return None


def clean_address(address: str) -> str:
    """Clean address for better geocoding results."""
    import html as html_mod
    addr = html_mod.unescape(address)
    # Replace " - " separator with ", " for better geocoding
    addr = re.sub(r'\s*-\s*', ', ', addr)
    # Remove extra whitespace
    addr = re.sub(r'\s+', ' ', addr).strip()
    return addr


def geocode_address(address: str) -> tuple[float, float] | None:
    """Geocode address using OpenStreetMap Nominatim with fallback strategies."""
    cleaned = clean_address(address)

    # Try with full cleaned address first, then progressively simpler queries
    attempts = [cleaned + ", Italia"]
    # If address has a number, try without it
    no_number = re.sub(r',?\s*\d+\s*/?[a-zA-Z]?\s*,', ',', cleaned)
    if no_number != cleaned:
        attempts.append(no_number + ", Italia")
    # Try just city name (last part after comma)
    parts = cleaned.split(",")
    if len(parts) > 1:
        city = parts[-1].strip()
        street = parts[0].strip()
        attempts.append(f"{street}, {city}, Italia")

    for q_raw in attempts:
        try:
            q = urllib.parse.quote(q_raw)
            url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&limit=1&countrycodes=it"
            req = urllib.request.Request(url, headers={
                "User-Agent": "GuideApp/1.0 (educational project)",
                "Accept-Language": "it",
            })
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read())
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
            time.sleep(1.1)
        except Exception as e:
            print(f"    Geocode error for '{q_raw}': {e}")
            time.sleep(1.1)
    return None


def process_locale(locale: dict, taxonomies: dict) -> dict:
    """Process a single locale: scrape address and geocode."""
    slug = locale["slug"]
    url = locale["link"]
    name = locale["title"]["rendered"]

    # Resolve taxonomy terms
    categories = [
        taxonomies["categoria-locale"].get(tid, str(tid))
        for tid in locale.get("categoria-locale", [])
    ]
    regions = [
        taxonomies["regione-locale"].get(tid, str(tid))
        for tid in locale.get("regione-locale", [])
    ]
    tipologie = [
        taxonomies["tipologia-locale"].get(tid, str(tid))
        for tid in locale.get("tipologia-locale", [])
    ]

    # Scrape address
    address = scrape_address(url)

    # Geocode
    coords = None
    if address:
        coords = geocode_address(address)
        time.sleep(1.1)  # Nominatim rate limit: 1 req/sec

    result = {
        "name": name,
        "slug": slug,
        "url": url,
        "address": address,
        "lat": coords[0] if coords else None,
        "lng": coords[1] if coords else None,
        "categories": categories,
        "regions": regions,
        "tipologie": tipologie,
    }
    return result


def main():
    print("Fetching taxonomies...")
    taxonomies = fetch_taxonomies()

    print("\nFetching all locales from REST API...")
    locales = fetch_all_locales()
    print(f"Found {len(locales)} locales")

    # Save raw API data
    with open(OUTPUT_DIR / "pecora_nera_raw.json", "w") as f:
        json.dump(locales, f, ensure_ascii=False, indent=2)

    # First pass: scrape all addresses in parallel (no rate limit needed for their site)
    print("\nScraping addresses...")
    addresses = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(scrape_address, loc["link"]): loc["slug"]
            for loc in locales
        }
        done = 0
        for future in as_completed(futures):
            slug = futures[future]
            addresses[slug] = future.result()
            done += 1
            if done % 50 == 0:
                print(f"  Scraped {done}/{len(locales)} addresses...")

    print(f"  Found {sum(1 for v in addresses.values() if v)} addresses out of {len(locales)}")

    # Second pass: geocode all addresses (rate limited)
    print("\nGeocoding addresses...")
    results = []
    for i, locale in enumerate(locales):
        slug = locale["slug"]
        name = locale["title"]["rendered"]
        url = locale["link"]
        address = addresses.get(slug)

        categories = [
            taxonomies["categoria-locale"].get(tid, str(tid))
            for tid in locale.get("categoria-locale", [])
        ]
        regions = [
            taxonomies["regione-locale"].get(tid, str(tid))
            for tid in locale.get("regione-locale", [])
        ]
        tipologie = [
            taxonomies["tipologia-locale"].get(tid, str(tid))
            for tid in locale.get("tipologia-locale", [])
        ]

        coords = None
        if address:
            coords = geocode_address(address)
            time.sleep(1.1)  # Nominatim rate limit

        results.append({
            "name": name,
            "slug": slug,
            "url": url,
            "address": address,
            "lat": coords[0] if coords else None,
            "lng": coords[1] if coords else None,
            "categories": categories,
            "regions": regions,
            "tipologie": tipologie,
            "guide": "pecora_nera",
        })

        if (i + 1) % 25 == 0:
            print(f"  Geocoded {i + 1}/{len(locales)}...")
            # Save intermediate results
            with open(OUTPUT_DIR / "pecora_nera.json", "w") as f:
                json.dump(results, f, ensure_ascii=False, indent=2)

    # Final save
    with open(OUTPUT_DIR / "pecora_nera.json", "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    geocoded = sum(1 for r in results if r["lat"] is not None)
    print(f"\nDone! {len(results)} locales, {geocoded} geocoded")
    print(f"Saved to {OUTPUT_DIR / 'pecora_nera.json'}")


if __name__ == "__main__":
    main()
