#!/usr/bin/env python3
"""Import Dissapore Osterie d'Italia CSV to JSON."""

import csv
import json
import re
from pathlib import Path

INPUT = Path.home() / "Downloads" / "Dissapore - dbo-dissapore-552708-live.1753649059.csv"
OUTPUT = Path(__file__).parent.parent / "data" / "dissapore.json"


def extract_region(city: str) -> str:
    """Extract province abbreviation from city string like 'Milano (MI)'."""
    match = re.search(r'\((\w+)\)', city)
    return match.group(1) if match else ""


PROVINCE_TO_REGION = {
    "AG": "Sicilia", "AL": "Piemonte", "AN": "Marche", "AO": "Valle d'Aosta",
    "AP": "Marche", "AQ": "Abruzzo", "AR": "Toscana", "AT": "Piemonte",
    "AV": "Campania", "BA": "Puglia", "BG": "Lombardia", "BI": "Piemonte",
    "BL": "Veneto", "BN": "Campania", "BO": "Emilia-Romagna", "BR": "Puglia",
    "BS": "Lombardia", "BT": "Puglia", "BZ": "Trentino-Alto Adige",
    "CA": "Sardegna", "CB": "Molise", "CE": "Campania", "CH": "Abruzzo",
    "CL": "Sicilia", "CN": "Piemonte", "CO": "Lombardia", "CR": "Lombardia",
    "CS": "Calabria", "CT": "Sicilia", "CZ": "Calabria", "EN": "Sicilia",
    "FC": "Emilia-Romagna", "FE": "Emilia-Romagna", "FG": "Puglia",
    "FI": "Toscana", "FM": "Marche", "FR": "Lazio", "GE": "Liguria",
    "GO": "Friuli Venezia Giulia", "GR": "Toscana", "IM": "Liguria",
    "IS": "Molise", "KR": "Calabria", "LC": "Lombardia", "LE": "Puglia",
    "LI": "Toscana", "LO": "Lombardia", "LT": "Lazio", "LU": "Toscana",
    "MC": "Marche", "ME": "Sicilia", "MI": "Lombardia", "MN": "Lombardia",
    "MO": "Emilia-Romagna", "MS": "Toscana", "MT": "Basilicata",
    "NA": "Campania", "NO": "Piemonte", "NU": "Sardegna", "OR": "Sardegna",
    "PA": "Sicilia", "PC": "Emilia-Romagna", "PD": "Veneto", "PE": "Abruzzo",
    "PG": "Umbria", "PI": "Toscana", "PN": "Friuli Venezia Giulia",
    "PO": "Toscana", "PR": "Emilia-Romagna", "PT": "Toscana", "PU": "Marche",
    "PV": "Lombardia", "PZ": "Basilicata", "RA": "Emilia-Romagna",
    "RC": "Calabria", "RE": "Emilia-Romagna", "RG": "Sicilia", "RI": "Lazio",
    "RM": "Lazio", "RN": "Emilia-Romagna", "RO": "Veneto", "SA": "Campania",
    "SI": "Toscana", "SO": "Lombardia", "SP": "Liguria", "SR": "Sicilia",
    "SS": "Sardegna", "SU": "Sardegna", "SV": "Liguria", "TA": "Puglia",
    "TE": "Abruzzo", "TN": "Trentino-Alto Adige", "TO": "Piemonte",
    "TP": "Sicilia", "TR": "Umbria", "TS": "Friuli Venezia Giulia",
    "TV": "Veneto", "UD": "Friuli Venezia Giulia", "VA": "Lombardia",
    "VB": "Piemonte", "VC": "Piemonte", "VE": "Veneto", "VI": "Veneto",
    "VR": "Veneto", "VT": "Lazio", "VV": "Calabria",
}


def main():
    results = []
    with open(INPUT, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lat = row.get("latitude", "").strip()
            lng = row.get("longitude", "").strip()
            if not lat or not lng:
                continue

            province = extract_region(row.get("city", ""))
            region = PROVINCE_TO_REGION.get(province, "")

            results.append({
                "name": row["name"].strip(),
                "slug": row["name"].strip().lower().replace(" ", "-").replace("'", ""),
                "url": row.get("url", ""),
                "address": row.get("city", "").strip(),
                "lat": float(lat),
                "lng": float(lng),
                "categories": ["Osterie d'Italia"],
                "regions": [region] if region else [],
                "tipologie": ["Osteria"],
                "guide": "dissapore",
            })

    OUTPUT.parent.mkdir(exist_ok=True)
    with open(OUTPUT, "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"Imported {len(results)} locales to {OUTPUT}")


if __name__ == "__main__":
    main()
