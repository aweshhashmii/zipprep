#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const read = (file) => JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
const expected = {
  state: [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
    'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
    'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu',
    'Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
  ],
  union_territory: [
    'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
    'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
  ]
};
const categoryGroups = {
  physicalGeography: ['mountainRanges','peaks','passes','plateaus','plains','rivers','tributaries','riverBasins','lakes','glacialLakes','wetlands','dams','reservoirs','waterfalls','soilTypes','climate','coastalFeatures','islands','geology','waterBodies'],
  environmentBiodiversity: ['nationalParks','wildlifeSanctuaries','tigerReserves','elephantReserves','biosphereReserves','ramsarSites','conservationReserves','communityReserves','marineProtectedAreas','forestCover','ecosystems','floraFauna','endangeredSpecies','conservationProjects','environmentalChallenges','disasterProneRegions'],
  economyInfrastructure: ['crops','horticulture','minerals','industries','industrialCorridors','powerPlants','renewableEnergyProjects','irrigationProjects','highways','railways','airports','ports','waterways','institutions','economicCentres','tourism','riverValleyProjects'],
  historyCultureHeritage: ['ancientKingdoms','medievalKingdoms','modernHistory','freedomMovement','archaeologicalSites','unescoWorldHeritage','monuments','festivals','folkDances','classicalDances','music','languages','literature','giProducts','handicrafts','tribalCommunities','religiousHeritage','historicalPersonalities','culturalHighlights']
};
const errors = [];
const warnings = [];
const regionsData = read('data/explore-india-regions.json');
const politicalData = read('data/region-political-2026.json');
const heritageData = read('data/region-unesco-heritage-2026.json');
const censusData = read('data/india-district-census-2011.json');
const geo = read('data/india-states-36.geojson');
const regions = regionsData.regions || [];

function assert(condition, message) { if (!condition) errors.push(message); }
function list(value) { return Array.isArray(value) ? value : (value ? [value] : []); }
function normalized(value) { return String(value || '').trim().toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,''); }

assert(regions.length === 36, 'Regional catalogue must contain exactly 36 regions.');
assert(regions.filter(r => r.regionType === 'state').length === 28, 'Regional catalogue must contain exactly 28 states.');
assert(regions.filter(r => r.regionType === 'union_territory').length === 8, 'Regional catalogue must contain exactly 8 Union Territories.');

const expectedNames = [...expected.state, ...expected.union_territory];
const regionNames = regions.map(r => r.name);
const regionSet = new Set(regionNames);
assert(regionSet.size === 36, 'Regional catalogue contains duplicate region names.');
for (const name of expectedNames) assert(regionSet.has(name), 'Missing expected region: ' + name);
for (const name of regionNames) assert(expectedNames.includes(name), 'Unexpected region: ' + name);

const politicalRows = politicalData.records || [];
const politicalByName = new Map();
for (const row of politicalRows) {
  if (politicalByName.has(row.regionName)) errors.push('Duplicate ECI political row: ' + row.regionName);
  politicalByName.set(row.regionName, row);
  if (![row.lokSabhaSeats,row.rajyaSabhaSeats,row.assemblySeats].every(Number.isInteger)) {
    errors.push('Invalid/missing ECI seat count for ' + row.regionName);
  }
  if (!row.sourceUrl || !row.sourceUrl.startsWith('https://www.eci.gov.in/')) {
    errors.push('Political row lacks official ECI source URL: ' + row.regionName);
  }
}
assert(politicalRows.length === 36, 'ECI political dataset must contain 36 rows.');
for (const name of expectedNames) assert(politicalByName.has(name), 'Missing ECI political row: ' + name);

const heritageRows = heritageData.records || [];
const heritageKeys = new Set();
for (const row of heritageRows) {
  const key = normalized(row.regionName) + '|' + normalized(row.name);
  if (heritageKeys.has(key)) errors.push('Duplicate UNESCO property: ' + row.regionName + ' / ' + row.name);
  heritageKeys.add(key);
  if (!row.name || !row.regionName || !row.inscriptionYear || !row.sourceUrl || !row.sourceUrl.startsWith('https://whc.unesco.org/')) {
    errors.push('Incomplete or non-UNESCO source record in UNESCO dataset: ' + JSON.stringify(row));
  }
  if (!regionSet.has(row.regionName)) errors.push('UNESCO row refers to unknown region: ' + row.regionName);
}

