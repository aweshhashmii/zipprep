#!/usr/bin/env python3
"""Compare the committed Census 2011 district mirror with the official PCA SD XLSX.

This script never promotes records to verified status. It emits a row-level report
so mismatches and workbook schema changes are reviewed before any data mutation.
"""
from __future__ import annotations

import json
import re
import sys
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "india-district-census-2011.json"
REPORT = ROOT / "reports" / "census-pca-2011-reconciliation.json"
URL = "https://censusindia.gov.in/nada/index.php/catalog/6191/download/9268/DDW_PCA0000_2011_Indiastatedist.xlsx"


def norm(value: object) -> str:
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower())


STATE_ALIASES = {
    "orissa": "odisha",
    "uttaranchal": "uttarakhand",
    "nctofdelhi": "delhi",
    "nationalcapitalterritoryofdelhi": "delhi",
    "pondicherry": "puducherry",
    "jammukashmir": "jammuandkashmir",
    "andamanandnicobarislands": "andamanandnicobarislands",
}
DISTRICT_ALIASES = {
    "leh": "lehladakh",
    "lehladakh": "lehladakh",
    "lahulspiti": "lahulandspiti",
    "lahulandspiti": "lahulandspiti",
    "mewat": "nuh",
    "gurgaon": "gurugram",
    "bangalore": "bengaluru",
    "bangalorerural": "bengalururural",
    "bellary": "ballari",
    "shimoga": "shivamogga",
    "mysore": "mysuru",
    "gulbarga": "kalaburagi",
}


def canon_state(value: object) -> str:
    key = norm(value)
    return STATE_ALIASES.get(key, key)


def canon_district(value: object) -> str:
    key = norm(value)
    return DISTRICT_ALIASES.get(key, key)


HEADER_ALIASES = {
    "state": {"state", "statename", "stateut", "stateutname"},
    "district": {"district", "districtname", "districtcode", "districtcensuscode"},
    "area": {"areaname", "nameofarea", "area"},
    "households": {"numberofhouseholds", "households", "totalhouseholds"},
    "population": {"totalpopulationpersons", "populationpersons", "totalpopulation", "population"},
    "male": {"populationmales", "malepopulation", "males", "male"},
    "female": {"populationfemales", "femalepopulation", "females", "female"},
    "literate": {"literatepersons", "literatepopulation", "literate"},
    "literacy_rate": {"literacyrate", "literacyratepercent"},
    "sex_ratio": {"sexratio", "sexratiofemalesper1000males"},
    "sc": {"scheduledcastespersons", "scheduledcastes", "scpopulation", "sc"},
    "st": {"scheduledtribespersons", "scheduledtribes", "stpopulation", "st"},
    "workers": {"totalworkerspersons", "totalworkers", "workers"},
}


def header_key(value: object) -> str:
    return norm(value)


def find_header(rows):
    for idx, row in enumerate(rows[:30]):
        combined = []
        for col in range(len(row)):
            parts = []
            for back in range(max(0, idx - 3), idx + 1):
                value = rows[back][col] if col < len(rows[back]) else None
                if value is not None and str(value).strip():
                    parts.append(str(value).strip())
            combined.append(" ".join(parts))
        found = {}
        for field, aliases in HEADER_ALIASES.items():
            for col, label in enumerate(combined):
                key = header_key(label)
                if key in aliases:
                    found[field] = col
                    break
        if ("district" in found or "area" in found) and "population" in found and "male" in found and "female" in found:
            return idx, found, combined
    return None, {}, []


def number(value):
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return int(round(value))
    text = str(value).replace(",", "").strip()
    try:
        return int(round(float(text)))
    except ValueError:
        return None


