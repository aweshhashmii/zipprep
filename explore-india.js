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
var regionCatalog=null,regionCatalogPromise=null;
var SOURCE_LINKS=[
['Election Commission of India','https://eci.gov.in/'],['Parliament of India','https://sansad.in/'],['Ministry of Panchayati Raj','https://panchayat.gov.in/'],
['Ministry of Housing and Urban Affairs','https://mohua.gov.in/'],['Census of India','https://censusindia.gov.in/'],
['BharatMapService','https://mapservice.gov.in/'],['geoBoundaries','https://www.geoboundaries.org/']
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
 return '<div class="atlas-profile-stat"><small>'+textSafe(label)+'</small><strong>'+textSafe(value||'Verification pending')+'</strong><em>'+textSafe(source||'No verified source record attached')+'</em></div>';
}
function loadRegionCatalog(){
 if(regionCatalog)return Promise.resolve(regionCatalog);
 if(!regionCatalogPromise)regionCatalogPromise=fetch('./data/explore-india-regions.json').then(function(r){if(!r.ok)throw Error('Region catalogue HTTP '+r.status);return r.json()}).then(function(data){if(!data||!Array.isArray(data.regions))throw Error('Invalid region catalogue');regionCatalog=data;return data}).catch(function(e){regionCatalogPromise=null;throw e});
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
 '<div class="atlas-focus-tabs" role="tablist" aria-label="State information"><button type="button" role="tab" id="tab-profile" aria-controls="panel-profile" aria-selected="true">STATE &amp; DISTRICT PROFILE</button><button type="button" role="tab" id="tab-geography" aria-controls="panel-geography" aria-selected="false">STATE GEOGRAPHY</button></div>'+
 '<section class="atlas-focus-content" id="panel-profile" role="tabpanel" aria-labelledby="tab-profile"></section>'+
 '<section class="atlas-focus-content" id="panel-geography" role="tabpanel" aria-labelledby="tab-geography" hidden></section>'+
 '</div>';
 $('focus-back').addEventListener('click',close);
 $('tab-profile').addEventListener('click',function(){switchTab('profile')});
 $('tab-geography').addEventListener('click',function(){switchTab('geography')});
 dash.hidden=false;
}
function switchTab(which){
 currentTab=which;var p=$('panel-profile'),g=$('panel-geography');
 if(!p||!g)return;
 p.hidden=which!=='profile';g.hidden=which!=='geography';
 $('tab-profile').setAttribute('aria-selected',String(which==='profile'));
 $('tab-geography').setAttribute('aria-selected',String(which==='geography'));
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
 var bounds=districtLayer.getBounds();if(bounds&&bounds.isValid())focusMap.fitBounds(bounds,{padding:[25,25],maxZoom:7,animate:!reduced});
 renderDistrictDirectory();
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
function selectDistrict(name,layer){
 if(selectedDistrictLayer&&districtLayer)districtLayer.resetStyle(selectedDistrictLayer);
 selectedDistrictLayer=layer;layer.setStyle({color:'#fff',weight:2.8,fillColor:'#ffd24a',fillOpacity:.78});
 var bounds=layer.getBounds();if(bounds&&bounds.isValid())focusMap.flyToBounds(bounds,{padding:[25,25],maxZoom:9,duration:reduced?0:.75});
 var profile=$('district-selected-profile');
 if(profile)profile.innerHTML='<h3>'+textSafe(name)+' — District profile</h3><div class="atlas-profile-grid">'+
 stat('District headquarters','Verification pending','Official district administration portal')+
 stat('Area','Verification pending','Official district statistical handbook')+
 stat('Population','Not loaded — Census 2011 reference required','Census of India; no current population estimate shown')+
 stat('Subdivisions / blocks','Verification pending','District administration / state government')+
 stat('Rivers and protected areas','Verification pending','Official state geography and forest department')+
 '</div><p class="atlas-data-pending">Only the district boundary and name have been loaded. Other district facts are intentionally withheld until a source record is connected.</p>';
 var root=$('district-directory');if(root)root.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.textContent===name))});
}
function renderProfile(name,count){
 var root=$('panel-profile');if(!root)return;
 var record=regionCatalog&&regionCatalog.regions.find(function(r){return r.name===name});
 var pol=record&&record.political||{},adm=record&&record.administration||{};
 var display=function(v){return v===null||v===undefined||v===''?'Verification pending':v};
 root.innerHTML='<p class="atlas-kicker">ADMINISTRATIVE &amp; POLITICAL SNAPSHOT</p><h3>'+textSafe(name)+' overview</h3><p class="atlas-data-pending">The district count below is calculated from the returned BharatMapService district features. Other changing figures remain pending until an official source record is imported.</p>'+
 '<div class="atlas-profile-grid">'+
 stat('Official capital',display(record&&record.capital),'Relevant state / UT government portal · source record pending')+
 stat('Region type',record?(record.regionType==='state'?'State':'Union Territory'):'Verification pending','Government of India administrative structure')+
 stat('Districts in loaded boundary service',count,'BharatMapService district polygons · current response')+
 stat('Chief Minister / administrator',display(pol.chiefMinisterOrAdministrator),'Relevant state/UT government portal · last verified: pending')+
 stat('Governor / Lieutenant Governor',display(pol.governorOrLieutenantGovernor),'President of India / relevant Raj Bhavan or UT administration')+
 stat('Lok Sabha elected seats',display(pol.lokSabhaSeats),'Election Commission of India / Delimitation records')+
 stat('Rajya Sabha seats',display(pol.rajyaSabhaSeats),'Parliament of India')+
 stat('Legislative Assembly membership',display(pol.assemblySeats),'Election Commission of India / state legislature')+
 stat('Legislative Council',display(pol.legislativeCouncil),'Relevant state legislature / Parliament records')+
 stat('Development blocks',display(adm.blocks),'Ministry of Panchayati Raj / state rural development department')+
 stat('Gram Panchayats',display(adm.gramPanchayats),'Ministry of Panchayati Raj / state rural development department')+
 stat('Municipal corporations',display(adm.municipalCorporations),'Ministry of Housing and Urban Affairs / state ULB directory')+
 stat('Municipalities / Nagar Panchayats',display(adm.municipalities)+' / '+display(adm.nagarPanchayats),'Ministry of Housing and Urban Affairs / state ULB directory')+
 stat('Geographical area',display(record&&record.areaSqKm)+' km²','Know India / state government portal')+
 stat('Formation date',display(record&&record.formationDate),'Relevant state / UT government portal')+
 '</div><div id="district-directory-section"><h3>District directory · '+count+' mapped districts</h3><div class="atlas-district-tools"><input id="district-search" type="search" placeholder="Search districts by name…" aria-label="Search districts"><span class="atlas-data-pending">Alphabetical · select a district to highlight it on the map</span></div><div id="district-directory" class="atlas-district-directory"></div><div id="district-selected-profile" class="atlas-district-profile" aria-live="polite"><p class="atlas-data-pending">Select a district on the map or in the directory to open its profile.</p></div></div>'+
 '<p class="atlas-data-pending">Data status: values without a verified source record are shown as “Verification pending”. No current officeholders or administrative totals are guessed. Last verified date: not yet recorded.</p>'+sourceLinks();
}
function renderGeography(name){
 var root=$('panel-geography');if(!root)return;
 var record=regionCatalog&&regionCatalog.regions.find(function(r){return r.name===name});
 var geography=record&&record.geography||{};
 var cats=[
  ['Geographical location & neighbours','location'],['Mountain ranges','mountainRanges'],['Important peaks','peaks'],['Mountain passes','passes'],
  ['Major rivers','rivers'],['River basins','riverBasins'],['Lakes & reservoirs','lakes'],['Dams & water projects','dams'],
  ['Wetlands','wetlands'],['National parks','nationalParks'],['Wildlife sanctuaries','wildlifeSanctuaries'],
  ['Tiger reserves','tigerReserves'],['Biosphere reserves','biosphereReserves'],['Ramsar sites','ramsarSites'],
  ['UNESCO World Heritage','unescoWorldHeritage'],['Monuments & archaeology','monuments'],['Mineral resources','minerals'],
  ['Major crops','crops'],['Climate','climate'],['Soil types','soilTypes'],['GI-tagged products','giProducts'],['Arts & culture','culturalHighlights']
 ];
 function itemText(v){if(typeof v==='string')return textSafe(v);if(!v)return '';var title=v.name||v.title||v.officialName||'Verified entry';var desc=v.description||v.notes||'';return '<b>'+textSafe(title)+'</b>'+(desc?'<br>'+textSafe(desc):'')+(v.sourceUrl?' · <a href="'+textSafe(v.sourceUrl)+'" target="_blank" rel="noopener">source</a>':'')}
 root.innerHTML='<p class="atlas-kicker">PHYSICAL GEOGRAPHY · NATURAL HERITAGE · EXAM FACTS</p><h3>'+textSafe(name)+' geography</h3><p class="atlas-data-pending">Only records with a populated source-backed entry are displayed. Empty categories remain clearly marked rather than being filled with generic or unrelated facts.</p><div class="atlas-geography-grid">'+cats.map(function(c){var value=geography[c[1]],items=Array.isArray(value)?value:(value?[value]:[]);return '<article class="atlas-geography-item"><b>'+textSafe(c[0])+'</b><p>'+(items.length?items.map(itemText).join('<br><br>'):'No verified records imported for '+textSafe(name)+'.')+'</p></article>'}).join('')+'</div>'+sourceLinks();
}
function loadDistricts(name,token){
 var status=$('focus-status');if(status)status.textContent='Loading official district polygons for '+name+'…';
 fetch(districtUrl(name)).then(function(r){if(!r.ok)throw new Error('BharatMapService returned HTTP '+r.status);return r.json()}).then(function(data){
  if(token!==currentState||!data||!Array.isArray(data.features)||!data.features.length)throw new Error('No district polygons were returned for '+name+'.');
  renderDistrictLayer(data);renderProfile(name,data.features.length);renderGeography(name);
  if(status)status.textContent='District geometry source: Government of India BharatMapService · '+data.features.length+' features returned. Administrative and geography records are shown only when verified.';
 }).catch(function(err){
  if(token!==currentState)return;
  if(status)status.innerHTML='District boundaries could not be loaded: '+textSafe(err.message)+'. <button class="atlas-focus-retry" id="focus-retry" type="button">Retry</button>';
  var retry=$('focus-retry');if(retry)retry.addEventListener('click',function(){loadDistricts(name,token)});
  renderProfile(name,0);renderGeography(name);
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