let sourceCheckedRecords = 0;
let unsourcedRecords = 0;
let districtProfileRegions = 0;
const coverage = {};
for (const [group, keys] of Object.entries(categoryGroups)) {
  coverage[group] = {};
  for (const key of keys) {
    const regionsWithData = regions.filter(r => list((r.geography || {})[key]).length > 0).length;
    const recordCount = regions.reduce((sum,r) => sum + list((r.geography || {})[key]).length, 0);
    coverage[group][key] = { regionsWithData, recordCount };
  }
}
for (const region of regions) {
  if (region.districts && Array.isArray(region.districts.records) && region.districts.records.length) districtProfileRegions++;
  for (const [category, value] of Object.entries(region.geography || {})) {
    for (const record of list(value)) {
      sourceCheckedRecords++;
      if (!record || !(record.sourceUrl || record.sourceId)) unsourcedRecords++;
      if (record && record.sourceUrl && !/^https:\/\//i.test(record.sourceUrl)) {
        errors.push('Non-HTTPS source URL in ' + region.name + ' / ' + category);
      }
    }
  }
}
assert(unsourcedRecords === 0, unsourcedRecords + ' existing geography records lack a source URL/source ID.');
if (districtProfileRegions < 36) warnings.push('Only ' + districtProfileRegions + '/36 regions currently have imported district profile records; map polygons are not a substitute for verified district facts.');
if (heritageRows.length) {
  const heritageRegions = new Set(heritageRows.map(r => r.regionName)).size;
  warnings.push('UNESCO dataset currently contains ' + heritageRows.length + ' named properties across ' + heritageRegions + '/36 regions; this is not a complete heritage inventory.');
}
const censusVerification = censusData.source && censusData.source.verificationStatus;
if (censusVerification !== 'officially_verified') {
  warnings.push('Census 2011 district file is not marked officially verified. Its values must remain hidden or visibly provisional until cross-checked against Census of India primary tables.');
}
const missingCategories = Object.entries(coverage).flatMap(([group, items]) =>
  Object.entries(items).filter(([,v]) => v.recordCount === 0).map(([key]) => group + '.' + key)
);
warnings.push(missingCategories.length + ' taxonomy categories currently have no imported records. Empty categories must remain explicitly pending, not be filled with estimates.');

const geoFeatures = geo.features || [];
assert(geoFeatures.length === 36, 'India state/UT GeoJSON must contain exactly 36 features.');
const geoNames = geoFeatures.map(f => {
  const p = f.properties || {};
  return p.name || p.STATE || p.shapeName || p.NAME_1 || p.stname || '';
});
assert(geoNames.every(Boolean), 'One or more state/UT GeoJSON features have no readable name.');
assert(new Set(geoNames.map(normalized)).size === 36, 'State/UT GeoJSON contains duplicate or unrecognised names.');

const report = {
  generatedAt: new Date().toISOString(),
  status: errors.length ? 'failed' : (warnings.length ? 'passed_with_warnings' : 'passed'),
  coverage: {
    states: regions.filter(r => r.regionType === 'state').length,
    unionTerritories: regions.filter(r => r.regionType === 'union_territory').length,
    totalRegions: regions.length,
    mapFeatures: geoFeatures.length,
    sourceAttributedGeographyRecords: sourceCheckedRecords - unsourcedRecords,
    unsourcedGeographyRecords: unsourcedRecords,
    eciSeatRows: politicalRows.length,
    unescoProperties: heritageRows.length,
    unescoRegions: new Set(heritageRows.map(r => r.regionName)).size,
    regionsWithDistrictProfiles: districtProfileRegions
  },
  categories: coverage,
  warnings,
  errors
};
fs.writeFileSync('regional-data-audit.json', JSON.stringify(report, null, 2) + '\n');
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## ZipPrep regional data audit',
    '',
    '- Status: **' + report.status + '**',
    '- Regions: **' + report.coverage.totalRegions + '/36** (28 states, 8 UTs)',
    '- State/UT map features: **' + report.coverage.mapFeatures + '/36**',
    '- Source-attributed geography records: **' + report.coverage.sourceAttributedGeographyRecords + '**',
    '- ECI seat rows: **' + report.coverage.eciSeatRows + '/36**',
    '- UNESCO named properties: **' + report.coverage.unescoProperties + '**',
    '- Regions with imported district profiles: **' + report.coverage.regionsWithDistrictProfiles + '/36**',
    '',
    '### Warnings',
    ...warnings.map(w => '- ' + w),
    '',
    '### Errors',
    ...(errors.length ? errors.map(e => '- ' + e) : ['- None'])
  ];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
}
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exit(1);
