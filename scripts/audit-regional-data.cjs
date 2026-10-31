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
const supplementalData = read('data/region-supplemental-categories-2026.json');
const politicalData = read('data/region-political-2026.json');
const heritageData = read('data/region-unesco-heritage-2026.json');
const censusData = read('data/india-district-census-2011.json');
const districtProfileData = read('data/district-profiles-2026.json');
const lgdData = read('data/india-lgd-administrative-2026.json');
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



const districtProfileRows = districtProfileData.records || [];
const districtProfileCodes = new Set();
const allowedVerification = new Set(['verified','verification_pending','not_available']);
for (const row of districtProfileRows) {
  assert(row.lgdCode && row.name && row.stateLgdCode, 'District profile missing current LGD identity.');
  assert(!districtProfileCodes.has(row.lgdCode), 'Duplicate district profile LGD code: ' + row.lgdCode);
  districtProfileCodes.add(row.lgdCode);
  assert(allowedVerification.has(row.verificationStatus), 'Invalid district profile verification status: ' + row.name);
  assert(Array.isArray(row.sourceRecords) && row.sourceRecords.length > 0, 'District profile has no source records: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row[field] !== null && row[field] !== undefined && row[field] !== '', 'Verified district field is empty: ' + row.name + '.' + field);
    assert(row.sourceRecords.some(source => source.field === field && source.sourceUrl && source.sourceUrl.startsWith('https://')),
      'Verified district field lacks a field-specific HTTPS source: ' + row.name + '.' + field);
  }
}
const lgdStates = lgdData.states || [];
const lgdDistricts = lgdData.districts || [];
assert(lgdStates.length === 36, 'LGD snapshot must contain 36 states/UTs.');
assert(lgdStates.filter(x => x.type === 'state').length === 28, 'LGD snapshot must contain 28 states.');
assert(lgdStates.filter(x => x.type === 'union_territory').length === 8, 'LGD snapshot must contain 8 Union Territories.');
assert(lgdData.counts && lgdData.counts.states === lgdStates.length, 'LGD state count metadata does not match state rows.');
assert(lgdData.counts && lgdData.counts.districts === lgdDistricts.length, 'LGD district count metadata does not match district rows.');
assert(new Set(lgdStates.map(x => x.lgdCode)).size === 36, 'LGD state codes must be unique.');
assert(new Set(lgdDistricts.map(x => x.lgdCode)).size === lgdDistricts.length, 'LGD district codes must be unique.');
for (const state of lgdStates) {
  assert(expectedNames.some(name => normalized(name) === normalized(state.name) || (name === 'Delhi' && normalized(state.name) === 'nctofdelhi') || (name === 'Dadra and Nagar Haveli and Daman and Diu' && normalized(state.name) === 'thedadraandnagarhavelianddamananddiu')), 'LGD contains unexpected state/UT name: ' + state.name);
  assert(['state','union_territory'].includes(state.type), 'Invalid LGD state type: ' + state.name);
}
for (const profile of districtProfileRows) {
  assert(lgdDistricts.some(d => d.lgdCode === profile.lgdCode && d.stateLgdCode === profile.stateLgdCode), 'District profile does not match a current LGD district identity: ' + profile.name);
}
for (const district of lgdDistricts) {
  assert(lgdStates.some(state => state.lgdCode === district.stateLgdCode), 'District has unknown LGD state code: ' + district.name + ' / ' + district.stateLgdCode);
  assert(district.lgdCode && district.name, 'LGD district missing code or name.');
}
const lgdDistrictCounts = Object.fromEntries(lgdStates.map(state => [state.name, lgdDistricts.filter(d => d.stateLgdCode === state.lgdCode).length]));

const lgdStateByNormalizedName = new Map(lgdStates.map(state => [normalized(state.name).replace(/^the/,''), state]));
const regionLgdCounts = {};
for (const region of regions) {
  const state = lgdStateByNormalizedName.get(normalized(region.name).replace(/^the/,''));
  assert(!!state, 'Regional catalogue region does not map to an LGD state: ' + region.name);
  if (state) {
    const count = lgdDistricts.filter(d => d.stateLgdCode === state.lgdCode).length;
    assert(count > 0, 'No LGD districts mapped to region: ' + region.name);
    assert(region.administration && region.administration.districtCount === count, 'Regional catalogue LGD district count does not match snapshot: ' + region.name);
    regionLgdCounts[region.name] = count;
  }
}

