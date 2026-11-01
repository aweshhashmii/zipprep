#!/usr/bin/env python3
"""Build a conservative district-headquarters overlay from Survey of India/NIC BharatMaps.

The source layer is a historical (2017) district HQ point register. It is joined
only by exact LGD district code; name-only fuzzy matches are deliberately excluded.
"""
from __future__ import annotations

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = "https://bharatmapsparivesh.parivesh.nic.in/parivesh_bharatmaps/rest/services/AdministrativeHeadQuarter/MapServer/1/query"
SOURCE_URL = "https://bharatmapsparivesh.parivesh.nic.in/parivesh_bharatmaps/rest/services/AdministrativeHeadQuarter/MapServer/1"
FIELDS = "dtname,stname,dist_hq,dist_hqnm,dist_lgd,state_lgd,stcode11,dtcode11,year_stat"
PAGE_SIZE = 1500


def fetch_page(offset: int) -> dict:
    params = {
        "where": "dist_lgd IS NOT NULL",
        "outFields": FIELDS,
        "returnGeometry": "false",
        "f": "json",
        "resultOffset": str(offset),
        "resultRecordCount": str(PAGE_SIZE),
        "orderByFields": "dist_lgd",
    }
    url = BASE + "?" + urllib.parse.urlencode(params)
    request = urllib.request.Request(url, headers={"User-Agent": "ZipPrep-IndiaAtlas/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response:
        payload = json.load(response)
    if "error" in payload:
        raise RuntimeError("BharatMaps API error: " + json.dumps(payload["error"]))
    return payload


def main() -> None:
    features = []
    offset = 0
    while True:
        payload = fetch_page(offset)
        page = payload.get("features") or []
        features.extend(page)
        if len(page) < PAGE_SIZE or not payload.get("exceededTransferLimit", False):
            break
        offset += len(page)
        time.sleep(0.2)

    if not features:
        raise RuntimeError("Survey of India/NIC district HQ layer returned no records")

    records_by_lgd: dict[str, dict] = {}
    for feature in features:
        attrs = feature.get("attributes") or {}
        code = attrs.get("dist_lgd")
        hq = attrs.get("dist_hqnm") or attrs.get("dist_hq")
        if code in (None, "") or not hq:
            continue
        key = str(code)
        record = {
            "lgdCode": key,
            "headquarters": str(hq).strip(),
            "districtName": attrs.get("dtname"),
            "stateName": attrs.get("stname"),
            "stateLgdCode": str(attrs.get("state_lgd")) if attrs.get("state_lgd") is not None else None,
            "censusStateCode2011": attrs.get("stcode11"),
            "censusDistrictCode2011": attrs.get("dtcode11"),
            "sourceUpdatedYear": attrs.get("year_stat") or "2017",
        }
        # Avoid duplicate codes; prefer the first non-empty HQ name returned.
        records_by_lgd.setdefault(key, record)

    records = sorted(records_by_lgd.values(), key=lambda row: int(row["lgdCode"]))
    output = {
        "schemaVersion": "1.0.0",
        "dataset": "District headquarters — Survey of India/NIC BharatMaps historical point register",
        "source": {
            "sourceId": "surveyOfIndiaNicBharatMapsDistrictHeadquarters2017",
            "title": "Survey of India / NIC BharatMaps — AdministrativeHeadQuarter, District_Hq layer",
            "publisher": "Survey of India; hosted through BharatMaps / NIC",
            "sourceUrl": SOURCE_URL,
            "referenceDate": "2017 (layer metadata update)",
            "lastFetchedAt": datetime.now(timezone.utc).date().isoformat(),
            "verificationStatus": "source_backed_historical",
            "joinMethod": "Exact district LGD code (dist_lgd); no fuzzy name matching",
            "limitations": "Historical layer updated in 2017 and covers 717 districts at publication. It may not reflect later district creation, renaming or headquarters relocation. A match is not a current legal notification.",
        },
        "records": records,
        "audit": {
            "sourceFeatureCount": len(features),
            "uniqueDistrictLgdCodes": len(records),
            "unmatchedOrMissingHeadquarters": len(features) - len(records),
        },
    }
    Path("data/district-headquarters-soi-2017.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps({"dataset": output["dataset"], **output["audit"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