def main():
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    mirror = json.loads(DATA.read_text(encoding="utf-8"))
    records = mirror.get("records", [])
    with urllib.request.urlopen(URL, timeout=90) as response:
        workbook_bytes = response.read()
    tmp = ROOT / "reports" / "official-pca-sd-2011.xlsx"
    tmp.write_bytes(workbook_bytes)
    workbook = load_workbook(tmp, read_only=True, data_only=True)
    candidates = []
    for sheet in workbook.worksheets:
        rows = list(sheet.iter_rows(values_only=True))
        header_idx, columns, labels = find_header(rows)
        candidates.append((sheet.title, rows, header_idx, columns, labels))
    selected = next((item for item in candidates if item[2] is not None), None)
    if selected is None:
        report = {
            "status": "blocked_schema_unrecognised",
            "sourceUrl": URL,
            "sourceCatalogue": "https://censusindia.gov.in/nada/index.php/catalog/6191",
            "checkedAt": datetime.now(timezone.utc).isoformat(),
            "workbookSheets": [{"name": name, "rows": len(rows), "sampleHeaders": labels[:30]} for name, rows, _, _, labels in candidates],
            "message": "Official workbook downloaded, but its header layout did not match the conservative parser. No records were verified."
        }
        REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, indent=2))
        return 2

    sheet_name, rows, header_idx, columns, labels = selected
    official = {}
    duplicate_official = []
    for row in rows[header_idx + 1:]:
        def get(field):
            col = columns.get(field)
            return row[col] if col is not None and col < len(row) else None
        district = get("district") or get("area")
        state = get("state")
        if not district or not state:
            continue
        key = (canon_state(state), canon_district(district))
        values = {field: number(get(field)) for field in ("households", "population", "male", "female", "literate", "sc", "st", "workers")}
        values["literacyRate"] = get("literacy_rate")
        values["sexRatio"] = get("sex_ratio")
        if key in official:
            duplicate_official.append({"state": key[0], "district": key[1]})
        official[key] = values

    mismatches = []
    missing = []
    matched = 0
    fields = ("households", "population", "male", "female", "literate", "sc", "st", "workers")
    for record in records:
        key = (canon_state(record.get("state")), canon_district(record.get("district")))
        source = official.get(key)
        if source is None:
            missing.append({"state": record.get("state"), "district": record.get("district"), "censusDistrictCode": record.get("censusDistrictCode")})
            continue
        differences = []
        for field in fields:
            if source.get(field) is not None and number(record.get(field)) != source[field]:
                differences.append({"field": field, "mirror": number(record.get(field)), "official": source[field]})
        for field in ("literacyRate", "sexRatio"):
            official_value = source.get(field)
            if official_value is not None:
                try:
                    a, b = float(record.get(field)), float(official_value)
                    if abs(a - b) > 0.02:
                        differences.append({"field": field, "mirror": a, "official": b})
                except (TypeError, ValueError):
                    differences.append({"field": field, "mirror": record.get(field), "official": official_value})
        matched += 1
        if differences:
            mismatches.append({"state": record.get("state"), "district": record.get("district"), "censusDistrictCode": record.get("censusDistrictCode"), "differences": differences})

    status = "exact_match" if len(records) == 640 and matched == 640 and not missing and not mismatches and not duplicate_official else "review_required"
    report = {
        "status": status,
        "sourceUrl": URL,
        "sourceCatalogue": "https://censusindia.gov.in/nada/index.php/catalog/6191",
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "workbookSheet": sheet_name,
        "workbookRowsParsed": len(official),
        "mirrorRows": len(records),
        "matchedRows": matched,
        "missingRows": missing,
        "mismatchRows": mismatches,
        "duplicateOfficialKeys": duplicate_official,
        "matchedFields": list(fields) + ["literacyRate", "sexRatio"],
        "parserHeaderMap": {field: labels[col] for field, col in columns.items()},
        "policy": "This report is a technical comparison only. The application data remains unverified until all discrepancies and historical boundary/name changes are reviewed and the reviewed result is committed."
    }
    REPORT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({k: v for k, v in report.items() if k not in ("missingRows", "mismatchRows")}, indent=2, ensure_ascii=False))
    print(f"Missing rows: {len(missing)}; mismatch rows: {len(mismatches)}")
    return 0 if status == "exact_match" else 1


if __name__ == "__main__":
    sys.exit(main())
