#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const UPSTREAM = 'https://raw.githubusercontent.com/shrinivas-sn/india-lgd-index-api/main/backend/data/';
const REGISTRY_FILE = path.join(ROOT, 'data/source-registry.json');
const OUTPUT_FILE = path.join(ROOT, 'data/india-lgd-administrative-2026.json');
const EXPECTED_STATE_TYPES = { state: 28, union_territory: 8 };

async function readRemote(file) {
  const response = await fetch(UPSTREAM + file, {
    headers: { 'User-Agent': 'ZipPrep-LGD-refresh/1.0', 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error('Unable to download ' + file + ': HTTP ' + response.status);
  return response.json();
}
function values(input, label) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error(label + ' must be a JSON object keyed by row index.');
  }
  return Object.values(input);
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
function main() {
  return Promise.all([
    readRemote('states.json'),
    readRemote('districts.json'),
    readRemote('meta.json')
  ]).then(([statesRaw, districtsRaw, meta]) => {
    const states = values(statesRaw, 'LGD states');
    const districts = values(districtsRaw, 'LGD districts');

    assert(meta && meta.source === 'Ministry of Panchayati Raj — Local Government Directory',
      'Unexpected LGD metadata source.');
    assert(typeof meta.source_date === 'string' && /^\d{1,2}[A-Za-z]{3}\d{4}$/.test(meta.source_date),
      'LGD source_date is missing or malformed.');
    const sourceTimestamp = Date.parse(meta.source_date.replace(/^(\d{1,2})([A-Za-z]{3})(\d{4})$/, '$1 $2 $3 UTC'));
    assert(Number.isFinite(sourceTimestamp), 'LGD source_date could not be parsed.');
    const sourceAgeDays = (Date.now() - sourceTimestamp) / 86400000;
    assert(sourceAgeDays >= -1 && sourceAgeDays <= 45,
      'LGD snapshot is outside the 45-day freshness window: ' + meta.source_date + '.');

    assert(states.length === 36, 'Expected 36 LGD states/UTs; received ' + states.length + '.');
    assert(states.filter(x => x.type === 'S').length === EXPECTED_STATE_TYPES.state,
      'LGD state classification does not reconcile to 28 states.');
    assert(states.filter(x => x.type === 'U').length === EXPECTED_STATE_TYPES.union_territory,
      'LGD state classification does not reconcile to 8 UTs.');
    assert(districts.length > 600, 'LGD district snapshot unexpectedly small: ' + districts.length + '.');

    const stateCodes = new Set(states.map(x => String(x.code)));
    assert(stateCodes.size === states.length, 'Duplicate LGD state code detected.');
    const districtCodes = new Set();
    for (const state of states) {
      assert(state.code && state.name, 'LGD state row missing code or name.');
      assert(stateCodes.has(String(state.code)), 'Duplicate LGD state code: ' + state.code);
    }
    for (const district of districts) {
      const code = String(district.code || '');
      assert(code && district.name, 'LGD district row missing code or name.');
      assert(!districtCodes.has(code), 'Duplicate LGD district code: ' + code);
      districtCodes.add(code);
      assert(stateCodes.has(String(district.state_code)),
        'LGD district refers to unknown state code: ' + district.name + ' / ' + district.state_code);
    }

    const source = {
      authority: 'Ministry of Panchayati Raj — Local Government Directory',
      primaryUrl: 'https://lgdirectory.gov.in/',
      officialCrossCheckUrl: 'https://www.dilrmp.gov.in/dilrmpold/dashboard/district-list-dashboard',
      mirrorRepository: 'https://github.com/ramSeraph/opendata',
      mirrorApiRepository: 'https://github.com/shrinivas-sn/india-lgd-index-api',
      license: 'Government Open Data License - India (GODL-India)',
      sourceDate: meta.source_date,
      ingestedAt: meta.ingested_at,
      snapshotArchive: meta.source_assets && meta.source_assets.districts && meta.source_assets.districts.name,
      snapshotArchiveUrl: meta.source_assets && meta.source_assets.districts && meta.source_assets.districts.url,
      snapshotSha256: meta.source_assets && meta.source_assets.districts && meta.source_assets.districts.sha256
    };
    const output = {
      schemaVersion: '1.0.0',
      title: 'India current administrative hierarchy — LGD states and districts',
      description: 'Current LGD state/UT and district directory snapshot. Provides official LGD identifiers and current administrative names; it is not a substitute for district boundary geometry or district statistical profiles.',
      source,
      counts: { states: states.length, districts: districts.length },
      states: states.map(x => ({
        lgdCode: String(x.code),
        name: x.name,
        localName: x.name_local || null,
        type: x.type === 'S' ? 'state' : 'union_territory',
        census2001StateCode: x.census_2001_code || null,
        census2011StateCode: x.census_2011_code || null
      })),
      districts: districts.map(x => ({
        lgdCode: String(x.code),
        name: x.name,
        stateLgdCode: String(x.state_code)
      }))
    };

    const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf8'));
    const entry = (registry.sources || []).find(x => x.id === 'lgdCurrentDistrictDirectory2026');
    assert(entry, 'LGD source registry entry not found.');
    entry.snapshotDate = source.sourceDate;
    entry.ingestedAt = source.ingestedAt;
    entry.archive = source.snapshotArchive;
    entry.archiveSha256 = source.snapshotSha256;
    entry.license = source.license;

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n');
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2) + '\n');
    process.stdout.write(JSON.stringify({
      status: 'refreshed',
      sourceDate: source.sourceDate,
      states: states.length,
      districts: districts.length,
      archive: source.snapshotArchive,
      archiveSha256: source.snapshotSha256
    }, null, 2) + '\n');
  });
}

main().catch(error => {
  process.stderr.write('LGD refresh failed: ' + error.message + '\n');
  process.exitCode = 1;
});
