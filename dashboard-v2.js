const MEMBERS=['Abdullah Bone','Rana','Abdullah','Momen','Ibraheem','BU'];
const FILTERS=[['member','Team Member'],['specialty','Specialty'],['zone','Zone'],['activity','Type of Activity']];
let rows=[];
let selections=Object.fromEntries(FILTERS.map(([k])=>[k,new Set()]));
let searches=Object.fromEntries(FILTERS.map(([k])=>[k,'']));
let globalQuery='';
const $=id=>document.getElementById(id);
const norm=s=>String(s??'').trim().toLowerCase().replace(/\s+/g,' ');
const n=v=>{const x=parseFloat(String(v??'').replace(/,/g,'').replace(/[^0-9.-]/g,''));return Number.isFinite(x)?x:0};
const fmt=v=>Number(v||0).toLocaleString(undefined,{maximumFractionDigits:0});
const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]));
const displayActivity=v=>v||'No Activity';

function readField(r,aliases){const keys=Object.keys(r);const key=keys.find(k=>aliases.includes(norm(k)));return key?r[key]:''}
function normalizeRow(r){const memberCosts={};MEMBERS.forEach(m=>memberCosts[m]=n(readField(r,[norm(m)])));return{customer:String(readField(r,['cust name','customer','customer name'])||'Unknown').trim(),specialty:String(readField(r,['specialty'])||'Unknown').trim(),zone:String(readField(r,['zone'])||'Unknown').trim(),activity:String(readField(r,['type of activity','type','activity'])||'').trim(),cost:n(readField(r,['cost'])),memberCosts}}
function memberHasCost(r,m){return(r.memberCosts[m]||0)!==0}
function rowMembers(r){return MEMBERS.filter(m=>memberHasCost(r,m))}
function valueFor(r,key){if(key==='activity')return displayActivity(r.activity);return String(r[key]??'')}
function effectiveCost(r){if(!selections.member.size)return r.cost||0;return[...selections.member].reduce((a,m)=>a+(r.memberCosts[m]||0),0)}
function memberPass(r){if(!selections.member.size)return true;return[...selections.member].some(m=>memberHasCost(r,m))}
function passes(r,exclude=null){if(globalQuery){const hay=[r.customer,r.specialty,r.zone,r.activity,...rowMembers(r)].join(' ').toLowerCase();if(!hay.includes(globalQuery))return false}if(exclude!=='member'&&!memberPass(r))return false;return['specialty','zone','activity'].every(k=>k===exclude||selections[k].size===0||selections[k].has(valueFor(r,k)))}
function filtered(){return rows.filter(r=>passes(r))}
function availableValues(key){if(key==='member'){if(!rows.length)return MEMBERS;return MEMBERS.filter(m=>rows.some(r=>passes(r,'member')&&memberHasCost(r,m)))}if(!rows.length)return[];return[...new Set(rows.filter(r=>passes(r,key)).map(r=>valueFor(r,key)))].sort((a,b)=>a.localeCompare(b))}

