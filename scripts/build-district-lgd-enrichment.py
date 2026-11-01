#!/usr/bin/env python3
"""Build district-level LGD counts from the dated public LGD Parquet release.

The upstream release is a community-published normalized mirror of Ministry
of Panchayati Raj LGD reports. The generated file preserves that provenance
and the per-dataset observation dates; it does not claim direct ministry
hosting or legal verification.
"""
import json, os, re, sys, tempfile, urllib.request
from pathlib import Path
import duckdb

API = "https://api.github.com/repos/ramSeraph/opendata/releases/tags/lgd-parquet-latest"
OUT = Path("data/district-lgd-profile-enrichment.json")
DATASETS = ("villages", "tlb_villages", "pri_local_bodies", "statewise_ulbs_coverage")
HEADERS = {"User-Agent": "ZipPrep-LGD-district-enrichment/1.0", "Accept": "application/vnd.github+json"}

def get_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.load(response)

def download(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    with urllib.request.urlopen(req, timeout=180) as response, open(path, "wb") as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk: break
            out.write(chunk)

def main():
    release = get_json(API)
    assets = release.get("assets", [])
    selected = {}
    for dataset in DATASETS:
        candidates = []
        pattern = re.compile(rf"^{dataset}\.(\d{{4}}-\d{{2}}-\d{{2}})\.[a-f0-9]+\.parquet$")
        for asset in assets:
            match = pattern.match(asset.get("name", ""))
            if match:
                candidates.append((match.group(1), asset.get("created_at", ""), asset))
        if not candidates:
            raise RuntimeError("No published Parquet asset for " + dataset)
        selected[dataset] = max(candidates, key=lambda x: (x[0], x[1]))[2]

    with tempfile.TemporaryDirectory(prefix="zipprep-lgd-") as temp:
        local = {}
        for dataset, asset in selected.items():
            target = Path(temp) / (dataset + ".parquet")
            download(asset["browser_download_url"], target)
            local[dataset] = str(target)

        con = duckdb.connect()
        village_rows = con.execute("""
            SELECT district_code, district_name, state_name,
                   COUNT(DISTINCT village_code)::BIGINT AS villages
            FROM read_parquet(?)
            WHERE district_code IS NOT NULL AND trim(district_code) <> ''
              AND village_code IS NOT NULL AND trim(village_code) <> ''
            GROUP BY district_code, district_name, state_name
        """, [local["villages"]]).fetchall()

        gp_rows = con.execute("""
            SELECT v.district_code, v.district_name, v.state_name,
                   COUNT(DISTINCT v.local_body_code)::BIGINT AS gram_panchayats
            FROM read_parquet(?) v
            INNER JOIN read_parquet(?) p
              ON v.local_body_code = p.local_body_code
             AND p.local_body_type_code = '3'
            WHERE v.district_code IS NOT NULL AND trim(v.district_code) <> ''
              AND v.local_body_code IS NOT NULL AND trim(v.local_body_code) <> ''
            GROUP BY v.district_code, v.district_name, v.state_name
        """, [local["tlb_villages"], local["pri_local_bodies"]]).fetchall()

        ulb_rows = con.execute("""
            SELECT district_code, district_name, state_name,
                   COUNT(DISTINCT local_body_code)::BIGINT AS urban_local_bodies
            FROM read_parquet(?)
            WHERE district_code IS NOT NULL AND trim(district_code) <> ''
              AND local_body_code IS NOT NULL AND trim(local_body_code) <> ''
            GROUP BY district_code, district_name, state_name
        """, [local["statewise_ulbs_coverage"]]).fetchall()

        records = {}
        for rows, field in ((village_rows, "villages"), (gp_rows, "gramPanchayats"), (ulb_rows, "urbanLocalBodies")):
            for code, district, state, count in rows:
                code = str(code)
                item = records.setdefault(code, {"lgdCode": code, "districtName": district, "stateName": state, "fields": {}})
                item["fields"][field] = int(count)

    for item in records.values():
        item["verifiedFields"] = ["administrative." + key for key in item["fields"]]
        item["sourceRecords"] = [{
            "sourceId": "moprLgdDailyParquetMirror2026",
            "title": "Ministry of Panchayati Raj — Local Government Directory (LGD), normalized daily report mirror",
            "sourceUrl": "https://panchayat.gov.in/en/lgd/",
            "mirrorUrl": "https://github.com/ramSeraph/opendata/releases/tag/lgd-parquet-latest",
            "referenceDate": max(selected[name]["name"].split(".")[1] for name in DATASETS if name in selected),
            "fields": ["administrative." + key for key in item["fields"]],
            "note": "Counts are derived from dated LGD village, PRI village-to-local-body mapping, PRI local-body register and urban local-body coverage reports. A body associated with more than one district is counted in each reported district association. This is a community-normalized mirror, not a direct Ministry export."
        }]
    dataset_dates = {name: asset["name"].split(".")[1] for name, asset in selected.items()}
    output = {
        "schemaVersion": 1,
        "title": "District-wise administrative counts from daily LGD source reports",
        "source": {
            "authority": "Ministry of Panchayati Raj — Local Government Directory",
            "primaryUrl": "https://lgdirectory.gov.in/",
            "publisherUrl": "https://panchayat.gov.in/en/lgd/",
            "mirrorUrl": "https://github.com/ramSeraph/opendata/releases/tag/lgd-parquet-latest",
            "verificationStatus": "official_source_derived_secondary_mirror",
            "datasetReferenceDates": dataset_dates,
            "generatedAt": __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(),
            "method": "Distinct LGD codes aggregated by current district code. Villages count distinct village_code. Gram Panchayats count distinct village-level PRI local_body_code joined to the PRI register type code 3. ULBs count distinct local_body_code in the district coverage report.",
            "limitations": "A reported local body can be associated with more than one district; it is counted in each association. Counts are not treated as zero when no district association is reported. The source is a community mirror of LGD reports and is not a direct Ministry-hosted export."
        },
        "summary": {"districtRecords": len(records), "datasets": list(DATASETS)},
        "records": sorted(records.values(), key=lambda x: (x["stateName"] or "", x["districtName"] or "", x["lgdCode"]))
    }
    OUT.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"output": str(OUT), "districtRecords": len(records), "datasetReferenceDates": dataset_dates}, indent=2))

if __name__ == "__main__":
    main()
