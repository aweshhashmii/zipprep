(function(){
'use strict';
var EXPECTED=[
'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];
var ALIASES={
'PONDICHERRY':'Puducherry','PUDUCHERRY':'Puducherry','NCT OF DELHI':'Delhi','NATIONAL CAPITAL TERRITORY OF DELHI':'Delhi',
'ANDAMAN & NICOBAR ISLANDS':'Andaman and Nicobar Islands','ANDAMAN AND NICOBAR':'Andaman and Nicobar Islands',
'DADRA AND NAGAR HAVELI AND DAMAN AND DIU':'Dadra and Nagar Haveli and Daman and Diu',
'ORISSA':'Odisha','UTTARANCHAL':'Uttarakhand','JAMMU & KASHMIR':'Jammu and Kashmir','JAMMU AND KASHMIR':'Jammu and Kashmir',
'JAMMU AND KASHMIR (UT)':'Jammu and Kashmir','LADAKH (UT)':'Ladakh'
};
var regionCatalog=null,regionCatalogPromise=null,censusDistricts=null,censusDistrictsVerified=false;var lgdDirectory=null;var districtProfileData=null;
var SOURCE_LINKS=[
['Election Commission of India — Terms of the Houses','https://www.eci.gov.in/term-of-the-houses/'],['Parliament of India','https://sansad.in/'],['Ministry of Panchayati Raj','https://panchayat.gov.in/'],['Local Government Directory — current district codes','https://lgdirectory.gov.in/'],
['Ministry of Housing and Urban Affairs','https://mohua.gov.in/'],['Census of India','https://censusindia.gov.in/'],
['UNESCO World Heritage Centre — India','https://whc.unesco.org/en/statesparties/IN'],['MoHFW Rural Health Statistics 2020–21 — Census 2011 area table','https://mohfw.gov.in/sites/default/files/rhs20-21_2.pdf'],['Ministry of Home Affairs — State reorganisation history','https://www.mha.gov.in/sites/default/files/2022-08/CCSAP-REPORT-060111%5B1%5D.pdf'],['MHA — Jammu & Kashmir / Ladakh formation','https://www.mha.gov.in/jammu-kashmir-ladakh-affairs'],['Government of Uttarakhand — capital and formation','https://cm.uk.gov.in/geography/'],['Andaman & Nicobar Administration — UT profile','https://andamannicobar.gov.in/about'],['DNH & DD Administration — capital FAQ','https://ddd.gov.in/faqs/'],['BharatMapService','https://mapservice.gov.in/'],['geoBoundaries India ADM1 (CC BY 2.5 IN)','https://www.geoboundaries.org/api/current/gbOpen/IND/ADM1/'],['Community boundary source','https://github.com/iamaanahmad/GeoJson-of-Indian-States']
];
var focusMap=null,stateLayer=null,districtLayer=null,selectedDistrictLayer=null,currentState='',currentFeature=null,currentTab='profile',districtFeatures=[],retryButton=null;
var $=function(id){return document.getElementById(id)};
var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function canonicalName(value){
 var raw=String(value||'').trim();if(!raw)return raw;
 var alias=ALIASES[raw.toUpperCase()];if(alias)return alias;
 var match=EXPECTED.find(function(n){return n.toLowerCase()===raw.toLowerCase()});return match||raw;
}
function rawName(f){
 var p=f&&f.properties||{},keys=['shapeName','shape_name','NAME_1','ST_NM','st_nm','STATE','state','NAME','name','admin','shapeGroupName','shapeGroupNameEnglish'];
 for(var i=0;i<keys.length;i++)if(typeof p[keys[i]]==='string'&&p[keys[i]].trim())return p[keys[i]].trim();
 return '';
}
function validateIndia(data){
 if(!data||!Array.isArray(data.features))return false;
 var names=new Set(data.features.map(function(f){return canonicalName(rawName(f))}));
 return EXPECTED.every(function(n){return names.has(n)});
}
function textSafe(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function stat(label,value,source){
 var shown=value===null||value===undefined||value===''?'Verification pending':value;return '<div class="atlas-profile-stat"><small>'+textSafe(label)+'</small><strong>'+textSafe(shown)+'</strong><em>'+textSafe(source||'No verified source record attached')+'</em></div>';
}
function loadRegionCatalog(){
 if(regionCatalog)return Promise.resolve(regionCatalog);
 if(!regionCatalogPromise)regionCatalogPromise=Promise.all([
  fetch('./data/explore-india-regions.json').then(function(r){if(!r.ok)throw Error('Region catalogue HTTP '+r.status);return r.json()}),
  fetch('./data/region-political-2026.json').then(function(r){if(!r.ok)throw Error('Political dataset HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/region-unesco-heritage-2026.json').then(function(r){if(!r.ok)throw Error('UNESCO dataset HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/india-district-census-2011.json').then(function(r){if(!r.ok)throw Error('Census district dataset HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/india-lgd-administrative-2026.json').then(function(r){if(!r.ok)throw Error('LGD directory HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/district-profiles-2026.json').then(function(r){if(!r.ok)throw Error('District profiles HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/region-gi-2026.json').then(function(r){if(!r.ok)throw Error('GI register HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/region-supplemental-categories-2026.json').then(function(r){if(!r.ok)throw Error('Supplemental regional categories HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/region-supplemental-categories-batch-2026-10-31.json').then(function(r){if(!r.ok)throw Error('Supplemental category batch HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/district-profile-enrichment-batch-2026-10-31.json').then(function(r){if(!r.ok)throw Error('District profile enrichment batch HTTP '+r.status);return r.json()}).catch(function(){return null}),
  fetch('./data/region-administration-enrichment-2026-10-31.json').then(function(r){if(!r.ok)throw Error('Regional administration enrichment HTTP '+r.status);return r.json()}).catch(function(){return null})
  ,fetch('./data/region-geographical-neighbours-2026.json').then(function(r){if(!r.ok)throw Error('Geographical neighbours dataset HTTP '+r.status);return r.json()}).catch(function(){return null})
 ]).then(function(parts){
  var data=parts[0],political=parts[1],heritage=parts[2],census=parts[3],lgd=parts[4],districtProfiles=parts[5];
  var giRegister=parts[6],supplemental=parts[7],supplementalBatch=parts[8],districtProfileBatch=parts[9],administrationBatch=parts[10];
  var neighbours=parts[11];
  if(neighbours&&Array.isArray(neighbours.records))neighbours.records.forEach(function(item){var region=data.regions.find(function(r){return r.name===item.regionName});if(!region)return;region.geography=region.geography||{};region.geography.location=[{name:'Geographical position and neighbours',description:item.description,adjoiningRegions:item.adjoiningRegions||[],internationalNeighbours:item.internationalNeighbours||[],sourceUrl:item.sourceUrl,sourceId:item.sourceId,referenceDate:item.referenceDate,verificationStatus:item.verificationStatus}];region.sourceRecords=region.sourceRecords||[];if(!region.sourceRecords.some(function(src){return src.sourceId===item.sourceId}))region.sourceRecords.push({sourceId:item.sourceId,title:neighbours.source.title,sourceUrl:neighbours.source.sourceUrl,referenceDate:neighbours.source.referenceDate,lastVerifiedAt:neighbours.source.lastVerifiedAt,fields:['geography.location'],note:neighbours.source.note})});
  [supplemental,supplementalBatch].forEach(function(dataset){
   if(dataset&&Array.isArray(dataset.records))dataset.records.forEach(function(item){
    var region=data.regions.find(function(r){return r.name===item.regionName});
    if(!region)return;
    region.geography=region.geography||{};
    var rows=Array.isArray(region.geography[item.category])?region.geography[item.category]:[];
    if(!rows.some(function(row){return row.id===item.id}))rows.push({id:item.id,name:item.name,description:item.description,sourceUrl:item.sourceUrl,sourceId:item.sourceId,referenceDate:item.referenceDate,verificationStatus:item.verificationStatus});
    region.geography[item.category]=rows;
    region.sourceRecords=region.sourceRecords||[];
    if(!region.sourceRecords.some(function(src){return src.sourceId===item.sourceId}))region.sourceRecords.push({sourceId:item.sourceId,title:item.sourceId,sourceUrl:item.sourceUrl,referenceDate:item.referenceDate,fields:['geography.'+item.category]});
   });
  });

  if(administrationBatch&&Array.isArray(administrationBatch.records))administrationBatch.records.forEach(function(item){var region=data.regions.find(function(r){return r.name===item.regionName});if(!region)return;region.administration=region.administration||{};Object.keys(item.fields||{}).forEach(function(key){region.administration[key]=item.fields[key]});region.sourceRecords=region.sourceRecords||[];region.sourceRecords.push({sourceId:item.sourceId,title:item.sourceTitle,sourceUrl:item.sourceUrl,referenceDate:item.referenceDate,lastVerifiedAt:item.lastVerifiedAt,fields:Object.keys(item.fields||{}).map(function(key){return 'administration.'+key}),note:item.note});if(item.secondarySourceUrl){region.sourceRecords.push({sourceId:item.sourceId+'-secondary',title:'16th Finance Commission — Karnataka local government study',sourceUrl:item.secondarySourceUrl,referenceDate:'2023 table',lastVerifiedAt:item.lastVerifiedAt,fields:['administration.intermediatePanchayats','administration.districtPanchayats'],note:'Source for Taluk Panchayat and Zilla Panchayat counts.'})}});
   censusDistricts=census&&Array.isArray(census.records)?census.records:[];
  censusDistrictsVerified=!!(census&&census.source&&census.source.verificationStatus==='officially_verified');
  if(districtProfiles&&Array.isArray(districtProfiles.records)&&districtProfileBatch&&Array.isArray(districtProfileBatch.records))districtProfileBatch.records.forEach(function(batchRow){
   var existing=districtProfiles.records.find(function(row){return String(row.lgdCode)===String(batchRow.lgdCode)});
   if(existing){Object.keys(batchRow).forEach(function(key){if(key!=='verifiedFields'&&key!=='sourceRecords')existing[key]=batchRow[key]});existing.verifiedFields=Array.from(new Set((existing.verifiedFields||[]).concat(batchRow.verifiedFields||[])));existing.sourceRecords=(existing.sourceRecords||[]).concat(batchRow.sourceRecords||[])}
   else districtProfiles.records.push(batchRow);
  });
  lgdDirectory=lgd&&Array.isArray(lgd.states)&&Array.isArray(lgd.districts)?lgd:null;
  districtProfileData=districtProfiles&&Array.isArray(districtProfiles.records)?districtProfiles:null;
  if(lgdDirectory)data.regions.forEach(function(region){
   var state=lgdDirectory.states.find(function(item){var a=item.name.toLowerCase().replace(/&/g,'and').replace(/^the /,'');var b=region.name.toLowerCase().replace(/&/g,'and').replace(/^the /,'');return a===b});
   if(!state)return;
   var currentDistricts=lgdDirectory.districts.filter(function(item){return item.stateLgdCode===state.lgdCode});
   region.lgdStateCode=state.lgdCode;
   region.administration=region.administration||{};
   region.administration.districtCount=currentDistricts.length;
   region.administration.districtCountSourceId='lgdCurrentDistrictDirectory2026';
   region.administration.districtCountReferenceDate=lgdDirectory.source.sourceDate;
   region.districts=region.districts||{};
   region.districts.currentDirectory=currentDistricts;
   region.sourceRecords=region.sourceRecords||[];
   if(!region.sourceRecords.some(function(src){return src.sourceId==='lgdCurrentDistrictDirectory2026'}))   region.sourceRecords.push({sourceId:'lgdCurrentDistrictDirectory2026',title:'Ministry of Panchayati Raj — Local Government Directory (current district directory)',sourceUrl:'https://lgdirectory.gov.in/',referenceDate:lgdDirectory.source.sourceDate,lastVerifiedAt:lgdDirectory.source.ingestedAt,fields:['administration.districtCount','districts.currentDirectory'],note:'Current district names and LGD codes are from the LGD snapshot dated '+lgdDirectory.source.sourceDate+'; district boundary polygons are a separate map layer.'});
  });

  if(!data||!Array.isArray(data.regions))throw Error('Invalid region catalogue');
  if(giRegister&&Array.isArray(giRegister.records))data.regions.forEach(function(region){
   var giEntries=giRegister.records.filter(function(item){return item.regionName===region.name});
   if(!giEntries.length)return;
   region.geography=region.geography||{};
   var existingGi=Array.isArray(region.geography.giProducts)?region.geography.giProducts:[];
   var newGiEntries=giEntries.filter(function(item){return !existingGi.some(function(existing){return existing.name===item.name})});
   region.geography.giProducts=existingGi.concat(newGiEntries);
   region.sourceRecords=region.sourceRecords||[];
   if(!region.sourceRecords.some(function(src){return src.sourceId==='ipindiaStatewiseRegisteredGI2026'}))region.sourceRecords.push({sourceId:'ipindiaStatewiseRegisteredGI2026',title:'IP India — State-wise Registered Geographical Indications of India',sourceUrl:giRegister.source.sourceUrl,referenceDate:giRegister.source.registerDataAsOf,lastVerifiedAt:giRegister.source.lastVerifiedAt,fields:['geography.giProducts'],note:giRegister.description});
  });
  if(political&&Array.isArray(political.records))data.regions.forEach(function(region){
   var row=political.records.find(function(item){return item.regionName===region.name});
   if(!row)return;
   region.political=region.political||{};
   region.political.lokSabhaSeats=row.lokSabhaSeats;
   region.political.rajyaSabhaSeats=row.rajyaSabhaSeats;
   region.political.assemblySeats=row.assemblySeats;
   region.political.sourceId=row.sourceId;
   region.political.referenceYear=row.referenceYear;
   region.political.lastVerifiedAt=row.lastVerifiedAt;
   region.sourceRecords=region.sourceRecords||[];
   region.sourceRecords.push({id:'eci-seats-2026',sourceId:row.sourceId,title:political.source||'Election Commission of India — Terms of the Houses',url:row.sourceUrl,fields:['political.lokSabhaSeats','political.rajyaSabhaSeats','political.assemblySeats'],referenceYear:row.referenceYear,lastVerifiedAt:row.lastVerifiedAt});
  });
  if(heritage&&Array.isArray(heritage.records))data.regions.forEach(function(region){
   var entries=heritage.records.filter(function(item){return item.regionName===region.name});
   if(!entries.length)return;
   region.geography=region.geography||{};
   region.geography.unescoWorldHeritage=entries.map(function(item){return {name:item.name,designation:item.designation,inscriptionYear:item.inscriptionYear,description:item.description,sourceUrl:item.sourceUrl,sourceId:item.sourceId,lastVerifiedAt:item.lastVerifiedAt}});
  });
  regionCatalog=data;return data;
 }).catch(function(e){regionCatalogPromise=null;throw e});
 return regionCatalogPromise;
}
function sourceLinks(){
 return '<div class="atlas-data-sources">'+SOURCE_LINKS.map(function(s){return '<a href="'+s[1]+'" target="_blank" rel="noopener noreferrer">'+textSafe(s[0])+'</a>'}).join('')+'</div>';
}
function shell(){
 var dash=$('wb-dashboard');if(!dash)return;
 dash.innerHTML='<div class="atlas-focus-shell">'+
 '<header class="atlas-focus-top"><div><p class="atlas-kicker">EXPLORE INDIA · STATE ATLAS</p><h2 id="focus-title"></h2><p id="focus-subtitle">The selected region is shown with its district boundaries.</p></div><div class="atlas-focus-actions"><button type="button" id="focus-back" class="primary">← India map</button></div></header>'+
 '<div class="atlas-focus-map-wrap is-extracting" id="focus-map-wrap"><div id="focus-map" role="application" aria-label="Selected state or union territory with district boundaries"></div></div>'+
 '<p class="atlas-focus-status" id="focus-status" role="status" aria-live="polite">Loading official district boundaries…</p>'+
 '<div class="atlas-focus-tabs" role="tablist" aria-label="State and Union Territory information">'+
 '<button type="button" role="tab" id="tab-profile" aria-controls="panel-profile" aria-selected="true">STATE &amp; DISTRICT PROFILE</button>'+
 '<button type="button" role="tab" id="tab-geography" aria-controls="panel-geography" aria-selected="false">PHYSICAL GEOGRAPHY</button>'+
 '<button type="button" role="tab" id="tab-environment" aria-controls="panel-environment" aria-selected="false">ENVIRONMENT &amp; BIODIVERSITY</button>'+
 '<button type="button" role="tab" id="tab-economy" aria-controls="panel-economy" aria-selected="false">ECONOMY &amp; INFRASTRUCTURE</button>'+
 '<button type="button" role="tab" id="tab-heritage" aria-controls="panel-heritage" aria-selected="false">HISTORY, CULTURE &amp; HERITAGE</button></div>'+
 '<section class="atlas-focus-content" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile"></section>'+
 '<section class="atlas-focus-content" id="panel-geography" role="tabpanel" aria-labelledby="tab-geography" hidden></section>'+
 '<section class="atlas-focus-content" id="panel-environment" role="tabpanel" aria-labelledby="tab-environment" hidden></section>'+
 '<section class="atlas-focus-content" id="panel-economy" role="tabpanel" aria-labelledby="tab-economy" hidden></section>'+
 '<section class="atlas-focus-content" id="panel-heritage" role="tabpanel" aria-labelledby="tab-heritage" hidden></section>'+
 '</div>';
 $('focus-back').addEventListener('click',close);
 $('tab-profile').addEventListener('click',function(){switchTab('profile')});
 $('tab-geography').addEventListener('click',function(){switchTab('geography')});
 $('tab-environment').addEventListener('click',function(){switchTab('environment')});
 $('tab-economy').addEventListener('click',function(){switchTab('economy')});
 $('tab-heritage').addEventListener('click',function(){switchTab('heritage')});
 dash.hidden=false;
}
function switchTab(which){
 var tabs=['profile','geography','environment','economy','heritage'];
 if(tabs.indexOf(which)<0)which='profile';
 currentTab=which;
 tabs.forEach(function(tab){
  var panel=$('panel-'+tab),button=$('tab-'+tab),active=tab===which;
  if(panel)panel.hidden=!active;
  if(button)button.setAttribute('aria-selected',String(active));
 });
}
function close(){
 var dash=$('wb-dashboard');if(dash)dash.hidden=true;
 var section=$('v-india');if(section)section.classList.remove('atlas-state-focus');
 var mapEl=$('india-map');if(mapEl)mapEl.classList.remove('atlas-map-state-focus');
 if(focusMap){focusMap.remove();focusMap=null;stateLayer=null;districtLayer=null;selectedDistrictLayer=null;}
 var original=$('atlas-status');if(original)original.textContent='India map remains active. Select another state or Union Territory to continue.';
 var back=$('atlas-reset');if(back)back.click();var mapEl=$('india-map');if(mapEl){mapEl.setAttribute('tabindex','0');mapEl.focus();}
}
function stateServiceName(name){
 var aliases={'Delhi':'NCT of Delhi','Odisha':'Orissa','Uttarakhand':'Uttaranchal'};
 return aliases[name]||name;
}
function districtUrl(name){
 return 'https://mapservice.gov.in/gismapservice/rest/services/BharatMapService/Admin_Boundary_District/MapServer/1/query?where='+encodeURIComponent("STNAME='"+stateServiceName(name).replace(/'/g,"''")+"'")+'&outFields=*&returnGeometry=true&outSR=4326&f=geojson';
}
function initFocusMap(){
 if(!window.L)throw new Error('The map library did not load. Reload the page to try again.');
 if(focusMap){focusMap.remove();focusMap=null;}
 focusMap=L.map('focus-map',{scrollWheelZoom:false,zoomControl:true,keyboard:true,preferCanvas:true}).setView([22.8,79],5);
 focusMap.getContainer().style.background='#111827';
}
function drawState(feature){
 stateLayer=L.geoJSON(feature,{style:{color:'#ffd24a',weight:3,fillColor:'#6b7cff',fillOpacity:.34,opacity:1}}).addTo(focusMap);
 var b=stateLayer.getBounds();if(b&&b.isValid())focusMap.fitBounds(b,{padding:[24,24],maxZoom:7,animate:!reduced});
}
function districtName(f){
 var p=f&&f.properties||{},keys=['DTNAME','dtname','DISTRICT','district','DIST_NAME','NAME_2','shapeName','shape_name','name','NAME'];
 for(var i=0;i<keys.length;i++)if(typeof p[keys[i]]==='string'&&p[keys[i]].trim())return p[keys[i]].trim();
 return 'Unnamed district';
}
function districtStyle(){return {color:'#7ae582',weight:1.15,fillColor:'#5366c7',fillOpacity:.34};}
function renderDistrictLayer(data){
 if(districtLayer)focusMap.removeLayer(districtLayer);
 selectedDistrictLayer=null;districtFeatures=data.features.slice();
 districtLayer=L.geoJSON(data,{style:districtStyle,onEachFeature:function(f,l){
  var name=districtName(f);l.bindTooltip(textSafe(name),{permanent:true,direction:'center',className:'atlas-state-label',opacity:.95,interactive:false});
  l.on('mouseover',function(){if(l!==selectedDistrictLayer)l.setStyle({weight:2,fillOpacity:.62})});
  l.on('mouseout',function(){if(l!==selectedDistrictLayer)districtLayer.resetStyle(l)});
  l.on('click',function(){selectDistrict(name,l)});
  l.on('add',function(){var el=l.getElement();if(el){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label','Select district '+name);el.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();l.fire('click')}})}});
 }}).addTo(focusMap);
 var bounds=districtLayer.getBounds();if(bounds&&bounds.isValid())focusMap.fitBounds(bounds,{padding:[25,25],maxZoom:9,animate:!reduced});
 
}
function renderDistrictDirectory(){
 var panel=$('panel-profile');if(!panel)return;
 var root=panel.querySelector('#district-directory');if(!root)return;
 var names=districtFeatures.map(function(f){return districtName(f)}).sort(function(a,b){return a.localeCompare(b)});
 root.innerHTML=names.map(function(n){return '<button type="button" data-district-name="'+textSafe(n)+'" aria-pressed="false">'+textSafe(n)+'</button>'}).join('');
 root.querySelectorAll('[data-district-name]').forEach(function(btn){btn.addEventListener('click',function(){
  var n=btn.getAttribute('data-district-name');var layer=null;
  if(districtLayer)districtLayer.eachLayer(function(l){if(districtName(l.feature)===n)layer=l});
  if(layer)selectDistrict(n,layer);
 })});
 var search=$('district-search');if(search)search.addEventListener('input',function(){var q=search.value.trim().toLowerCase();root.querySelectorAll('button').forEach(function(btn){btn.hidden=!btn.textContent.toLowerCase().includes(q)})});
}
function censusDistrictRecord(stateName,district){
 if(!censusDistrictsVerified||!Array.isArray(censusDistricts))return null;
 var norm=function(s){return String(s||'').toLowerCase().replace(/\([^)]*\)/g,'').replace(/district/g,'').replace(/[^a-z0-9]/g,'')};
 var d=norm(district),state=norm(stateName);
 var stateAliases={'delhi':['nctofdelhi'],'odisha':['orissa'],'telangana':['andhrapradesh'],'ladakh':['jammuandkashmir'],'puducherry':['pondicherry'],'dadraandnagarhavelianddamananddiu':['dadraandnagarhaveli','damananddiu']};
 var allowed=[state].concat(stateAliases[state]||[]);
 var candidates=censusDistricts.filter(function(r){return norm(r.district)===d});
 return candidates.find(function(r){return allowed.indexOf(norm(r.state))!==-1})||null;
}
function selectDistrict(name,layer){
 if(selectedDistrictLayer&&districtLayer)districtLayer.resetStyle(selectedDistrictLayer);
 selectedDistrictLayer=layer;layer.setStyle({color:'#fff',weight:2.8,fillColor:'#ffd24a',fillOpacity:.78});
 var bounds=layer.getBounds();if(bounds&&bounds.isValid())focusMap.flyToBounds(bounds,{padding:[25,25],maxZoom:9,animate:!reduced,duration:.75});
 var region=regionCatalog&&regionCatalog.regions.find(function(r){return r.name===currentState});
 var records=region&&region.districts&&region.districts.records||[];
 var record=records.find(function(r){return r.name===name||r.id===name})||{};
 var census=censusDistrictRecord(currentState,name);
 var districtDirectory=region&&region.districts&&region.districts.currentDirectory||[];
 var normDistrict=function(v){return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'')};
 var lgdDistrict=districtDirectory.find(function(item){return normDistrict(item.name)===normDistrict(name)})||null;
 var importedDistrictProfile=districtProfileData&&districtProfileData.records.find(function(item){return lgdDistrict&&item.lgdCode===lgdDistrict.lgdCode})||null;
 if(importedDistrictProfile)record=Object.assign({},record,importedDistrictProfile);

 var value=function(v){return v===null||v===undefined||v===''?'Verification pending':v};
 var pop=record.population&&record.population.value!==undefined?String(record.population.value)+(record.population.referenceYear?' (Census '+record.population.referenceYear+')':''): 'Not loaded — use a dated Census reference';
 var districtSourcesHtml=Array.isArray(record.sourceRecords)&&record.sourceRecords.length?'<h4>District source records</h4><div class="atlas-data-sources">'+record.sourceRecords.map(function(src){return '<div><a href="'+textSafe(src.sourceUrl||'#')+'" target="_blank" rel="noopener noreferrer">'+textSafe(src.title||src.sourceId||src.field||'District source')+'</a><small>'+textSafe(src.field||'')+(src.referenceDate?' · '+textSafe(src.referenceDate):'')+'</small>'+(src.note?'<small>'+textSafe(src.note)+'</small>':'')+'</div>'}).join('')+'</div>':'';

 var profile=$('district-selected-profile');
 if(profile)profile.innerHTML='<h3>'+textSafe(name)+' — District profile</h3><div class="atlas-profile-grid">'+
 stat('District headquarters',value(record.headquarters),'Official district administration portal · source record pending')+
 stat('Current LGD district code',lgdDistrict?lgdDistrict.lgdCode:'Not matched to current LGD directory','Ministry of Panchayati Raj · LGD snapshot '+(lgdDirectory&&lgdDirectory.source.sourceDate||'not loaded'))+
 stat('District status',value(record.status),'Existing district record')+
 stat('District formation date',value(record.formationDate),'Existing district record')+
 stat('Subdivisions',Array.isArray(record.subdivisions)&&record.subdivisions.length?record.subdivisions.join(', '):'Verification pending','Existing district record')+
 stat('Area',value(record.areaSqKm)==='Verification pending'?'Verification pending':value(record.areaSqKm)+' km²','Official district statistical handbook')+
 stat('Forest cover (2019 assessment)',record.forestCover2019SqKm!==undefined?record.forestCover2019SqKm+' km² · '+record.forestCoverPercent2019+'% of 2019 report district area':'Verification pending','Forest Survey of India · India State of Forest Report 2019; district-wise satellite assessment')+
 stat('Population',census?Number(census.population).toLocaleString('en-IN')+' (Census 2011)':pop,'Census of India · Primary Census Abstract 2011')+
 stat('Male / female population',census?Number(census.male).toLocaleString('en-IN')+' / '+Number(census.female).toLocaleString('en-IN'):'Verification pending','Census of India · 2011')+
 stat('Literacy',census?Number(census.literate).toLocaleString('en-IN')+' literates · '+census.literacyRate+'%':'Verification pending','Census of India · 2011; literacy calculated as literate population / total population')+
 stat('Sex ratio',census?census.sexRatio+' females per 1,000 males':'Verification pending','Census of India · 2011')+
 stat('Scheduled Castes / Tribes',census?Number(census.sc).toLocaleString('en-IN')+' / '+Number(census.st).toLocaleString('en-IN'):'Verification pending','Census of India · 2011')+
 stat('Workers',census?Number(census.workers).toLocaleString('en-IN'):'Verification pending','Census of India · 2011')+
 stat('Households',census?Number(census.households).toLocaleString('en-IN'):'Verification pending','Census of India · 2011')+
 stat('Census district code',census?census.censusDistrictCode:'Verification pending','Census of India · 2011')+

 stat('Development blocks',record.blocksCount!==undefined?record.blocksCount:(Array.isArray(record.blocks)&&record.blocks.length?record.blocks.join(', '):'Verification pending'),'Government of Karnataka · Chitradurga district administrative summary')+
 stat('Sub-divisions',record.subdivisionsCount!==undefined?record.subdivisionsCount:'Verification pending','Government of Karnataka · Chitradurga district administrative summary')+
 stat('Hoblies',record.hobliesCount!==undefined?record.hobliesCount:'Verification pending','Government of Karnataka · Chitradurga district administrative summary')+
 stat('Gram Panchayats',record.gramPanchayats!==undefined?record.gramPanchayats:'Verification pending','Government of Karnataka · Chitradurga district administrative summary')+
 stat('Villages',record.villages!==undefined?record.villages:'Verification pending','Government of Karnataka · Chitradurga district administrative summary')+
 stat('Urban local bodies',record.urbanLocalBodies!==undefined?record.urbanLocalBodies:'Verification pending','Government of Karnataka · Chitradurga district administrative summary')+
 stat('Major rivers',Array.isArray(record.majorRivers)&&record.majorRivers.length?record.majorRivers.join(', '):'Verification pending','Official hydrography / state water resources department')+
 '</div><h3>History & culture</h3><p class="atlas-data-pending">'+textSafe(record.historicalSignificance||'Historical information not yet verified.')+'</p><p class="atlas-data-pending">'+textSafe(Array.isArray(record.culturalHighlights)&&record.culturalHighlights.length?record.culturalHighlights.join(', '):'Cultural highlights not yet verified.')+'</p>'+(record.description?'<p class="atlas-data-pending">'+textSafe(record.description)+'</p>':'')+districtSourcesHtml+'<p class="atlas-data-pending">'+(census?'Demographic figures are historical Census 2011 data. District names and boundaries have changed in some states since 2011; unmatched records are deliberately left blank.':'No exact match to a verified Census 2011 district profile is available. Demographic values are withheld rather than guessed.')+'</p><p class="atlas-data-pending">Census source: <a href="https://censusindia.gov.in/census.website/en/data/population-finder" target="_blank" rel="noopener">Census of India — Population Finder</a>.</p>';
 var root=$('district-directory');if(root)root.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.textContent===name))});
}

function renderProfile(name,count){
 var root=$('panel-profile');if(!root)return;
 var record=regionCatalog&&regionCatalog.regions.find(function(r){return r.name===name});
 var pol=record&&record.political||{},adm=record&&record.administration||{};
 var display=function(v){return v===null||v===undefined||v===''?'Verification pending':v};
 var seatSource=pol.sourceId==='eci'?'Election Commission of India · reference '+(pol.referenceYear||'2026')+' · last verified '+(pol.lastVerifiedAt||'not recorded'):'Election Commission of India · source record pending';
 root.innerHTML='<p class="atlas-kicker">ADMINISTRATIVE &amp; POLITICAL SNAPSHOT</p><h3>'+textSafe(name)+' overview</h3><p class="atlas-data-pending">Current administrative district counts and LGD identifiers come from the dated Ministry of Panchayati Raj Local Government Directory snapshot. The number of district polygons available in the map service is shown separately; a missing polygon does not remove a district from the administrative directory. Parliamentary seat strengths are sourced from the Election Commission of India; officeholders and other administrative totals remain pending until separately verified.</p>'+
 '<div class="atlas-profile-grid">'+
 stat('Official capital',display(record&&record.capital),'State/UT government source; seasonal or additional capital arrangements are noted where applicable')+
 stat('Region type',record?(record.regionType==='state'?'State':'Union Territory'):'Verification pending','Government of India administrative structure')+
 stat('Regional catalogue updated',display(regionCatalog&&regionCatalog.lastUpdatedAt),'Existing catalogue metadata')+
 stat('State boundary source',display(record&&record.boundary&&record.boundary.sourceId),'Existing state boundary metadata')+
 stat('State boundary geometry version / effective date',record&&record.boundary?(display(record.boundary.geometryVersion)+' / '+display(record.boundary.effectiveFrom)):'Verification pending','Existing state boundary metadata')+
 stat('Current administrative district count',display(adm.districtCount),'Local Government Directory · snapshot '+(adm.districtCountReferenceDate||'not loaded')+'; not the number of map polygons')+
 stat('Districts mapped in boundary service',count,'BharatMapService district polygons · current response; geometry coverage only')+
 stat('Chief Minister / administrator',display(pol.chiefMinisterOrAdministrator),'Relevant state/UT government portal · last verified: pending')+
 stat('Governor / Lieutenant Governor',display(pol.governorOrLieutenantGovernor),'President of India / relevant Raj Bhavan or UT administration')+
 stat('Lok Sabha elected seats',display(pol.lokSabhaSeats),seatSource)+
 stat('Rajya Sabha seats',display(pol.rajyaSabhaSeats),seatSource)+
 stat('Legislative Assembly membership',display(pol.assemblySeats),seatSource)+
 stat('Legislative Council',display(pol.legislativeCouncil),'Relevant state legislature / Parliament records')+
 stat('Development blocks',display(adm.blocks),'Ministry of Panchayati Raj / state rural development department')+
 stat('Gram Panchayats',display(adm.gramPanchayats),'Ministry of Panchayati Raj / state rural development department')+
 stat('Gram Panchayat Development Plans uploaded (2025–26)',display(adm.gpdpUploaded),'Ministry of Panchayati Raj · e-GramSwaraj snapshot 29 Jan 2026; uploaded plans are progress, not total Panchayat count')+
 stat('Intermediate Panchayats',display(adm.intermediatePanchayats),'Ministry of Panchayati Raj / state rural development department')+
 stat('District Panchayats',display(adm.districtPanchayats),'Ministry of Panchayati Raj / state rural development department')+
 stat('Municipal corporations',display(adm.municipalCorporations),'Ministry of Housing and Urban Affairs / state ULB directory')+
 stat('Municipalities / Nagar Panchayats',display(adm.municipalities)+' / '+display(adm.nagarPanchayats),'Ministry of Housing and Urban Affairs / state ULB directory')+
 stat('Geographical area',record&&record.areaSqKm!==null&&record.areaSqKm!==undefined?Number(record.areaSqKm).toLocaleString('en-IN')+' km²':'Verification pending','Area reference and date basis are recorded in regional source notes')+
 stat('Formation date',display(record&&record.formationDate),'Formation/statehood milestone; source and date basis are recorded in the regional data')+
 stat('Regional data last verified',display(record&&record.lastVerifiedAt),'Existing regional record metadata')+
 stat('District boundary source',display(record&&record.districts&&record.districts.boundarySourceId),'Existing district boundary metadata')+
 stat('District boundary version / effective date',record&&record.districts?(display(record.districts.boundaryVersion)+' / '+display(record.districts.effectiveFrom)):'Verification pending','Existing district boundary metadata')+
 stat('High Court',display(record&&record.highCourt),'Official High Court / state government portal')+
 stat('Official languages',record&&record.officialLanguages&&record.officialLanguages.length?record.officialLanguages.join(', '):'Verification pending','Relevant state / UT government portal')+
 '</div><p class="atlas-data-pending">'+textSafe(record&&record.introduction||'A sourced regional introduction has not yet been added.')+'</p>'+((record&&Array.isArray(record.sourceRecords)&&record.sourceRecords.length)?'<h3>Region-specific source notes</h3><div class="atlas-data-sources">'+record.sourceRecords.map(function(src){var url=src.sourceUrl||src.url;var label=src.title||src.sourceId||src.field||'Source record';var fields=Array.isArray(src.fields)&&src.fields.length?' · fields: '+src.fields.join(', '):'';var verified=src.lastVerifiedAt?' · last verified '+src.lastVerifiedAt:'';var note=src.note?'<small>'+textSafe(src.note)+'</small>':'';return '<div><a href="'+textSafe(url||'#')+'" target="_blank" rel="noopener noreferrer">'+textSafe(label)+(src.referenceYear?' · '+textSafe(src.referenceYear):src.referenceDate?' · '+textSafe(src.referenceDate):'')+textSafe(fields)+textSafe(verified)+'</a>'+note+'</div>'}).join('')+'</div>':'')+'<div id="district-selected-profile" class="atlas-district-profile" aria-live="polite"><h3>District Explorer</h3><p class="atlas-data-pending">Select a district directly on the map to open its individual profile. District names are not duplicated in a separate directory.</p></div>'+
 '<p class="atlas-data-pending">Data status: values without a verified source record are shown as “Verification pending”. ECI seat strengths last verified 30 Oct 2026; current officeholders and other administrative totals are not yet verified.</p>'+sourceLinks();
}
function renderCategoryPanel(panelId,name,tabTitle,eyebrow,categories){
 var root=$(panelId);if(!root)return;
 var record=regionCatalog&&regionCatalog.regions.find(function(r){return r.name===name});
 var geography=record&&record.geography||{};
 function itemText(v){
  if(typeof v==='string')return textSafe(v);
  if(!v)return '';
  var title=v.name||v.title||v.officialName||'Verified entry';
  var desc=v.description||v.notes||'';
  var meta=[
   v.district?'District: '+v.district:'',
   v.ramsarSiteNumber?'Ramsar site no. '+v.ramsarSiteNumber:'',
   v.designationDate?'Designated '+v.designationDate:'',
   v.announcementDate?'Announced '+v.announcementDate:'',
   v.designationYear?'Designated '+v.designationYear:'',
   v.areaHectares!==undefined?Number(v.areaHectares).toLocaleString('en-IN')+' hectares':'',
   v.height!==undefined&&v.height!==null?'Height/elevation '+v.height:'',
   v.designation||'',
   v.inscriptionYear?'Inscribed '+v.inscriptionYear:'',
   v.sourceYear?'Source year '+v.sourceYear:'',
   v.referenceYear?'Reference '+v.referenceYear:'',
   v.applicationNo?'IP India application no. '+v.applicationNo:'',
   v.goodsCategory?'Goods category: '+v.goodsCategory:'',
   v.applicationFiledDate?'Application filed: '+v.applicationFiledDate:'',
   v.registrationStatus||'',
   v.registerSerial?'Register serial no. '+v.registerSerial:'',
   v.count!==undefined?'Count '+v.count+(v.referenceDate?' · as of '+v.referenceDate:''):'',
   v.referenceDate&&v.count===undefined?'Reference date '+v.referenceDate:'',
   v.operationalCount!==undefined?'Operational '+v.operationalCount:'',
   v.underConstructionCount!==undefined?'Under construction '+v.underConstructionCount:'',
   v.totalCount!==undefined?'Total '+v.totalCount:'',
   v.forestAndTreeCoverSqKm!==undefined?Number(v.forestAndTreeCoverSqKm).toLocaleString('en-IN')+' km²':'',
   v.percentOfGeographicalArea!==undefined&&v.percentOfGeographicalArea!==null?v.percentOfGeographicalArea+'% of geographical area':'',
   v.sourceId?'Source ID '+v.sourceId:'',
   v.verificationStatus==='verified'?'Source-verified':v.verificationStatus==='verification_pending'?'Verification pending':'',
   v.verificationStatus==='not_available'?'None listed in cited source':'',
   Array.isArray(v.adjoiningRegions)&&v.adjoiningRegions.length?'Adjoining Indian states/UTs: '+v.adjoiningRegions.join(', '):'',
   Array.isArray(v.internationalNeighbours)&&v.internationalNeighbours.length?'International neighbours: '+v.internationalNeighbours.join(', '):'',
   v.referenceDate?'Checked '+v.referenceDate:''
  ].filter(Boolean).join(' · ');
  return '<div class="atlas-record"><b>'+textSafe(title)+'</b>'+
   (meta?'<small>'+textSafe(meta)+'</small>':'')+
   (desc?'<p>'+textSafe(desc)+'</p>':'')+
   (v.sourceUrl?'<a href="'+textSafe(v.sourceUrl)+'" target="_blank" rel="noopener noreferrer">View source ↗</a>':'')+
   '</div>';
 }
 var populated=0;
 var cards=categories.map(function(c){
  var sourceKeys=Array.isArray(c[1])?c[1]:[c[1]],items=[];
  sourceKeys.forEach(function(key){var value=geography[key];if(Array.isArray(value))items=items.concat(value);else if(value)items.push(value)});
  if(!items.length&&sourceKeys.indexOf('languages')!==-1&&Array.isArray(record&&record.officialLanguages)){
   items=record.officialLanguages.map(function(language){return {name:language,description:'Official-language entry already recorded in the regional profile.'}});
  }
  if(items.length)populated++;
  return '<article class="atlas-geography-item"><b>'+textSafe(c[0])+'</b>'+
   (c[2]?'<small class="atlas-category-description">'+textSafe(c[2])+'</small>':'')+
   '<div class="atlas-category-records">'+(items.length?items.map(itemText).join(''):'<p class="atlas-data-pending"><strong>Verification pending.</strong> No records have been imported for this region and category yet. This is a research gap, not confirmation that the feature does not exist.</p>')+'</div></article>';
 }).join('');
 root.innerHTML='<p class="atlas-kicker">'+textSafe(eyebrow)+'</p><h3>'+textSafe(name)+' · '+textSafe(tabTitle)+'</h3>'+
  '<p class="atlas-data-pending">Showing records currently imported in the regional catalogue. Each entry displays its verification status. Categories without imported records are clearly marked Verification pending; they are not treated as zero and are not filled with guesses.</p>'+
  '<p class="atlas-data-pending">'+populated+' of '+categories.length+' categories currently contain imported records for this region. This is a data-import indicator, not a completeness score.</p>'+
  '<div class="atlas-geography-grid">'+cards+'</div>'+sourceLinks();
}
function renderGeography(name){
 renderCategoryPanel('panel-geography',name,'Physical Geography','PHYSICAL GEOGRAPHY · LANDFORMS · DRAINAGE · CLIMATE',[
  ['Geographical location & neighbours','location','Regional position and adjoining states, UTs or countries'],
  ['Mountain ranges & hills','mountainRanges','Major ranges and hill systems'],
  ['Important peaks','peaks','Named peaks and elevations'],
  ['Mountain passes','passes','Important passes and connecting routes'],
  ['Plateaus','plateaus','Major plateaus and uplands'],
  ['Plains & valleys','plains','Alluvial, coastal and regional plains; important valleys'],
  ['Major rivers','rivers','River origins, courses and tributary relationships'],
  ['Tributaries & drainage','tributaries','Tributaries and sub-tributaries'],
  ['River basins & watersheds','riverBasins','Basins, sub-basins and drainage systems'],
  ['Lakes','lakes','Natural, artificial, freshwater and saline lakes'],
  ['Glacial lakes','glacialLakes','High-altitude and glacial lakes'],
  ['Wetlands & lagoons','wetlands','Wetland geography, marshes, lagoons and estuaries'],
  ['Dams & water projects','dams','Dams and multipurpose river projects'],
  ['Reservoirs','reservoirs','Reservoirs and associated rivers'],
  ['Waterfalls','waterfalls','Named waterfalls, rivers and heights'],
  ['Soil types','soilTypes','Soil classification, distribution and characteristics'],
  ['Climate','climate','Rainfall, temperature, monsoon and climatic regions'],
  ['Coastal features','coastalFeatures','Coastline, deltas, estuaries, beaches and creeks'],
  ['Islands & reefs','islands','Island groups, reefs, channels and marine features'],
  ['Other named water bodies','waterBodies','Additional water bodies retained separately from lakes and wetlands'],
  ['Geology','geology','Rock systems, geological formations and structures']
 ]);
}
function renderEnvironment(name){
 renderCategoryPanel('panel-environment',name,'Environment & Biodiversity','ENVIRONMENT · PROTECTED AREAS · SPECIES · CONSERVATION',[
  ['National parks','nationalParks','Notified national parks and their ecosystems'],
  ['Wildlife sanctuaries','wildlifeSanctuaries','Notified wildlife sanctuaries'],
  ['Tiger reserves','tigerReserves','NTCA-notified tiger reserves and landscapes'],
  ['Elephant reserves & corridors','elephantReserves','Elephant reserves, habitats and corridors'],
  ['Biosphere reserves','biosphereReserves','Nationally notified reserves; UNESCO recognition is separately identified'],
  ['Ramsar sites','ramsarSites','Wetlands of International Importance'],
  ['Conservation reserves','conservationReserves','Notified conservation reserves'],
  ['Community reserves','communityReserves','Notified community reserves'],
  ['Marine protected areas','marineProtectedAreas','Marine and coastal protected areas'],
  ['Forests & forest cover','forestCover','Forest types and dated forest/tree-cover assessments'],
  ['Ecosystems','ecosystems','Mountain, forest, grassland, desert, coastal and marine ecosystems'],
  ['Flora & fauna','floraFauna','Important, endemic and regionally significant species'],
  ['Endangered & threatened species','endangeredSpecies','IUCN category and legal status must be distinguished'],
  ['Conservation projects','conservationProjects','Species and habitat conservation programmes'],
  ['Environmental challenges','environmentalChallenges','Documented environmental pressures'],
  ['Disaster-prone regions','disasterProneRegions','Flood, drought, cyclone, landslide and other hazards']
 ]);
}
function renderEconomy(name){
 renderCategoryPanel('panel-economy',name,'Economy & Infrastructure','ECONOMY · RESOURCES · INDUSTRY · CONNECTIVITY',[
  ['Agriculture & major crops','crops','Kharif, Rabi, Zaid and major cash crops'],
  ['Horticulture','horticulture','Fruits, vegetables, spices and plantation crops'],
  ['Minerals & mining regions',['minerals','mineralProduction'],'Mineral resources, producing districts and recorded mineral output'],
  ['Industries & industrial clusters','industries','Major sectors, industrial centres and manufacturing clusters'],
  ['Industrial corridors & zones','industrialCorridors','Industrial corridors, SEZs and industrial parks'],
  ['Power plants','powerPlants','Thermal, hydro, nuclear and renewable installations'],
  ['Renewable energy projects','renewableEnergyProjects','Solar, wind, biomass and other renewable projects'],
  ['Irrigation projects','irrigationProjects','Canals, irrigation systems and command areas'],
  ['River-valley projects','riverValleyProjects','Major river-valley projects and their existing recorded components'],
  ['Highways & expressways','highways','National highways, expressways and major corridors'],
  ['Railways','railways','Railway zones, divisions, junctions and projects'],
  ['Airports','airports','International, domestic and regional airports'],
  ['Ports & harbours','ports','Major/non-major ports and important harbours'],
  ['Inland waterways','waterways','National waterways, terminals and navigation routes'],
  ['Important institutions','institutions','Research, education, science and specialised institutions'],
  ['Economic centres & trade','economicCentres','Major commercial centres, exports and trade hubs'],
  ['Tourism economy','tourism','Major tourism circuits and economic significance']
 ]);
}
function renderHeritage(name){
 renderCategoryPanel('panel-heritage',name,'History, Culture & Heritage','HISTORY · CULTURE · ARCHAEOLOGY · IDENTITY',[
  ['Ancient kingdoms & dynasties','ancientKingdoms','Ancient states, dynasties, rulers and capitals'],
  ['Medieval kingdoms & dynasties','medievalKingdoms','Regional powers, rulers, battles and capitals'],
  ['Modern history','modernHistory','Colonial administration, princely states and regional developments'],
  ['Freedom movement','freedomMovement','Revolts, tribal uprisings, leaders and movements'],
  ['Archaeological sites','archaeologicalSites','Excavations, ancient settlements and archaeological cultures'],
  ['UNESCO World Heritage','unescoWorldHeritage','Inscribed properties; tentative-list sites are kept separate'],
  ['Historical monuments','monuments','Forts, palaces, temples, mosques and other monuments'],
  ['Festivals & fairs','festivals','Religious, harvest, tribal and cultural festivals'],
  ['Folk dances','folkDances','Regional and community dance traditions'],
  ['Classical dances','classicalDances','Recognised classical dance forms and regional associations'],
  ['Music & instruments','music','Folk music, traditions and musical instruments'],
  ['Languages','languages','Official, scheduled, regional and tribal languages'],
  ['Literature & personalities','literature','Writers, poets, scholars and literary traditions'],
  ['GI-tagged products','giProducts','Registered products, regions and registration years'],
  ['Handicrafts & traditional arts','handicrafts','Textiles, paintings, crafts and traditional art forms'],
  ['Tribal communities & PVTGs','tribalCommunities','Scheduled Tribes, PVTGs, distribution and cultural context'],
  ['Religious & pilgrimage heritage','religiousHeritage','Important pilgrimage centres and religious traditions'],
  ['Historical personalities','historicalPersonalities','Leaders, reformers, artists and notable figures'],
  ['Cultural highlights','culturalHighlights','Regional cultural highlights already recorded in the catalogue']
 ]);
}
function loadDistricts(name,token){
 var status=$('focus-status');if(status)status.textContent='Loading official district polygons for '+name+'…';
 fetch(districtUrl(name)).then(function(r){if(!r.ok)throw new Error('BharatMapService returned HTTP '+r.status);return r.json()}).then(function(data){
  if(token!==currentState||!data||!Array.isArray(data.features)||!data.features.length)throw new Error('No district polygons were returned for '+name+'.');
  renderDistrictLayer(data);renderProfile(name,data.features.length);renderGeography(name);renderEnvironment(name);renderEconomy(name);renderHeritage(name);
  if(status)status.textContent='District geometry source: Government of India BharatMapService · '+data.features.length+' features returned. Administrative and geography records are shown only when verified.';
 }).catch(function(err){
  if(token!==currentState)return;
  if(status)status.innerHTML='District boundaries could not be loaded: '+textSafe(err.message)+'. <button class="atlas-focus-retry" id="focus-retry" type="button">Retry</button>';
  var retry=$('focus-retry');if(retry)retry.addEventListener('click',function(){loadDistricts(name,token)});
  renderProfile(name,null);renderGeography(name);renderEnvironment(name);renderEconomy(name);renderHeritage(name);
 });
}
function selectRegion(feature,layer){
 if(!feature||!layer)return false;
 var name=canonicalName(rawName(feature));if(EXPECTED.indexOf(name)<0){var t=$('atlas-status');if(t)t.textContent='This feature could not be matched to a current Indian state or Union Territory. The map dataset needs updating.';return true;}
 currentState=name;currentFeature=feature;currentTab='profile';
 if(window.L){
  if(layer&&layer.setStyle)layer.setStyle({color:'#fff',weight:3,fillColor:'#ffd24a',fillOpacity:.82});
 }
 var section=$('v-india');if(section)section.classList.add('atlas-state-focus');
 var india=$('india-map');if(india)india.classList.add('atlas-map-state-focus');
 shell();
 $('focus-title').textContent=name;
 $('focus-subtitle').textContent='Selected region · actual administrative geometry · district-level exploration';
 try{initFocusMap();drawState(feature)}catch(e){$('focus-status').textContent=e.message;return true;}
 switchTab('profile');
 var wrap=$('focus-map-wrap');if(wrap&&!reduced){wrap.classList.remove('is-extracting');void wrap.offsetWidth;wrap.classList.add('is-extracting')}
 loadRegionCatalog().catch(function(){return null}).then(function(){if(currentState===name)loadDistricts(name,name)});
 return true;
}
window.ZipPrepExploreIndia={
 canonicalName:canonicalName,
 validateIndia:validateIndia,
 selectRegion:selectRegion,
 close:close
};
})();