function bindFilters(){FILTERS.forEach(([key])=>{const search=$(`fs-${key}`);const list=$(`f-${key}`);const box=document.querySelector(`[data-filter-box="${key}"]`);if(!search||!list||!box)return;search.addEventListener('input',e=>{searches[key]=norm(e.target.value);renderFilter(key)});box.querySelector('[data-a="all"]').addEventListener('click',()=>{const vals=[...list.querySelectorAll('.check[data-value]')].map(x=>x.dataset.value);selections[key]=new Set([...selections[key],...vals]);updateAll()});box.querySelector('[data-a="clear"]').addEventListener('click',()=>{selections[key]=new Set();updateAll()})});renderFilters()}
function renderFilter(key){const host=$(`f-${key}`);if(!host)return;let vals=availableValues(key);const q=searches[key];if(q)vals=vals.filter(v=>norm(v).includes(q));host.innerHTML=vals.length?vals.map(v=>`<label class="check" data-value="${esc(v)}"><input type="checkbox" ${selections[key].has(v)?'checked':''}><span>${esc(v)}</span></label>`).join(''):`<div class="check">${rows.length?'No options':'Load Excel to populate'}</div>`;host.querySelectorAll('input').forEach(input=>input.addEventListener('change',e=>{const v=e.currentTarget.closest('.check').dataset.value;if(e.currentTarget.checked)selections[key].add(v);else selections[key].delete(v);updateAll()}))}
function renderFilters(){FILTERS.forEach(([k])=>renderFilter(k))}
function renderChips(){const host=$('selectedChips');if(!host)return;const chips=[];FILTERS.forEach(([k,label])=>selections[k].forEach(v=>chips.push(`<span class="chip"><strong>${esc(label)}:</strong> ${esc(v)}<button data-k="${k}" data-v="${esc(v)}" type="button">×</button></span>`)));host.innerHTML=chips.join('');host.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{selections[b.dataset.k].delete(b.dataset.v);updateAll()}))}
function group(data,key){const m=new Map();data.forEach(r=>{const k=r[key];m.set(k,(m.get(k)||0)+effectiveCost(r))});return[...m.entries()]}
function groupBy(data,getter){const m=new Map();data.forEach(r=>{const k=getter(r);m.set(k,(m.get(k)||0)+effectiveCost(r))});return[...m.entries()]}
function plot(id,traces,layout={}){if(!window.Plotly||!$(id))return;Plotly.react(id,traces,{paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{color:'#b7c3df'},margin:{l:60,r:20,t:20,b:65},legend:{orientation:'h',y:1.13},xaxis:{gridcolor:'rgba(255,255,255,.06)'},yaxis:{gridcolor:'rgba(255,255,255,.06)'},...layout},{responsive:true,displaylogo:false})}
function updateKPIs(data){$('kpiTotal').textContent=fmt(data.reduce((a,r)=>a+effectiveCost(r),0));$('kpiSpecialties').textContent=new Set(data.map(r=>r.specialty)).size.toLocaleString();$('kpiActivities').textContent=new Set(data.map(r=>displayActivity(r.activity))).size.toLocaleString();$('kpiZones').textContent=new Set(data.map(r=>r.zone)).size.toLocaleString();$('kpiCustomers').textContent=new Set(data.map(r=>r.customer)).size.toLocaleString()}
function memberTotals(data){const active=selections.member.size?[...selections.member]:MEMBERS;return active.map(m=>[m,data.reduce((a,r)=>a+(r.memberCosts[m]||0),0)])}
function updateCharts(data){
  const spec=group(data,'specialty').sort((a,b)=>b[1]-a[1]);
  plot('specialtyChart',[{x:spec.map(x=>x[1]),y:spec.map(x=>x[0]),type:'bar',orientation:'h',name:'Cost'}],{showlegend:false,margin:{l:110,r:20,t:20,b:45}});
  const zones=group(data,'zone').sort((a,b)=>b[1]-a[1]);
  plot('zoneChart',[{x:zones.map(x=>x[0]),y:zones.map(x=>x[1]),type:'bar',name:'Cost'}],{showlegend:false});
  const specs=spec.slice(0,12).map(x=>x[0]);const activities=[...new Set(data.map(r=>displayActivity(r.activity)))];
  const z=activities.map(a=>specs.map(s=>data.filter(r=>r.specialty===s&&displayActivity(r.activity)===a).reduce((t,r)=>t+effectiveCost(r),0)));
  plot('activityChart',[{x:specs,y:activities,z,type:'heatmap',hovertemplate:'Specialty: %{x}<br>Activity: %{y}<br>Cost: %{z:,.0f}<extra></extra>',colorscale:'Viridis'}],{margin:{l:115,r:20,t:20,b:85}});
  const mt=memberTotals(data).sort((a,b)=>b[1]-a[1]);
  plot('memberChart',[{x:mt.map(x=>x[0]),y:mt.map(x=>x[1]),type:'bar',name:'Cost'}],{showlegend:false});
  const memberPie=mt.filter(x=>x[1]>0);
  plot('memberPieChart',[{labels:memberPie.map(x=>x[0]),values:memberPie.map(x=>x[1]),type:'pie',hole:.48,textinfo:'percent',hovertemplate:'%{label}<br>Cost: %{value:,.0f}<br>%{percent}<extra></extra>',sort:false}],{showlegend:true,margin:{l:20,r:20,t:20,b:20},legend:{orientation:'h',y:-.08,x:.5,xanchor:'center'}});
  const activityPie=groupBy(data,r=>displayActivity(r.activity)).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  plot('activityPieChart',[{labels:activityPie.map(x=>x[0]),values:activityPie.map(x=>x[1]),type:'pie',hole:.48,textinfo:'percent',hovertemplate:'%{label}<br>Cost: %{value:,.0f}<br>%{percent}<extra></extra>',sort:false}],{showlegend:true,margin:{l:20,r:20,t:20,b:20},legend:{orientation:'h',y:-.08,x:.5,xanchor:'center'}});
  const specialtyPie=spec.filter(x=>x[1]>0);
  plot('specialtyPieChart',[{labels:specialtyPie.map(x=>x[0]),values:specialtyPie.map(x=>x[1]),type:'pie',hole:.48,textinfo:'percent',hovertemplate:'%{label}<br>Cost: %{value:,.0f}<br>%{percent}<extra></extra>',sort:false}],{showlegend:true,margin:{l:20,r:20,t:20,b:20},legend:{orientation:'h',y:-.08,x:.5,xanchor:'center'}})
}
function updateMemberTable(data){const totals=memberTotals(data).sort((a,b)=>b[1]-a[1]);const total=totals.reduce((a,x)=>a+x[1],0);$('memberCount').textContent=`${totals.length} member${totals.length===1?'':'s'}`;$('memberTable').innerHTML=totals.map(([m,c])=>`<tr><td>${esc(m)}</td><td>${fmt(c)}</td><td>${total?((c/total)*100).toFixed(1):'0.0'}%</td></tr>`).join('')}
function updateDetail(data){const m=new Map();data.forEach(r=>{const k=[r.specialty,displayActivity(r.activity),r.zone].join('|||');if(!m.has(k))m.set(k,{specialty:r.specialty,activity:displayActivity(r.activity),zone:r.zone,customers:new Set(),cost:0});const x=m.get(k);x.customers.add(r.customer);x.cost+=effectiveCost(r)});const arr=[...m.values()].filter(x=>x.cost!==0).sort((a,b)=>b.cost-a.cost).slice(0,100);$('detailTable').innerHTML=arr.map(x=>`<tr><td>${esc(x.specialty)}</td><td>${esc(x.activity)}</td><td>${esc(x.zone)}</td><td>${x.customers.size}</td><td>${fmt(x.cost)}</td></tr>`).join('')||'<tr><td colspan="5">No matching data</td></tr>'}
function updateAll(){renderFilters();renderChips();if(!rows.length)return;const data=filtered();updateKPIs(data);updateCharts(data);updateMemberTable(data);updateDetail(data);$('status').textContent=`${data.length.toLocaleString()} / ${rows.length.toLocaleString()} rows`;$('empty').classList.add('hidden')}
function resetFilters(){selections=Object.fromEntries(FILTERS.map(([k])=>[k,new Set()]));searches=Object.fromEntries(FILTERS.map(([k])=>[k,'']));globalQuery='';$('globalSearch').value='';FILTERS.forEach(([k])=>{const e=$(`fs-${k}`);if(e)e.value=''});updateAll()}
function findTrackingSheet(wb){return wb.Sheets['Tracking 2027']||wb.Sheets[wb.SheetNames.find(x=>norm(x)==='tracking 2027')]}
async function loadExcel(file){if(!window.XLSX)throw new Error('Excel library did not load');$('status').textContent='Reading Excel…';const buf=await file.arrayBuffer();const wb=XLSX.read(buf,{type:'array'});const ws=findTrackingSheet(wb);if(!ws)throw new Error('Tracking 2027 sheet not found');const raw=XLSX.utils.sheet_to_json(ws,{defval:'',raw:true});rows=raw.map(normalizeRow).filter(r=>r.customer!=='Unknown'||r.specialty!=='Unknown'||r.cost!==0||rowMembers(r).length);resetFilters();$('status').textContent=`${file.name} • ${rows.length.toLocaleString()} rows`;updateAll()}

$('excelFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{await loadExcel(f)}catch(err){console.error(err);$('status').textContent=err.message||'Could not load file'}});
$('globalSearch').addEventListener('input',e=>{globalQuery=norm(e.target.value);updateAll()});
$('clearSearch').addEventListener('click',()=>{$('globalSearch').value='';globalQuery='';updateAll()});
$('reset').addEventListener('click',resetFilters);
bindFilters();