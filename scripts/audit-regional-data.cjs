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
const supplementalBatchData = read('data/region-supplemental-categories-batch-2026-10-31.json');
const protectedAreaStatsData = read('data/region-protected-area-statistics-2024.json');
const forestCoverStatsData = read('data/region-forest-cover-isfr2023.json');
const allSupplementalRecords = [...(supplementalData.records || []), ...(supplementalBatchData.records || []), ...(protectedAreaStatsData.records || []), ...(forestCoverStatsData.records || [])];
const allSupplementalSources = [...(supplementalData.sources || []), ...(supplementalBatchData.sources || []), ...(protectedAreaStatsData.source ? [protectedAreaStatsData.source] : []), ...(forestCoverStatsData.source ? [forestCoverStatsData.source] : [])];
const giData = read('data/region-gi-2026.json');
const sourceRegistry = read('data/source-registry.json');
const politicalData = read('data/region-political-2026.json');
const heritageData = read('data/region-unesco-heritage-2026.json');
const censusData = read('data/india-district-census-2011.json');
const districtProfileData = read('data/district-profiles-2026.json');
const districtProfileBatchData = read('data/district-profile-enrichment-batch-2026-10-31.json');
const districtProfileBiharData = read('data/district-profile-isfr2023-bihar.json');
const districtProfileAssamData = read('data/district-profile-isfr2023-assam.json');
const districtProfileChhattisgarhData = read('data/district-profile-isfr2023-chhattisgarh.json');
const districtProfileMadhyaPradeshData = read('data/district-profile-isfr2023-madhya-pradesh.json');
const districtProfileOdishaData = read('data/district-profile-isfr2023-odisha.json');
const districtProfileMaharashtraData = read('data/district-profile-isfr2023-maharashtra.json');
const districtProfileUttarPradeshData = read('data/district-profile-isfr2023-uttar-pradesh.json');
const districtProfileJharkhandData = read('data/district-profile-isfr2023-jharkhand.json');
const districtProfileGujaratData = read('data/district-profile-isfr2023-gujarat.json');
const districtProfileKarnatakaData = read('data/district-profile-isfr2023-karnataka.json');
const districtProfileKeralaData = read('data/district-profile-isfr2023-kerala.json');
const districtProfileUttarakhandData = read('data/district-profile-isfr2023-uttarakhand.json');
const districtProfileHimachalPradeshData = read('data/district-profile-isfr2023-himachal-pradesh.json');
const districtProfilePunjabData = read('data/district-profile-isfr2023-punjab.json');
const districtProfileHaryanaData = read('data/district-profile-isfr2023-haryana.json');
const districtProfileTamilNaduData = read('data/district-profile-isfr2023-tamil-nadu.json');
const districtProfileTelanganaData = read('data/district-profile-isfr2023-telangana.json');
const districtProfileGoaData = read('data/district-profile-isfr2023-goa.json');
const districtProfileTripuraData = read('data/district-profile-isfr2023-tripura.json');
const districtProfileMeghalayaData = read('data/district-profile-isfr2023-meghalaya.json');
const districtProfileMizoramData = read('data/district-profile-isfr2023-mizoram.json');
const lgdData = read('data/india-lgd-administrative-2026.json');
const urbanLgdMirrorData = read('data/urban-local-bodies-lgd-mirror-2026-09-25.json');
const officeholderData = read('data/region-officeholders-official-partial-2026-11-01.json');
const districtHierarchyData = read('data/district-lgd-administrative-hierarchy-2026-10-21.json');
const boundaryMetadataData = read('data/region-boundary-metadata-soi-2025.json');
const districtPortalDirectoryData = read('data/region-district-portal-directories-igod-2026.json');
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