warnings.push('Current LGD district snapshot date: ' + (lgdData.source && lgdData.source.sourceDate || 'unknown') + '; verify against live LGD/DILRMP before each release.');
if (districtProfileRows.length < lgdDistricts.length) warnings.push((lgdDistricts.length - districtProfileRows.length) + ' current LGD districts still lack an imported district profile record; directory presence does not imply a complete district profile.');
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

const politicalTotals = politicalRows.reduce((sum,row) => ({
  lokSabha: sum.lokSabha + row.lokSabhaSeats,
  rajyaSabha: sum.rajyaSabha + row.rajyaSabhaSeats,
  assembly: sum.assembly + row.assemblySeats
}), {lokSabha:0,rajyaSabha:0,assembly:0});
assert(politicalTotals.lokSabha === 543, 'ECI Lok Sabha elected-seat total must equal 543.');
assert(politicalTotals.rajyaSabha === 233, 'ECI elected Rajya Sabha-seat total must equal 233 (nominated members excluded).');
assert(politicalTotals.assembly === 4123, 'ECI state/UT Legislative Assembly-seat total must equal 4,123.');

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

let sourceCheckedRecords = (supplementalData.records || []).length;
let unsourcedRecords = 0;
let districtProfileRegions = 0;
const coverage = {};
for (const [group, keys] of Object.entries(categoryGroups)) {
  coverage[group] = {};
  for (const key of keys) {
    const categoryRecords = (region) => {
      const base = key === 'languages' && !list((region.geography || {})[key]).length ? list(region.officialLanguages) : list((region.geography || {})[key]);
      const extra = (supplementalData.records || []).filter(row => row.regionName === region.name && row.category === key);
      return base.concat(extra);
    };
    const regionsWithData = regions.filter(r => categoryRecords(r).length > 0).length;
    const recordCount = regions.reduce((sum,r) => sum + categoryRecords(r).length, 0);
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

const censusRows = censusData.records || [];
const censusTotals = censusRows.reduce((sum,row) => ({
  population: sum.population + (Number(row.population)||0),
  male: sum.male + (Number(row.male)||0),
  female: sum.female + (Number(row.female)||0),
  literate: sum.literate + (Number(row.literate)||0),
  sc: sum.sc + (Number(row.sc)||0),
  st: sum.st + (Number(row.st)||0)
}), {population:0,male:0,female:0,literate:0,sc:0,st:0});
assert(censusRows.length === 640, 'Census 2011 district mirror expected 640 historical district rows; review if the source edition changes.');
assert(censusTotals.population === 1210854977, 'Census 2011 district rows do not reconcile to the official national population total.');
assert(censusTotals.male === 623270258 && censusTotals.female === 587584719, 'Census 2011 male/female totals do not reconcile.');
assert(censusTotals.male + censusTotals.female === censusTotals.population, 'Census 2011 sex totals do not equal total population.');
assert(censusTotals.st === 104545716, 'Census 2011 Scheduled Tribe total does not reconcile.');
assert(censusTotals.literate === 763638812, 'Census 2011 literate population total does not reconcile.');
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
    lgdStateRows: lgdStates.length,
    lgdDistrictRows: lgdDistricts.length,
    districtProfilesImported: districtProfileRows.length,
    districtProfilesWithVerifiedFields: districtProfileRows.filter(row => (row.verifiedFields || []).length > 0).length,
    regionsWithLGDDistrictDirectory: Object.keys(regionLgdCounts).length,
    lgdDistrictCounts,

    regionLgdCounts,
    eciSeatTotals: politicalTotals,
    census2011Rows: censusRows.length,
    census2011Aggregate: censusTotals,
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
    '- Current LGD districts: **' + report.coverage.lgdDistrictRows + '** across **' + report.coverage.regionsWithLGDDistrictDirectory + '/36** regions',
    '- District profile records: **' + report.coverage.districtProfilesImported + '** (' + report.coverage.districtProfilesWithVerifiedFields + ' with at least one verified field)',
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