const allowedSupplementalCategories = new Set(Object.values(categoryGroups).flat());
const supplementalSourceIds = new Set(allSupplementalSources.map(source => source.sourceId));
const supplementalIds = new Set();
for (const row of allSupplementalRecords) {
  assert(row.id && !supplementalIds.has(row.id), 'Supplemental record has missing or duplicate ID: ' + (row.id || '(missing)'));
  supplementalIds.add(row.id);
  assert(regionSet.has(row.regionName), 'Supplemental record references unknown region: ' + row.regionName);
  assert(allowedSupplementalCategories.has(row.category), 'Supplemental record uses unknown category: ' + row.category);
  assert(row.name && row.description, 'Supplemental record is missing a name or description: ' + (row.id || '(missing)'));
  assert(row.sourceUrl && /^https:\/\//i.test(row.sourceUrl), 'Supplemental record lacks an HTTPS source URL: ' + (row.id || row.name));
  assert(row.sourceId && supplementalSourceIds.has(row.sourceId), 'Supplemental record references an unregistered source: ' + (row.id || row.name));
  assert(['verified','verification_pending','not_available'].includes(row.verificationStatus), 'Supplemental record has invalid verification status: ' + (row.id || row.name));
}



const giSourceIds = new Set((sourceRegistry.sources || []).map(source => source.id));
const giKeys = new Set();
const giRegions = new Set();
for (const row of giData.records || []) {
  const key = normalized(row.regionName) + '|' + normalized(row.name);
  assert(regionSet.has(row.regionName), 'GI record references unknown region: ' + row.regionName);
  assert(row.name && row.applicationNo && row.registrationStatus === 'Registered', 'GI record lacks registered-product details: ' + (row.name || '(missing)'));
  assert(row.sourceId === 'ipindiaStatewiseRegisteredGI2026' && giSourceIds.has(row.sourceId), 'GI record references an unregistered source: ' + (row.name || '(missing)'));
  assert(row.sourceUrl === giData.source.sourceUrl && /^https:\/\//i.test(row.sourceUrl), 'GI record source URL does not match the registered Part A source: ' + (row.name || '(missing)'));
  assert(row.referenceDate && row.lastVerifiedAt, 'GI record lacks reference or verification date: ' + (row.name || '(missing)'));
  assert(!giKeys.has(key), 'Duplicate GI record for region: ' + row.regionName + ' / ' + row.name);
  giKeys.add(key);
  giRegions.add(row.regionName);
}
const giCoverageRegions = new Set();
for (const row of giData.coverageRecords || []) {
  assert(regionSet.has(row.regionName), 'GI coverage record references unknown region: ' + row.regionName);
  assert(!giRegions.has(row.regionName), 'GI coverage record overlaps a region with registered GI products: ' + row.regionName);
  assert(!giCoverageRegions.has(row.regionName), 'Duplicate GI coverage record: ' + row.regionName);
  assert(row.verificationStatus === 'not_available', 'GI negative coverage note must remain scope-limited: ' + row.regionName);
  assert(row.sourceId === 'ipindiaStatewiseRegisteredGI2026' && giSourceIds.has(row.sourceId), 'GI coverage note references an unregistered source: ' + row.regionName);
  assert(row.sourceUrl === giData.source.sourceUrl && /^https:\/\//i.test(row.sourceUrl), 'GI coverage note source URL mismatch: ' + row.regionName);
  assert(row.referenceDate === '2025-12-31' && row.lastVerifiedAt, 'GI coverage note must preserve its 31 Dec 2025 snapshot date: ' + row.regionName);
  if (row.applicationStatusSourceUrl) assert(/^https:\/\//i.test(row.applicationStatusSourceUrl), 'GI application status source must use HTTPS: ' + row.regionName);
  giCoverageRegions.add(row.regionName);
}
assert(giRegions.size + giCoverageRegions.size === 36, 'GI registered-product and scope-limited coverage records must cover all 36 regions.');
warnings.push('GI register coverage now spans 36/36 regions; no-registration notes for Chandigarh and Lakshadweep are limited to the official register snapshot dated 31 December 2025.');


const districtProfileRows = districtProfileData.records || [];
for (const batchRow of [...(districtProfileBatchData.records || []), ...(districtProfileBiharData.records || []), ...(districtProfileAssamData.records || []), ...(districtProfileChhattisgarhData.records || []), ...(districtProfileMadhyaPradeshData.records || []), ...(districtProfileOdishaData.records || []), ...(districtProfileMaharashtraData.records || []), ...(districtProfileUttarPradeshData.records || []), ...(districtProfileJharkhandData.records || []), ...(districtProfileGujaratData.records || []), ...(districtProfileKarnatakaData.records || []), ...(districtProfileKeralaData.records || []), ...(districtProfileUttarakhandData.records || []), ...(districtProfileHimachalPradeshData.records || []), ...(districtProfilePunjabData.records || []), ...(districtProfileHaryanaData.records || []), ...(districtProfileTamilNaduData.records || []), ...(districtProfileTelanganaData.records || []), ...(districtProfileGoaData.records || []), ...(districtProfileTripuraData.records || []), ...(districtProfileMeghalayaData.records || []), ...(districtProfileMizoramData.records || [])]) {
  const existing = districtProfileRows.find(row => String(row.lgdCode) === String(batchRow.lgdCode));
  if (existing) {
    for (const [key, value] of Object.entries(batchRow)) if (key !== 'verifiedFields' && key !== 'sourceRecords') existing[key] = value;
    existing.verifiedFields = [...new Set([...(existing.verifiedFields || []), ...(batchRow.verifiedFields || [])])];
    existing.sourceRecords = [...(existing.sourceRecords || []), ...(batchRow.sourceRecords || [])];
  } else districtProfileRows.push(batchRow);
}
const biharForestRows = districtProfileBiharData.records || [];
assert(biharForestRows.length === 38, 'ISFR 2023 Bihar district forest dataset must contain all 38 Bihar districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileBiharData.source.sourceId),
  'ISFR 2023 Bihar district forest source must be registered.');
const biharForestExpected = {
  forestCoverCalculatedArea2023SqKm: 94163,
  veryDenseForest2023SqKm: 387.00,
  moderatelyDenseForest2023SqKm: 3284.21,
  openForest2023SqKm: 3861.24,
  forestCover2023SqKm: 7532.45,
  forestCoverChangeSince2021SqKm: 129.19,
  scrub2023SqKm: 260.80
};
for (const [field, expectedValue] of Object.entries(biharForestExpected)) {
  const actual = biharForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Bihar ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of biharForestRows) {
  assert(row.stateName === 'Bihar', 'Bihar ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '10'),
    'Bihar ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileBiharData.source.sourceId),
      'Bihar ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const assamForestRows = districtProfileAssamData.records || [];
assert(assamForestRows.length === 33, 'ISFR 2023 Assam district forest dataset must contain all 33 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileAssamData.source.sourceId),
  'ISFR 2023 Assam district forest source must be registered.');
const assamForestExpected = {
  forestCoverCalculatedArea2023SqKm: 78438,
  veryDenseForest2023SqKm: 3189.71,
  moderatelyDenseForest2023SqKm: 9764.54,
  openForest2023SqKm: 15359.30,
  forestCover2023SqKm: 28313.55,
  forestCoverChangeSince2021SqKm: -11.76,
  scrub2023SqKm: 240.93
};
for (const [field, expectedValue] of Object.entries(assamForestExpected)) {
  const actual = assamForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Assam ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of assamForestRows) {
  assert(row.stateName === 'Assam', 'Assam ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '18'),
    'Assam ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileAssamData.source.sourceId),
      'Assam ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!assamForestRows.some(row => ['739','756'].includes(row.lgdCode)),
  'Assam districts omitted from the FSI table must not be assigned inferred forest figures.');
const chhattisgarhForestRows = districtProfileChhattisgarhData.records || [];
assert(chhattisgarhForestRows.length === 28, 'ISFR 2023 Chhattisgarh district forest dataset must contain all 28 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileChhattisgarhData.source.sourceId),
  'ISFR 2023 Chhattisgarh district forest source must be registered.');
const chhattisgarhForestExpected = {
  forestCoverCalculatedArea2023SqKm: 135192,
  veryDenseForest2023SqKm: 7416.57,
  moderatelyDenseForest2023SqKm: 31983.80,
  openForest2023SqKm: 16411.38,
  forestCover2023SqKm: 55811.75,
  forestCoverChangeSince2021SqKm: 2.91,
  scrub2023SqKm: 610.41
};
for (const [field, expectedValue] of Object.entries(chhattisgarhForestExpected)) {
  const actual = chhattisgarhForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Chhattisgarh ISFR 2023 district row sum does not match transcribed rows for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
assert(districtProfileChhattisgarhData.totals.publishedGrandTotalChange === -19.13,
  'Chhattisgarh ISFR source discrepancy note must retain the printed state grand total.');
for (const row of chhattisgarhForestRows) {
  assert(row.stateName === 'Chhattisgarh', 'Chhattisgarh ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '22'),
    'Chhattisgarh ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileChhattisgarhData.source.sourceId),
      'Chhattisgarh ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!chhattisgarhForestRows.some(row => ['759','760','761','762','763'].includes(row.lgdCode)),
  'Chhattisgarh districts omitted from the FSI table must not be assigned inferred forest figures.');
const madhyaPradeshForestRows = districtProfileMadhyaPradeshData.records || [];
assert(madhyaPradeshForestRows.length === 52, 'ISFR 2023 Madhya Pradesh district forest dataset must contain all 52 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileMadhyaPradeshData.source.sourceId),
  'ISFR 2023 Madhya Pradesh district forest source must be registered.');
const madhyaPradeshForestExpected = {
  forestCoverCalculatedArea2023SqKm: 308252.11,
  veryDenseForest2023SqKm: 7021.31,
  moderatelyDenseForest2023SqKm: 33508.64,
  openForest2023SqKm: 36543.49,
  forestCover2023SqKm: 77073.44,
  forestCoverChangeSince2021SqKm: -371.54,
  scrub2023SqKm: 3124.20
};
for (const [field, expectedValue] of Object.entries(madhyaPradeshForestExpected)) {
  const actual = madhyaPradeshForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Madhya Pradesh ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of madhyaPradeshForestRows) {
  assert(row.stateName === 'Madhya Pradesh', 'Madhya Pradesh ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '23'),
    'Madhya Pradesh ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileMadhyaPradeshData.source.sourceId),
      'Madhya Pradesh ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!madhyaPradeshForestRows.some(row => ['784','766','785'].includes(row.lgdCode)),
  'Madhya Pradesh districts omitted from the FSI table must not be assigned inferred forest figures.');
const odishaForestRows = districtProfileOdishaData.records || [];
assert(odishaForestRows.length === 30, 'ISFR 2023 Odisha district forest dataset must contain all 30 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileOdishaData.source.sourceId),
  'ISFR 2023 Odisha district forest source must be registered.');
const odishaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 155707,
  veryDenseForest2023SqKm: 7224.42,
  moderatelyDenseForest2023SqKm: 21065.55,
  openForest2023SqKm: 24143.59,
  forestCover2023SqKm: 52433.56,
  forestCoverChangeSince2021SqKm: 151.89,
  scrub2023SqKm: 4632.68
};
for (const [field, expectedValue] of Object.entries(odishaForestExpected)) {
  const actual = odishaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Odisha ISFR 2023 district row sum does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of odishaForestRows) {
  assert(row.stateName === 'Odisha', 'Odisha ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '21'),
    'Odisha ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileOdishaData.source.sourceId),
      'Odisha ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const maharashtraForestRows = districtProfileMaharashtraData.records || [];
assert(maharashtraForestRows.length === 36, 'ISFR 2023 Maharashtra district forest dataset must contain all 36 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileMaharashtraData.source.sourceId),
  'ISFR 2023 Maharashtra district forest source must be registered.');
const maharashtraForestExpected = {
  forestCoverCalculatedArea2023SqKm: 307713,
  veryDenseForest2023SqKm: 9865.62,
  moderatelyDenseForest2023SqKm: 21577.79,
  openForest2023SqKm: 19415.12,
  forestCover2023SqKm: 50858.53,
  forestCoverChangeSince2021SqKm: -54.47,
  scrub2023SqKm: 3645.67
};
for (const [field, expectedValue] of Object.entries(maharashtraForestExpected)) {
  const actual = maharashtraForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Maharashtra ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of maharashtraForestRows) {
  assert(row.stateName === 'Maharashtra', 'Maharashtra ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '27'),
    'Maharashtra ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileMaharashtraData.source.sourceId),
      'Maharashtra ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const uttarPradeshForestRows = districtProfileUttarPradeshData.records || [];
assert(uttarPradeshForestRows.length === 75, 'ISFR 2023 Uttar Pradesh district forest dataset must contain all 75 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileUttarPradeshData.source.sourceId),
  'ISFR 2023 Uttar Pradesh district forest source must be registered.');
const uttarPradeshForestExpected = {
  forestCoverCalculatedArea2023SqKm: 240927.56,
  veryDenseForest2023SqKm: 2688.73,
  moderatelyDenseForest2023SqKm: 4001.41,
  openForest2023SqKm: 8355.66,
  forestCover2023SqKm: 15045.80,
  forestCoverChangeSince2021SqKm: 118.43,
  scrub2023SqKm: 639.51
};
for (const [field, expectedValue] of Object.entries(uttarPradeshForestExpected)) {
  const actual = uttarPradeshForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Uttar Pradesh ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of uttarPradeshForestRows) {
  assert(row.stateName === 'Uttar Pradesh', 'Uttar Pradesh ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '9'),
    'Uttar Pradesh ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileUttarPradeshData.source.sourceId),
      'Uttar Pradesh ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const jharkhandForestRows = districtProfileJharkhandData.records || [];
assert(jharkhandForestRows.length === 24, 'ISFR 2023 Jharkhand district forest dataset must contain all 24 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileJharkhandData.source.sourceId),
  'ISFR 2023 Jharkhand district forest source must be registered.');
const jharkhandForestExpected = {
  forestCoverCalculatedArea2023SqKm: 79716,
  veryDenseForest2023SqKm: 2635.35,
  moderatelyDenseForest2023SqKm: 9660.99,
  openForest2023SqKm: 11489.44,
  forestCover2023SqKm: 23765.78,
  forestCoverChangeSince2021SqKm: 58.81,
  scrub2023SqKm: 558.32
};
for (const [field, expectedValue] of Object.entries(jharkhandForestExpected)) {
  const actual = jharkhandForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Jharkhand ISFR 2023 district row sum does not match transcribed rows for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
assert(districtProfileJharkhandData.totals.printedGrandTotalMdf === 9640.99,
  'Jharkhand ISFR source discrepancy note must retain the printed MDF state grand total.');
for (const row of jharkhandForestRows) {
  assert(row.stateName === 'Jharkhand', 'Jharkhand ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '20'),
    'Jharkhand ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileJharkhandData.source.sourceId),
      'Jharkhand ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const gujaratForestRows = districtProfileGujaratData.records || [];
assert(gujaratForestRows.length === 33, 'ISFR 2023 Gujarat district forest dataset must contain all 33 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileGujaratData.source.sourceId),
  'ISFR 2023 Gujarat district forest source must be registered.');
const gujaratForestExpected = {
  forestCoverCalculatedArea2023SqKm: 196244,
  veryDenseForest2023SqKm: 419.71,
  moderatelyDenseForest2023SqKm: 4902.20,
  openForest2023SqKm: 9694.73,
  forestCover2023SqKm: 15016.84,
  forestCoverChangeSince2021SqKm: 180.07,
  scrub2023SqKm: 2029.95
};
for (const [field, expectedValue] of Object.entries(gujaratForestExpected)) {
  const actual = gujaratForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Gujarat ISFR 2023 district row sum does not match transcribed rows for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
assert(districtProfileGujaratData.totals.publishedGrandTotalForest === 15016.64,
  'Gujarat ISFR source discrepancy note must retain the printed forest-cover grand total.');
for (const row of gujaratForestRows) {
  assert(row.stateName === 'Gujarat', 'Gujarat ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '24'),
    'Gujarat ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileGujaratData.source.sourceId),
      'Gujarat ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!gujaratForestRows.some(row => row.lgdCode === '789'),
  'Gujarat Vav-Tharad district omitted from the FSI table must not be assigned inferred forest figures.');
const karnatakaForestRows = districtProfileKarnatakaData.records || [];
assert(karnatakaForestRows.length === 29, 'ISFR 2023 Karnataka current-district forest dataset must contain 29 exact current LGD joins.');
assert(districtProfileKarnatakaData.unmappedReportRows.length === 1 &&
  districtProfileKarnatakaData.unmappedReportRows[0].district === 'Ballari',
  'Karnataka report-era Ballari row must be preserved separately as an unmapped boundary aggregate.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileKarnatakaData.source.sourceId),
  'ISFR 2023 Karnataka district forest source must be registered.');
const karnatakaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 183330,
  veryDenseForest2023SqKm: 4537.79,
  moderatelyDenseForest2023SqKm: 21042.65,
  openForest2023SqKm: 12946.21,
  forestCover2023SqKm: 38526.65,
  forestCoverChangeSince2021SqKm: 150.51,
  scrub2023SqKm: 4035.24
};
for (const [field, expectedValue] of Object.entries(karnatakaForestExpected)) {
  const actual = karnatakaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Karnataka mapped ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of karnatakaForestRows) {
  assert(row.stateName === 'Karnataka', 'Karnataka ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '29'),
    'Karnataka ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileKarnatakaData.source.sourceId),
      'Karnataka ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!karnatakaForestRows.some(row => ['528','738'].includes(row.lgdCode)),
  'Report-era Ballari aggregate must not be assigned to current Ballari or Vijayanagara district profiles.');
const keralaForestRows = districtProfileKeralaData.records || [];
assert(keralaForestRows.length === 14, 'ISFR 2023 Kerala district forest dataset must contain all 14 Kerala districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileKeralaData.source.sourceId),
  'ISFR 2023 Kerala district forest source must be registered.');
const keralaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 38852,
  veryDenseForest2023SqKm: 2041.17,
  moderatelyDenseForest2023SqKm: 9321.82,
  openForest2023SqKm: 10696.37,
  forestCover2023SqKm: 22059.36,
  forestCoverChangeSince2021SqKm: 133.42,
  scrub2023SqKm: 21.88
};
for (const [field, expectedValue] of Object.entries(keralaForestExpected)) {
  const actual = keralaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Kerala ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of keralaForestRows) {
  assert(row.stateName === 'Kerala', 'Kerala ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '32'),
    'Kerala ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileKeralaData.source.sourceId),
      'Kerala ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const uttarakhandForestRows = districtProfileUttarakhandData.records || [];
assert(uttarakhandForestRows.length === 13, 'ISFR 2023 Uttarakhand district forest dataset must contain all 13 districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileUttarakhandData.source.sourceId),
  'ISFR 2023 Uttarakhand district forest source must be registered.');
const uttarakhandForestExpected = {
  forestCoverCalculatedArea2023SqKm: 53483.56,
  veryDenseForest2023SqKm: 5266.58,
  moderatelyDenseForest2023SqKm: 12517.63,
  openForest2023SqKm: 6519.62,
  forestCover2023SqKm: 24503.83,
  forestCoverChangeSince2021SqKm: -22.98,
  scrub2023SqKm: 412.88
};
for (const [field, expectedValue] of Object.entries(uttarakhandForestExpected)) {
  const actual = uttarakhandForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Uttarakhand ISFR 2023 district row sum does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
assert(districtProfileUttarakhandData.totals.publishedGrandTotalArea === 53483.36 &&
  districtProfileUttarakhandData.totals.publishedClassTotalForest === 24303.83,
  'Uttarakhand ISFR printed grand totals and row discrepancies must be preserved.');

for (const row of uttarakhandForestRows) {
  assert(row.stateName === 'Uttarakhand', 'Uttarakhand ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '5'),
    'Uttarakhand ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileUttarakhandData.source.sourceId),
      'Uttarakhand ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const himachalPradeshForestRows = districtProfileHimachalPradeshData.records || [];
assert(himachalPradeshForestRows.length === 12, 'ISFR 2023 Himachal Pradesh district forest dataset must contain all 12 districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileHimachalPradeshData.source.sourceId),
  'ISFR 2023 Himachal Pradesh district forest source must be registered.');
const himachalPradeshForestExpected = {
  forestCoverCalculatedArea2023SqKm: 55673,
  veryDenseForest2023SqKm: 3117.60,
  moderatelyDenseForest2023SqKm: 7280.29,
  openForest2023SqKm: 5182.46,
  forestCover2023SqKm: 15580.35,
  forestCoverChangeSince2021SqKm: 54.73,
  scrub2023SqKm: 308.69
};
for (const [field, expectedValue] of Object.entries(himachalPradeshForestExpected)) {
  const actual = himachalPradeshForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Himachal Pradesh ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of himachalPradeshForestRows) {
  assert(row.stateName === 'Himachal Pradesh', 'Himachal Pradesh ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '2'),
    'Himachal Pradesh ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileHimachalPradeshData.source.sourceId),
      'Himachal Pradesh ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const punjabForestRows = districtProfilePunjabData.records || [];
assert(punjabForestRows.length === 22, 'ISFR 2023 Punjab district forest dataset must contain all 22 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfilePunjabData.source.sourceId),
  'ISFR 2023 Punjab district forest source must be registered.');
const punjabForestExpected = {
  forestCoverCalculatedArea2023SqKm: 50362,
  veryDenseForest2023SqKm: 9.44,
  moderatelyDenseForest2023SqKm: 784.89,
  openForest2023SqKm: 1051.76,
  forestCover2023SqKm: 1846.09,
  forestCoverChangeSince2021SqKm: -0.45,
  scrub2023SqKm: 41.61
};
for (const [field, expectedValue] of Object.entries(punjabForestExpected)) {
  const actual = punjabForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Punjab ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of punjabForestRows) {
  assert(row.stateName === 'Punjab', 'Punjab ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '3'),
    'Punjab ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfilePunjabData.source.sourceId),
      'Punjab ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!punjabForestRows.some(row => row.lgdCode === '737'),
  'Malerkotla omitted from the FSI table must not receive inferred forest values.');
const haryanaForestRows = districtProfileHaryanaData.records || [];
assert(haryanaForestRows.length === 22, 'ISFR 2023 Haryana district forest dataset must contain all 22 districts listed in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileHaryanaData.source.sourceId),
  'ISFR 2023 Haryana district forest source must be registered.');
const haryanaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 44212,
  veryDenseForest2023SqKm: 27.17,
  moderatelyDenseForest2023SqKm: 441.18,
  openForest2023SqKm: 1145.91,
  forestCover2023SqKm: 1614.26,
  forestCoverChangeSince2021SqKm: -13.96,
  scrub2023SqKm: 174.38
};
for (const [field, expectedValue] of Object.entries(haryanaForestExpected)) {
  const actual = haryanaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Haryana ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of haryanaForestRows) {
  assert(row.stateName === 'Haryana', 'Haryana ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '6'),
    'Haryana ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileHaryanaData.source.sourceId),
      'Haryana ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!haryanaForestRows.some(row => row.lgdCode === '792'),
  'Hansi omitted from the FSI table must not receive inferred forest values.');
const tamilNaduForestRows = districtProfileTamilNaduData.records || [];
assert(tamilNaduForestRows.length === 38, 'ISFR 2023 Tamil Nadu district forest dataset must contain all 38 districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileTamilNaduData.source.sourceId),
  'ISFR 2023 Tamil Nadu district forest source must be registered.');
const tamilNaduForestExpected = {
  forestCoverCalculatedArea2023SqKm: 130060,
  veryDenseForest2023SqKm: 3586.19,
  moderatelyDenseForest2023SqKm: 11027.03,
  openForest2023SqKm: 11837,
  forestCover2023SqKm: 26450.22,
  forestCoverChangeSince2021SqKm: -60.96,
  scrub2023SqKm: 878.29
};
for (const [field, expectedValue] of Object.entries(tamilNaduForestExpected)) {
  const actual = tamilNaduForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Tamil Nadu ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of tamilNaduForestRows) {
  assert(row.stateName === 'Tamil Nadu', 'Tamil Nadu ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '33'),
    'Tamil Nadu ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileTamilNaduData.source.sourceId),
      'Tamil Nadu ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const telanganaForestRows = districtProfileTelanganaData.records || [];
assert(telanganaForestRows.length === 33, 'ISFR 2023 Telangana district forest dataset must contain all 33 districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileTelanganaData.source.sourceId),
  'ISFR 2023 Telangana district forest source must be registered.');
const telanganaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 112122.44,
  veryDenseForest2023SqKm: 1613.32,
  moderatelyDenseForest2023SqKm: 8909.90,
  openForest2023SqKm: 10655.82,
  forestCover2023SqKm: 21179.04,
  forestCoverChangeSince2021SqKm: -100.42,
  scrub2023SqKm: 2829.88
};
for (const [field, expectedValue] of Object.entries(telanganaForestExpected)) {
  const actual = telanganaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Telangana ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of telanganaForestRows) {
  assert(row.stateName === 'Telangana', 'Telangana ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '36'),
    'Telangana ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileTelanganaData.source.sourceId),
      'Telangana ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const goaForestRows = districtProfileGoaData.records || [];
assert(goaForestRows.length === 2, 'ISFR 2023 Goa district forest dataset must contain both districts in the FSI table.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileGoaData.source.sourceId),
  'ISFR 2023 Goa district forest source must be registered.');
const goaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 3702,
  veryDenseForest2023SqKm: 28.74,
  moderatelyDenseForest2023SqKm: 89.24,
  openForest2023SqKm: 321.25,
  forestCover2023SqKm: 439.23,
  forestCoverChangeSince2021SqKm: -2.16,
  scrub2023SqKm: 10.33
};
for (const [field, expectedValue] of Object.entries(goaForestExpected)) {
  const actual = goaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Goa ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of goaForestRows) {
  assert(row.stateName === 'Goa', 'Goa ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '30'),
    'Goa ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileGoaData.source.sourceId),
      'Goa ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
assert(!goaForestRows.some(row => row.lgdCode === '793'),
  'Kushavati omitted from the FSI 2023 table must not receive inferred forest values.');
const tripuraForestRows = districtProfileTripuraData.records || [];
assert(tripuraForestRows.length === 8, 'ISFR 2023 Tripura district forest dataset must contain all eight districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileTripuraData.source.sourceId),
  'ISFR 2023 Tripura district forest source must be registered.');
const tripuraForestExpected = {
  forestCoverCalculatedArea2023SqKm: 10486,
  veryDenseForest2023SqKm: 614.43,
  moderatelyDenseForest2023SqKm: 4929.99,
  openForest2023SqKm: 2040.35,
  forestCover2023SqKm: 7584.77,
  forestCoverChangeSince2021SqKm: -95.31,
  scrub2023SqKm: 173.27
};
for (const [field, expectedValue] of Object.entries(tripuraForestExpected)) {
  const actual = tripuraForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Tripura ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of tripuraForestRows) {
  assert(row.stateName === 'Tripura', 'Tripura ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '16'),
    'Tripura ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileTripuraData.source.sourceId),
      'Tripura ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const meghalayaForestRows = districtProfileMeghalayaData.records || [];
assert(meghalayaForestRows.length === 12, 'ISFR 2023 Meghalaya district forest dataset must contain all 12 districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileMeghalayaData.source.sourceId),
  'ISFR 2023 Meghalaya district forest source must be registered.');
const meghalayaForestExpected = {
  forestCoverCalculatedArea2023SqKm: 22429,
  veryDenseForest2023SqKm: 594.84,
  moderatelyDenseForest2023SqKm: 9023.81,
  openForest2023SqKm: 7348.19,
  forestCover2023SqKm: 16966.84,
  forestCoverChangeSince2021SqKm: -30,
  scrub2023SqKm: 620.41
};
for (const [field, expectedValue] of Object.entries(meghalayaForestExpected)) {
  const actual = meghalayaForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Meghalaya ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of meghalayaForestRows) {
  assert(row.stateName === 'Meghalaya', 'Meghalaya ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '17'),
    'Meghalaya ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileMeghalayaData.source.sourceId),
      'Meghalaya ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const mizoramForestRows = districtProfileMizoramData.records || [];
assert(mizoramForestRows.length === 11, 'ISFR 2023 Mizoram district forest dataset must contain all 11 districts.');
assert(sourceRegistry.sources.some(source => source.id === districtProfileMizoramData.source.sourceId),
  'ISFR 2023 Mizoram district forest source must be registered.');
const mizoramForestExpected = {
  forestCoverCalculatedArea2023SqKm: 21081,
  veryDenseForest2023SqKm: 261.52,
  moderatelyDenseForest2023SqKm: 8635.76,
  openForest2023SqKm: 9093.18,
  forestCover2023SqKm: 17990.46,
  forestCoverChangeSince2021SqKm: 241.73,
  scrub2023SqKm: 314.54
};
for (const [field, expectedValue] of Object.entries(mizoramForestExpected)) {
  const actual = mizoramForestRows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
  assert(Math.abs(actual - expectedValue) < 0.01, 'Mizoram ISFR 2023 district total does not reconcile for ' + field + ': ' + actual + ' vs ' + expectedValue);
}
for (const row of mizoramForestRows) {
  assert(row.stateName === 'Mizoram', 'Mizoram ISFR district row has wrong state: ' + row.name);
  assert(lgdData.districts.some(d => d.lgdCode === row.lgdCode && d.name === row.name && d.stateLgdCode === '15'),
    'Mizoram ISFR district row does not exactly match current LGD identity: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row.sourceRecords.some(source => source.field === field && source.sourceId === districtProfileMizoramData.source.sourceId),
      'Mizoram ISFR field lacks its registered field-level source: ' + row.name + '.' + field);
  }
}
const directoryOnlyDistrictRows = districtProfileRows.filter(row => row.profileType === 'directory_identity_only');
const districtProfilesWithVerifiedFields = districtProfileRows.filter(row => Array.isArray(row.verifiedFields) && row.verifiedFields.length > 0);
const districtProfileCodes = new Set();
const allowedVerification = new Set(['verified','verification_pending','not_available']);
for (const row of districtProfileRows) {
  assert(row.lgdCode && row.name && row.stateLgdCode, 'District profile missing current LGD identity.');
  assert(!districtProfileCodes.has(row.lgdCode), 'Duplicate district profile LGD code: ' + row.lgdCode);
  districtProfileCodes.add(row.lgdCode);
  assert(allowedVerification.has(row.verificationStatus), 'Invalid district profile verification status: ' + row.name);
  if (row.profileType === 'directory_identity_only') {
    assert(row.verificationStatus === 'verification_pending' && Array.isArray(row.verifiedFields) && row.verifiedFields.length === 0,
      'Directory-only district record must remain pending and contain no verified profile fields: ' + row.name);
  }
  assert(Array.isArray(row.sourceRecords) && row.sourceRecords.length > 0, 'District profile has no source records: ' + row.name);
  for (const field of row.verifiedFields || []) {
    assert(row[field] !== null && row[field] !== undefined && row[field] !== '', 'Verified district field is empty: ' + row.name + '.' + field);
    assert(row.sourceRecords.some(source => source.field === field && source.sourceUrl && source.sourceUrl.startsWith('https://')),
      'Verified district field lacks a field-specific HTTPS source: ' + row.name + '.' + field);
  }
}
const districtHierarchyRows = districtHierarchyData.records || [];
const districtHierarchyTotals = districtHierarchyRows.reduce((sum,row) => ({
  blocks: sum.blocks + Number(row.developmentBlockCount || 0),
  subdistricts: sum.subdistricts + Number(row.lgdSubdistrictCount || 0)
}), {blocks:0,subdistricts:0});
assert(districtHierarchyData.source && districtHierarchyData.source.referenceDate === '2026-10-21', 'District hierarchy must retain its LGD source date.');
assert(districtHierarchyData.source && districtHierarchyData.source.verificationStatus === 'official_source_derived_secondary_mirror', 'District hierarchy must retain secondary-mirror provenance.');
assert(districtHierarchyRows.length === 784, 'District hierarchy snapshot must contain 784 LGD district rows.');
assert(new Set(districtHierarchyRows.map(row => String(row.lgdCode))).size === 784, 'District hierarchy LGD codes must be unique.');
assert(districtHierarchyTotals.blocks === 7342, 'District development-block associations must reconcile to 7,342.');
assert(districtHierarchyTotals.subdistricts === 7092, 'District sub-districts must reconcile to 7,092.');
for (const row of districtHierarchyRows) {
  assert(row.lgdCode && row.districtName && row.stateName, 'District hierarchy row lacks identity fields: ' + JSON.stringify(row));
  assert(Array.isArray(row.developmentBlocks) && row.developmentBlocks.length === row.developmentBlockCount, 'Development-block names/count mismatch: ' + row.districtName);
  assert(Array.isArray(row.lgdSubdistricts) && row.lgdSubdistricts.length === row.lgdSubdistrictCount, 'LGD sub-district names/count mismatch: ' + row.districtName);
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
const urbanLgdRows = urbanLgdMirrorData.records || [];
assert(urbanLgdMirrorData.source && urbanLgdMirrorData.source.verificationStatus === 'provisional_secondary_mirror', 'Urban local-body mirror must retain provisional secondary-source status.');
assert(urbanLgdRows.length === 35, 'Urban local-body mirror should contain exactly the 35 jurisdictions listed by its dated source.');
const urbanLgdTotals = urbanLgdRows.reduce((sum,row) => {
  for (const key of ['municipalCorporations','municipalities','nagarPanchayats','notifiedAreaCouncils','urbanLocalBodiesTotal']) sum[key] += Number(row.fields && row.fields[key] || 0);
  return sum;
}, {municipalCorporations:0,municipalities:0,nagarPanchayats:0,notifiedAreaCouncils:0,urbanLocalBodiesTotal:0});
assert(urbanLgdTotals.municipalCorporations === 273 && urbanLgdTotals.municipalities === 2191 && urbanLgdTotals.nagarPanchayats === 2420 && urbanLgdTotals.notifiedAreaCouncils === 167 && urbanLgdTotals.urbanLocalBodiesTotal === 5051, 'Urban local-body mirror totals do not match its cited 25 September 2026 table.');
assert(!urbanLgdRows.some(row => row.regionName === 'Lakshadweep'), 'Do not add an unsupported Lakshadweep zero from a source that omits the jurisdiction.');
warnings.push('Statewise urban local-body counts are provisional third-party transcriptions of an LGD-derived 25 Sep 2026 snapshot; primary LGD/OGD reconciliation remains outstanding.');

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

let sourceCheckedRecords = allSupplementalRecords.length;
let unsourcedRecords = 0;
const districtProfileRegions = new Set(districtProfileRows.map(row => normalized(row.stateName))).size;
const coverage = {};
for (const [group, keys] of Object.entries(categoryGroups)) {
  coverage[group] = {};
  for (const key of keys) {
    const categoryRecords = (region) => {
      const base = key === 'languages' && !list((region.geography || {})[key]).length ? list(region.officialLanguages) : list((region.geography || {})[key]);
      const extra = allSupplementalRecords.filter(row => row.regionName === region.name && row.category === key);
      const giExtra = key === 'giProducts' ? (giData.records || []).filter(row => row.regionName === region.name) : [];
      return base.concat(extra, giExtra);
    };
    const regionsWithDataNames = regions.filter(r => categoryRecords(r).length > 0).map(r => r.name);
    const regionsMissing = expectedNames.filter(name => !regionsWithDataNames.includes(name));
    const recordCount = regions.reduce((sum,r) => sum + categoryRecords(r).length, 0);
    coverage[group][key] = { regionsWithData: regionsWithDataNames.length, recordCount, regionsWithDataNames, regionsMissing };
  }
}
for (const region of regions) {
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
if (districtProfileRegions < 36) warnings.push('District directory identity records currently cover ' + districtProfileRegions + '/36 regions.');
if (directoryOnlyDistrictRows.length) warnings.push(directoryOnlyDistrictRows.length + ' districts have LGD directory identity shells only; detailed district facts remain unverified. ' + districtProfilesWithVerifiedFields.length + ' districts have at least one field-specific sourced profile attribute.');
if (heritageRows.length) {
  const heritageRegions = new Set(heritageRows.map(r => r.regionName)).size;
  const noInscribedRegions = new Set(allSupplementalRecords
    .filter(r => r.category === 'unescoWorldHeritage' && r.verificationStatus === 'not_available')
    .map(r => r.regionName)).size;
  warnings.push('UNESCO dataset contains ' + heritageRows.length + ' named inscribed properties across ' + heritageRegions + '/36 regions; ' + noInscribedRegions + ' other regions have scope-limited no-inscribed-property records from the official UNESCO India State Party list. This is not a complete heritage inventory and excludes Tentative List entries.');
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

const officeholderRows = officeholderData.records || [];
const officeholderSourceIds = new Set((officeholderData.sources || []).map(source => source.sourceId));
const officeholderRegions = new Set();
for (const row of officeholderRows) {
  assert(regionSet.has(row.regionName), 'Official officeholder row references unknown region: ' + row.regionName);
  assert(!officeholderRegions.has(row.regionName), 'Duplicate official officeholder row: ' + row.regionName);
  officeholderRegions.add(row.regionName);
  assert(Array.isArray(row.sourceIds) && row.sourceIds.length > 0, 'Officeholder row lacks source IDs: ' + row.regionName);
  for (const sourceId of row.sourceIds || []) assert(officeholderSourceIds.has(sourceId), 'Officeholder row references unregistered source: ' + sourceId);
  for (const field of row.verifiedFields || []) assert(Object.keys(row.fields || {}).some(key => 'political.' + key === field), 'Officeholder verified field has no value: ' + row.regionName + '.' + field);
}
for (const source of officeholderData.sources || []) {
  assert(/^https:\/\//.test(source.sourceUrl || ''), 'Officeholder source must use HTTPS: ' + source.sourceId);
  assert(/^\d{4}-\d{2}-\d{2}$/.test(source.lastVerifiedAt || ''), 'Officeholder source must include an ISO last-verified date: ' + source.sourceId);
}
assert(officeholderData.verificationStatus === 'officially_verified_complete', 'Officeholder dataset must declare complete official coverage only after all 36 region heads and 31 applicable CMs are sourced.');
const headRows = officeholderRows.filter(row => row.fields && row.fields.governorOrLieutenantGovernor).length;
const cmRows = officeholderRows.filter(row => row.fields && row.fields.chiefMinisterOrAdministrator && !String(row.fields.chiefMinisterOrAdministrator).startsWith('Not applicable')).length;
assert(headRows === 36, 'Governor/Lieutenant Governor/Administrator field must cover all 36 regions.');
assert(cmRows === 31, 'Chief Minister names must cover all 31 regions with an elected Chief Minister office.');
assert(officeholderRegions.size === 36, 'Officeholder dataset must include all 36 State/UT regions.');


const boundaryRows = boundaryMetadataData.records || [];
const boundaryRegions = new Set();
assert(boundaryRows.length === 36, 'Survey of India boundary metadata must cover all 36 State/UT profiles.');
for (const row of boundaryRows) {
  assert(regionSet.has(row.regionName), 'Boundary metadata references unknown region: ' + row.regionName);
  assert(!boundaryRegions.has(row.regionName), 'Duplicate boundary metadata region: ' + row.regionName);
  boundaryRegions.add(row.regionName);
  assert(row.geometryVersion === 'Version 01 — harmonized with ORGI', 'Unexpected state boundary dataset version: ' + row.regionName);
  assert(row.districtBoundaryVersion === row.geometryVersion, 'State and district boundary version mismatch: ' + row.regionName);
  assert(row.effectiveFrom === 'Not stated in published metadata', 'Do not invent a boundary effective date: ' + row.regionName);
}
assert(boundaryMetadataData.verificationStatus === 'official_metadata_version_only', 'Boundary metadata must not imply legal/effective-date verification.');
assert(/^https:\/\//.test(boundaryMetadataData.source.sourceUrl || ''), 'Survey of India boundary source must use HTTPS.');
assert(/^https:\/\//.test(boundaryMetadataData.source.metadataUrl || ''), 'Survey of India boundary metadata PDF must use HTTPS.');
warnings.push('Survey of India Version 01 metadata is recorded for all 36 regions; per-region legal/effective dates are not published in the source metadata and remain unspecified.');

const districtPortalRows = districtPortalDirectoryData.records || [];
const districtPortalRegions = new Set();
for (const row of districtPortalRows) {
  assert(regionSet.has(row.regionName), 'IGOD district portal directory references unknown region: ' + row.regionName);
  assert(!districtPortalRegions.has(row.regionName), 'Duplicate IGOD district portal directory region: ' + row.regionName);
  assert(/^https:\/\/igod\.gov\.in\/sg\/[A-Z]{2}\/E042\/organizations$/.test(row.directoryUrl || ''), 'Invalid official IGOD district directory URL: ' + row.regionName);
  districtPortalRegions.add(row.regionName);
}
assert(districtPortalRegions.size === 36, 'Official IGOD district portal directory links must cover all 36 regions.');
warnings.push('Official district portal directories are linked for all 36 regions; individual portal links are not a substitute for district-specific headquarters, area or formation-date verification.');

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
    officialOfficeholderRegions: officeholderRegions.size,
    regionsWithDistrictProfiles: districtProfileRegions,
    districtHierarchyRows: districtHierarchyRows.length,
    districtDevelopmentBlockAssociations: districtHierarchyTotals.blocks,
    districtLgdSubdistricts: districtHierarchyTotals.subdistricts
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
if (errors.length) { console.error('Regional audit errors:', errors.join(' | ')); process.exitCode = 1; }
