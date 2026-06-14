"use strict";
/* ===== Magikal Kompas — applicatielaag =====
   WERELD-data : window.PARK_DATA (repo, admin-beheerd)
   GEZELSCHAP  : per toestel in localStorage; deelbaar via link/QR (geen server)
   ADMIN-modus : ?admin in de URL ontgrendelt feit-correcties + export */

const IS_ADMIN = new URLSearchParams(location.search).has("admin");
const GENUINE_MAX = 180;

const TNL={thrill_coaster:"Thrill-achtbaan",family_coaster:"Familie-achtbaan",kiddie_coaster:"Kinderachtbaan",
spinning_coaster:"Spinning coaster",drop_tower:"Valtoren",pirate_ship:"Schommelschip",top_spin:"Top spin / overslag",
teacups:"Koffiekopjes",carousel:"Draaimolen",wave_swinger:"Zweefmolen",ferris_wheel:"Reuzenrad",
flat_spinner:"Ronddraaier",water_ride:"Waterbaan",water_battle:"Watergevecht",dark_ride:"Darkride",
transport:"Treintje / boottocht",kiddie_flat:"Kinderattractie",playground:"Speeltuin",show:"Show",funhouse:"Funhouse"};
const TYPES=Object.keys(TNL);
const TEMO={thrill_coaster:"\u{1F3A2}",family_coaster:"\u{1F39F}️",kiddie_coaster:"\u{1F68C}",
spinning_coaster:"\u{1F300}",drop_tower:"\u{1F5FC}",pirate_ship:"⛵",top_spin:"\u{1F504}",
teacups:"☕",carousel:"\u{1F3A0}",wave_swinger:"\u{1FA82}",ferris_wheel:"\u{1F3A1}",
flat_spinner:"\u{1F365}",water_ride:"\u{1F6A3}",water_battle:"\u{1F52B}",dark_ride:"\u{1F311}",
transport:"\u{1F682}",kiddie_flat:"\u{1F9F8}",playground:"\u{1F6DD}",show:"\u{1F3AD}",funhouse:"\u{1F3AA}"};
const PROPS=["nat","hoog","snel","inversies","draait","schommelt","donker"];
const PNL={nat:"Nat worden",hoog:"Hoog",snel:"Snel",inversies:"Over de kop",draait:"Rondjes draaien",schommelt:"Schommelen",donker:"In het donker"};
const PEMO={nat:"\u{1F4A6}",hoog:"\u{1F5FC}",snel:"\u{1F4A8}",inversies:"\u{1F501}",draait:"\u{1F300}",schommelt:"⛵",donker:"\u{1F311}"};

const FLAGS={BE:"\u{1F1E7}\u{1F1EA}",NL:"\u{1F1F3}\u{1F1F1}",FR:"\u{1F1EB}\u{1F1F7}",DE:"\u{1F1E9}\u{1F1EA}",LU:"\u{1F1F1}\u{1F1FA}",UK:"\u{1F1EC}\u{1F1E7}",GB:"\u{1F1EC}\u{1F1E7}"};
const COUNTRY_NL={BE:"België",NL:"Nederland",FR:"Frankrijk",DE:"Duitsland",LU:"Luxemburg",GB:"VK",UK:"VK"};
const AVA_PALETTE=["#e94f37","#3a4a6b","#7a3b96","#1f897e","#e0729a","#e08a2b","#c98b8b","#5a8b3a","#3a7a8b","#b5494a"];

/* ---- WERELD ---- */
const PARKMETA={}; const PARKEXTRA={}; const RIDES=[];
(window.PARK_DATA||[]).forEach(p=>{
  PARKMETA[p.park]=p.meta||{};
  PARKEXTRA[p.park]={logo:p.logo||null,icon:p.icon||null};
  p.rides.forEach(r=>RIDES.push(Object.assign({park:p.park},r)));
});
const parks=(window.PARK_DATA||[]).map(p=>p.park);

/* ---- GEZELSCHAP (per toestel + deelbaar) ---- */
const SKEY="ppm_party_v1";
let people=[];
let typePref={}, propPref={}, forceOv={};
let excludedParks={};
function applyConfig(d){
  if(!d)return;
  if(d.people)people=d.people;
  // Migratie ADR-016: oude `age` (jaartal) → `birthYear` (eenmalig, conservatief)
  const yT=new Date().getFullYear();
  people.forEach(p=>{
    if(p.birthYear==null&&typeof p.age==="number"){
      p.birthYear=yT-p.age;
    }
    delete p.age;
  });
  typePref=d.typePref||{}; propPref=d.propPref||{}; forceOv=d.forceOv||{};
  excludedParks=d.excludedParks||{};
}
(function load(){ try{const s=localStorage.getItem(SKEY); if(s)applyConfig(JSON.parse(s)); }catch(e){} })();
function saveParty(){ try{localStorage.setItem(SKEY,JSON.stringify({people,typePref,propPref,forceOv,excludedParks}));}catch(e){} }
const isParkOn=p=>!excludedParks[p];

/* ---- ADMIN-correcties ---- */
let typeOv={}, propOv={};
const dirtyParks=()=>{const s=new Set();RIDES.forEach(r=>{const id=rid(r);if(typeOv[id]||propOv[id])s.add(r.park);});return[...s];};

/* ---- UI-state ---- */
let sortKey="weak", tab="parken", selectedPark=null;
let countryFilter=new Set();
let searchQuery="";
let openParks={}, openEditors={};
let expanded=null, memberTab={};
let parkpickerOpen=false;
let openPopover=null;
const HMIN=70,HMAX=200;
const rid=r=>r.park+"|"+r.att;

/* ---- helpers ---- */
function initialsOf(name){
  const ws=name.replace(/[^\p{L}\p{N} ]/gu," ").split(/\s+/).filter(Boolean);
  if(!ws.length)return "??";
  if(ws.length===1)return ws[0].slice(0,2).toUpperCase();
  return (ws[0][0]+ws[1][0]).toUpperCase();
}
function colorOf(name){
  let h=0;for(let i=0;i<name.length;i++)h=(h*31+name.charCodeAt(i))>>>0;
  return AVA_PALETTE[h%AVA_PALETTE.length];
}
function avatarHTML(park){
  const ex=PARKEXTRA[park]||{};
  const src=ex.icon||ex.logo||"";
  const col=colorOf(park);
  const ini=initialsOf(park);
  const img=src?`<img src="${src}" alt="" onerror="this.remove()">`:"";
  return `<div class="avatar" style="--col:${col}"><span class="ini">${ini}</span>${img}</div>`;
}
function flagOf(park){
  const c=(PARKMETA[park]||{}).country;
  return c&&FLAGS[c]?`<span class="flag" title="${COUNTRY_NL[c]||c}">${FLAGS[c]}</span>`:"";
}
function rideThumbHTML(r){
  const t=effType(r), col=colorOf(t), emo=TEMO[t]||"?";
  const has=r.image&&r.image.url;
  const img=has?`<img src="${r.image.url}" alt="" loading="lazy" onerror="this.remove()">`:"";
  const attr=has?` data-lb="${rid(r)}"`:"";
  const cls=has?"ride-thumb has-img":"ride-thumb";
  return `<div class="${cls}" style="--col:${col}"${attr}><span class="t-emo">${emo}</span>${img}</div>`;
}

/* ================= deel-link ================= */
function b64urlEncode(str){return btoa(unescape(encodeURIComponent(str))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function b64urlDecode(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return decodeURIComponent(escape(atob(s)));}
function pickByName(map,names){const out={};names.forEach(n=>{if(map[n])out[n]=map[n];});return out;}
function configString(names){
  const sel=names&&names.length?new Set(names):new Set(people.map(p=>p.name));
  return JSON.stringify({v:1,
    people:people.filter(p=>sel.has(p.name)),
    typePref:pickByName(typePref,[...sel]),
    propPref:pickByName(propPref,[...sel]),
    forceOv:pickByName(forceOv,[...sel])});
}
function shareURL(names){return location.origin+location.pathname+"#c="+b64urlEncode(configString(names));}
function importFromHash(){
  const m=(location.hash||"").match(/c=([^&]+)/); if(!m)return false;
  try{
    const d=JSON.parse(b64urlDecode(m[1]));
    history.replaceState(null,"",location.pathname+location.search);
    if(!d||!Array.isArray(d.people)||!d.people.length)return false;
    mergeIncoming(d); return true;
  }catch(e){return false;}
}
function uniqueName(base){let i=2;while(people.some(p=>p.name===base+" "+i))i++;return base+" "+i;}
function mergeIncoming(d){
  const conflicts=d.people.filter(p=>people.some(x=>x.name===p.name));
  const nonConflicts=d.people.filter(p=>!people.some(x=>x.name===p.name));
  if(conflicts.length===0){ applyMerge(d,nonConflicts,{}); return; }
  openMergePanel(d,conflicts,nonConflicts);
}
function applyMerge(d,nonConflicts,choices){
  nonConflicts.forEach(p=>people.push(Object.assign({},p)));
  nonConflicts.forEach(p=>{
    if(d.typePref&&d.typePref[p.name])typePref[p.name]=d.typePref[p.name];
    if(d.propPref&&d.propPref[p.name])propPref[p.name]=d.propPref[p.name];
    if(d.forceOv&&d.forceOv[p.name])forceOv[p.name]=d.forceOv[p.name];
  });
  Object.keys(choices).forEach(name=>{
    const choice=choices[name], inc=d.people.find(p=>p.name===name); if(!inc)return;
    if(choice==="keep")return;
    if(choice==="overwrite"){
      const idx=people.findIndex(x=>x.name===name);
      if(idx>=0)people[idx]=Object.assign({},inc);
      delete typePref[name]; delete propPref[name]; delete forceOv[name];
      if(d.typePref&&d.typePref[name])typePref[name]=d.typePref[name];
      if(d.propPref&&d.propPref[name])propPref[name]=d.propPref[name];
      if(d.forceOv&&d.forceOv[name])forceOv[name]=d.forceOv[name];
    } else if(choice==="add"){
      const nn=uniqueName(name);
      people.push(Object.assign({},inc,{name:nn}));
      if(d.typePref&&d.typePref[name])typePref[nn]=d.typePref[name];
      if(d.propPref&&d.propPref[name])propPref[nn]=d.propPref[name];
      if(d.forceOv&&d.forceOv[name])forceOv[nn]=d.forceOv[name];
    }
  });
  saveParty(); render();
}

/* ================= scoring ================= */
// Per-as toestand → globale toestand via "strengst wint" (zie ADR-002 + ADR-016).
// Hard-uit (klein/jong/groot) > soft-uit (ontgroeid) > onbekend > begeleid > alleen.
const STATE_BUCKET={alleen:0,begeleid:1,onbekend:2,ontgroeid:3,klein:4,jong:4,groot:4};
function lengthState(h,r){
  const hasReq=r.beg!=null||r.zelf!=null||r.max!=null;
  if(h==null)return hasReq?"onbekend":"alleen";
  if(r.max!=null&&h>r.max)return r.max>=GENUINE_MAX?"groot":"ontgroeid";
  if(h>=r.zelf)return "alleen";
  if(h>=r.beg)return "begeleid";
  return "klein";
}
// Bereik [lo, hi] van mogelijke leeftijden vandaag, gegeven de precisie van de
// geboortedatum (alleen jaar / jaar+maand / jaar+maand+dag). Bij gelijk jaar+maand
// zonder dag blijft het bereik 1 wijd. Zie ADR-016.
function ageRange(p, today){
  if(p.birthYear==null)return null;
  const yT=today.getFullYear(), mT=today.getMonth()+1, dT=today.getDate();
  const y0=p.birthYear, m0=p.birthMonth, d0=p.birthDay;
  if(m0==null)return {lo:yT-y0-1, hi:yT-y0};
  if(d0==null){
    if(mT<m0)return {lo:yT-y0-1, hi:yT-y0-1};
    if(mT>m0)return {lo:yT-y0, hi:yT-y0};
    return {lo:yT-y0-1, hi:yT-y0};
  }
  let age=yT-y0;
  if(mT<m0||(mT===m0&&dT<d0))age--;
  return {lo:age, hi:age};
}
function ageStateFor(a, r){
  if(r.max_age!=null&&a>r.max_age)return "ontgroeid";
  if(r.min_age_zelf!=null&&a>=r.min_age_zelf)return "alleen";
  if(r.min_age_beg!=null&&a>=r.min_age_beg)return "begeleid";
  if(r.min_age_zelf==null&&r.min_age_beg==null)return "alleen";
  return "jong";
}
function ageState(p, r){
  const hasReq=r.min_age_zelf!=null||r.min_age_beg!=null||r.max_age!=null;
  if(!hasReq)return "alleen";
  const range=ageRange(p, new Date());
  if(!range)return "onbekend";
  const sLo=ageStateFor(range.lo, r), sHi=ageStateFor(range.hi, r);
  return sLo===sHi?sLo:"onbekend";
}
function status(p,r){
  const L=lengthState(p.h,r), A=ageState(p,r);
  return STATE_BUCKET[L]>=STATE_BUCKET[A]?L:A;
}
const canDo=s=>s==="alleen"||s==="begeleid";
const isHardOut=s=>s==="klein"||s==="jong"||s==="groot";
function dotSym(x,r){
  const s=x.s, h=x.k.h;
  if(s==="alleen")return "✓";
  if(s==="begeleid")return "B";
  if(s==="klein")return (h!=null&&r.beg!=null)?(r.beg-h):"✕";
  if(s==="jong"){
    const m=r.min_age_beg!=null?r.min_age_beg:r.min_age_zelf;
    const range=ageRange(x.k, new Date());
    return (range&&m!=null)?(m-range.hi)+"j":"j";
  }
  if(s==="ontgroeid")return "—";
  if(s==="onbekend")return "?";
  return "✕";
}
function dotMark(x,r){
  if(!canDo(x.s))return "";
  const J=joy(x.k.name,r);
  if(J.ex)return '<u class="no">✕</u>';
  if(J.j>=2)return '<u>♥</u>';
  return "";
}
const ridesOf=p=>RIDES.filter(r=>r.park===p);
const selected=()=>people.filter(p=>p.on);
const effType=r=>typeOv[rid(r)]||r.type;
function effProps(r){const id=rid(r),base=new Set(r.props),ov=propOv[id]||{};
  PROPS.forEach(p=>{if(p in ov){if(ov[p])base.add(p);else base.delete(p);}});return[...base];}
const tp=(name,ty)=>(typePref[name]&&typePref[name][ty]!=null)?typePref[name][ty]:1;
const pp=(name,pr)=>(propPref[name]&&propPref[name][pr])?propPref[name][pr]:"prima";

function joy(name,r){const id=rid(r);
  if(forceOv[name]&&forceOv[name][id]==="no")return{ex:true,j:0};
  if(forceOv[name]&&forceOv[name][id]==="love")return{ex:false,j:2};
  const props=effProps(r);
  for(const p of props){if(pp(name,p)==="nooit")return{ex:true,j:0};}
  let base=tp(name,effType(r)),pen=0; props.forEach(p=>{if(pp(name,p)==="liever")pen++;});
  return{ex:false,j:Math.max(0,base-pen)};}
function childPark(name,k,p){let score=0,fav=0,doable=0;
  ridesOf(p).forEach(r=>{if(!canDo(status(k,r)))return;const J=joy(name,r);
    if(J.ex)return;doable++;score+=J.j;if(J.j>=2)fav++;});return{score,fav,doable};}
function parkMetrics(p){const kids=selected();
  const per=kids.map(k=>({k,...childPark(k.name,k,p)}));
  const favs=per.map(x=>x.fav),scores=per.map(x=>x.score);
  const minFav=Math.min(...favs),avgFav=favs.reduce((a,b)=>a+b,0)/favs.length;
  const minScore=Math.min(...scores),avgScore=scores.reduce((a,b)=>a+b,0)/scores.length;
  let weakKid=per[0];per.forEach(x=>{if(x.fav<weakKid.fav||(x.fav===weakKid.fav&&x.score<weakKid.score))weakKid=x;});
  let samen=0,begNeeded=0;
  ridesOf(p).forEach(r=>{const st=kids.map(k=>status(k,r));
    if(st.every(canDo)){samen++;begNeeded=Math.max(begNeeded,st.filter(s=>s==="begeleid").length);}});
  return{minFav,avgFav,minScore,avgScore,weakKid,samen,begNeeded,total:ridesOf(p).length,per};}

/* ================= app-bar + rail ================= */
function renderAppBar(){
  const on=people.filter(p=>p.on).length, total=people.length;
  document.getElementById("partypill-names").textContent=`${on}/${total}`;
  const rc=document.getElementById("rail-count"); if(rc)rc.textContent=`${on}/${total}`;
  document.querySelectorAll(".modes-mob .mode").forEach(b=>b.classList.toggle("on",b.dataset.m===tab));
}
function renderRail(){
  document.querySelectorAll(".big-mode").forEach(b=>b.classList.toggle("on",b.dataset.m===tab));
  renderMembers();
}

// Borderline-detectie: een rule is "borderline" voor lid p wanneer de huidige
// geboortedatum-precisie geen eenduidig verdict toelaat (zie ADR-016).
function ageBorderline(p, r){
  if(p.birthYear==null)return false;
  if(p.birthMonth!=null&&p.birthDay!=null)return false;
  const range=ageRange(p, new Date());
  if(!range||range.lo===range.hi)return false;
  return ageStateFor(range.lo,r)!==ageStateFor(range.hi,r);
}
function missingDataFor(p){
  let needH=false, needYear=false, needPrec=false;
  parks.filter(isParkOn).forEach(park=>ridesOf(park).forEach(r=>{
    if(p.h==null&&(r.beg!=null||r.zelf!=null||r.max!=null))needH=true;
    const hasAgeReq=r.min_age_beg!=null||r.min_age_zelf!=null||r.max_age!=null;
    if(!hasAgeReq)return;
    if(p.birthYear==null)needYear=true;
    else if(ageBorderline(p,r))needPrec=true;
  }));
  const out=[];
  if(needH)out.push("lengte");
  if(needYear)out.push("geboortejaar");
  else if(needPrec)out.push("geboortemaand");
  return out;
}

function memberAgeLabel(p){
  if(p.birthYear==null)return "";
  const r=ageRange(p,new Date());
  if(!r)return "";
  return r.lo===r.hi?` · ${r.lo}<small>j</small>`:` · ${r.lo}–${r.hi}<small>j</small>`;
}

function renderMembers(){
  const el=document.getElementById("people");
  el.innerHTML="";
  people.forEach((p,i)=>{
    const open=expanded===p.name;
    const card=document.createElement("div");
    card.className="member"+(p.on?"":" off")+(open?" open":"");
    let body="";
    if(open){
      const fill=((p.h-HMIN)/(HMAX-HMIN)*100).toFixed(1); let ticks="";
      for(let cm=HMIN;cm<=HMAX;cm+=5){const x=((cm-HMIN)/(HMAX-HMIN)*100).toFixed(2);
        ticks+=`<i class="${cm%10===0?'maj':'min'}" style="left:${x}%"></i>`;}
      const mt=memberTab[p.name]||"props";
      let ctrl="";
      if(mt==="props"){
        ctrl=PROPS.map(pr=>{const cur=pp(p.name,pr);
          const tri=[["prima","prima"],["liever","liever niet"],["nooit","NOOIT"]].map(([v,l])=>
            `<button class="tri wide ${cur===v?'on '+v:''}" data-pp="${pr}" data-name="${p.name}" data-v="${v}">${l}</button>`).join("");
          return `<div class="prow"><div class="pinfo"><b>${PEMO[pr]} ${PNL[pr]}</b></div><div class="trigrp">${tri}</div></div>`;}).join("");
      } else {
        ctrl=TYPES.map(t=>{const n=RIDES.filter(r=>effType(r)===t).length; if(!n)return"";const cur=tp(p.name,t);
          const tri=[[2,"\u{1F60D}"],[1,"\u{1F642}"],[0,"\u{1F645}"]].map(([v,e])=>
            `<button class="tri ${cur===v?'on':''}" data-tp="${t}" data-name="${p.name}" data-v="${v}">${e}</button>`).join("");
          return `<div class="prow"><div class="pinfo"><b>${TEMO[t]} ${TNL[t]}</b><span>${n}</span></div><div class="trigrp">${tri}</div></div>`;}).join("");
      }
      const missing=missingDataFor(p);
      const hint=missing.length?`<div class="datahint">Vul ${missing.join(" en ")} in voor een correct verdict op ${missing.length===1?'enkele':'sommige'} attracties.</div>`:"";
      body=`<div class="m-body">
        <div class="ruler"><div class="ticks">${ticks}</div>
          <input type="range" min="${HMIN}" max="${HMAX}" value="${p.h}" step="1" data-i="${i}" style="--fill:${fill}%">
          <div class="scale"><span>${HMIN}</span><span>${HMAX} cm</span></div></div>
        <div class="agefield">
          <label>Geboortejaar <small>(optioneel)</small></label>
          <input class="byr" type="number" min="1900" max="2099" step="1" inputmode="numeric" value="${p.birthYear!=null?p.birthYear:''}" data-byri="${i}" placeholder="bv. 2018">
          <input class="bm" type="number" min="1" max="12" step="1" inputmode="numeric" value="${p.birthMonth!=null?p.birthMonth:''}" data-bmi="${i}" placeholder="mnd" ${p.birthYear==null?'disabled':''}>
          <input class="bd" type="number" min="1" max="31" step="1" inputmode="numeric" value="${p.birthDay!=null?p.birthDay:''}" data-bdi="${i}" placeholder="dag" ${p.birthMonth==null?'disabled':''}>
          ${p.birthYear!=null?`<button class="linkbtn small" data-bdclear="${i}">wissen</button>`:''}
        </div>
        ${hint}
        <div class="subtabs"><div class="subtab ${mt==='props'?'on':''}" data-mt="props" data-name="${p.name}">Eigenschappen</div>
          <div class="subtab ${mt==='types'?'on':''}" data-mt="types" data-name="${p.name}">Types</div></div>
        ${ctrl}
        <div class="m-actions"><button class="linkbtn danger" data-del="${p.name}">Verwijder lid</button></div></div>`;
    }
    card.innerHTML=`<div class="m-head" data-name="${p.name}">
      <div class="chk ${p.on?'on':''}" data-i="${i}"><svg viewBox="0 0 24 24"><polyline points="4,12 10,18 20,6"/></svg></div>
      <div class="m-name">${p.name}</div>
      <div class="m-h">${p.h!=null?`${p.h}<small>cm</small>`:'<small>geen lengte</small>'}${memberAgeLabel(p)}</div>
      <svg class="m-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9,6 15,12 9,18"/></svg>
      </div>${body}`;
    el.appendChild(card);
  });
  const add=document.createElement("div"); add.className="addmember";
  add.innerHTML='<span class="plus">+</span> Lid toevoegen';
  el.appendChild(add);
  add.onclick=addMemberPrompt;
  el.querySelectorAll(".chk").forEach(c=>c.onclick=e=>{e.stopPropagation();
    people[c.dataset.i].on=!people[c.dataset.i].on; saveParty(); render();});
  el.querySelectorAll(".m-head").forEach(h=>h.onclick=e=>{
    if(e.target.closest(".chk"))return;
    const n=h.dataset.name; expanded=expanded===n?null:n; renderMembers();});
  el.querySelectorAll("[data-del]").forEach(b=>b.onclick=e=>{e.stopPropagation();
    const name=b.dataset.del;
    if(!confirm("Verwijder "+name+" uit het gezelschap?"))return;
    people=people.filter(p=>p.name!==name);
    delete typePref[name]; delete propPref[name]; delete forceOv[name];
    if(expanded===name)expanded=null;
    saveParty(); render();});
  el.querySelectorAll('input[type=range]').forEach(s=>{
    s.oninput=()=>{const i=s.dataset.i;people[i].h=+s.value;
      s.style.setProperty("--fill",((s.value-HMIN)/(HMAX-HMIN)*100)+"%");
      const p=people[i];
      s.closest(".member").querySelector(".m-h").innerHTML=`${s.value}<small>cm</small>${memberAgeLabel(p)}`;};
    s.onchange=()=>{saveParty();renderViews();renderAppBar();};});
  const clamp=(v,lo,hi)=>v===""?null:Math.max(lo,Math.min(hi,parseInt(v,10)||lo));
  el.querySelectorAll('input[data-byri]').forEach(s=>{
    s.onchange=()=>{const i=s.dataset.byri, v=clamp(s.value.trim(),1900,2099);
      people[i].birthYear=v;
      if(v==null){people[i].birthMonth=null;people[i].birthDay=null;}
      saveParty(); renderMembers(); renderViews();};});
  el.querySelectorAll('input[data-bmi]').forEach(s=>{
    s.onchange=()=>{const i=s.dataset.bmi, v=clamp(s.value.trim(),1,12);
      people[i].birthMonth=v;
      if(v==null)people[i].birthDay=null;
      saveParty(); renderMembers(); renderViews();};});
  el.querySelectorAll('input[data-bdi]').forEach(s=>{
    s.onchange=()=>{const i=s.dataset.bdi, v=clamp(s.value.trim(),1,31);
      people[i].birthDay=v;
      saveParty(); renderMembers(); renderViews();};});
  el.querySelectorAll('[data-bdclear]').forEach(b=>b.onclick=e=>{e.stopPropagation();
    const p=people[b.dataset.bdclear]; p.birthYear=null; p.birthMonth=null; p.birthDay=null;
    saveParty(); renderMembers(); renderViews();});
  el.querySelectorAll(".subtab").forEach(b=>b.onclick=()=>{memberTab[b.dataset.name]=b.dataset.mt;renderMembers();});
  el.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{
    (propPref[b.dataset.name]=propPref[b.dataset.name]||{})[b.dataset.pp]=b.dataset.v; saveParty(); renderMembers(); renderViews();});
  el.querySelectorAll("[data-tp]").forEach(b=>b.onclick=()=>{
    (typePref[b.dataset.name]=typePref[b.dataset.name]||{})[b.dataset.tp]=+b.dataset.v; saveParty(); renderMembers(); renderViews();});
}

function addMemberPrompt(){
  const raw=prompt("Naam van het nieuwe lid?","");
  if(!raw)return;
  const name=raw.trim(); if(!name)return;
  if(people.some(p=>p.name===name)){alert("Die naam bestaat al.");return;}
  people.push({name,h:120,on:true}); expanded=name; saveParty(); render();
}

/* ================= controls (sort + filter) ================= */
const SORT_OPTIONS=[
  {k:"weak",l:"Eerlijkst (zwakste schakel)",s:"Eerlijkst"},
  {k:"avg", l:"Totaal plezier (gemiddeld)", s:"Totaal plezier"}
];
function sortShortLabel(){const o=SORT_OPTIONS.find(o=>o.k===sortKey)||SORT_OPTIONS[0];return o.s;}
function countriesInData(){
  const s=new Set();
  parks.forEach(p=>{const c=(PARKMETA[p]||{}).country;if(c)s.add(c);});
  return [...s].sort();
}
function activeCountryLabel(){
  if(countryFilter.size===0)return "Alle landen";
  if(countryFilter.size<=2)return [...countryFilter].map(c=>COUNTRY_NL[c]||c).join(", ");
  return countryFilter.size+" landen";
}
function controlsHTML(){
  const sortPop=`<div class="popover">
    ${SORT_OPTIONS.map(o=>`<div class="pop-item ${o.k===sortKey?'on':''}" data-sort="${o.k}">${o.l}${o.k===sortKey?'<span class="mark">✓</span>':''}</div>`).join("")}
  </div>`;
  const cs=countriesInData();
  const countryPop=`<div class="popover">
    <div class="pop-h">Welke landen?</div>
    ${cs.map(c=>`<div class="pop-item ${countryFilter.has(c)?'on':''}" data-country="${c}">
      <span>${FLAGS[c]||""} ${COUNTRY_NL[c]||c}</span>
      ${countryFilter.has(c)?'<span class="mark">✓</span>':''}
    </div>`).join("")}
    <div class="pop-sep"></div>
    <div class="pop-item" data-country="__all">Alle landen</div>
  </div>`;
  return `<div class="controls">
    <button class="ctrl ${openPopover==='sort'?'open active':''}" id="ctrl-sort">
      <span class="lbl">Sorteer</span><span class="v">${sortShortLabel()}</span><span class="caret">▼</span>
      ${sortPop}
    </button>
    <button class="ctrl ${openPopover==='country'?'open':''} ${countryFilter.size>0?'active':''}" id="ctrl-country">
      <span>\u{1F30D}</span><span class="v">${activeCountryLabel()}</span><span class="caret">▼</span>
      ${countryPop}
    </button>
    <input class="search" id="ctrl-search" placeholder="Park zoeken…" value="${searchQuery.replace(/"/g,'&quot;')}">
  </div>`;
}
function bindControls(root){
  const sort=root.querySelector("#ctrl-sort");
  if(sort){
    sort.addEventListener("click",e=>{
      if(e.target.closest(".pop-item"))return;
      openPopover=openPopover==="sort"?null:"sort"; renderViews();
    });
    sort.querySelectorAll("[data-sort]").forEach(it=>it.onclick=e=>{
      e.stopPropagation(); sortKey=it.dataset.sort; openPopover=null; renderViews();
    });
  }
  const cn=root.querySelector("#ctrl-country");
  if(cn){
    cn.addEventListener("click",e=>{
      if(e.target.closest(".pop-item"))return;
      openPopover=openPopover==="country"?null:"country"; renderViews();
    });
    cn.querySelectorAll("[data-country]").forEach(it=>it.onclick=e=>{
      e.stopPropagation();
      const c=it.dataset.country;
      if(c==="__all"){countryFilter.clear();}
      else{if(countryFilter.has(c))countryFilter.delete(c);else countryFilter.add(c);}
      renderViews();
    });
  }
  const s=root.querySelector("#ctrl-search");
  if(s){
    s.oninput=()=>{searchQuery=s.value;renderViews();};
    if(searchQuery){setTimeout(()=>{s.focus();s.setSelectionRange(s.value.length,s.value.length);},0);}
  }
}

/* ================= parken ================= */
function passesFilter(p){
  if(countryFilter.size>0){
    const c=(PARKMETA[p]||{}).country;
    if(!c||!countryFilter.has(c))return false;
  }
  if(searchQuery.trim()){
    if(p.toLowerCase().indexOf(searchQuery.trim().toLowerCase())===-1)return false;
  }
  return true;
}

function renderParken(){
  const el=document.getElementById("view-parken");
  if(selected().length===0){
    el.innerHTML=emptyParkenHTML();
    bindEmpty(el);
    return;
  }
  const activeParks=parks.filter(isParkOn);
  if(activeParks.length===0){
    el.innerHTML=`<div class="empty"><div class="art">\u{1F6AB}</div>
      <h2>Geen parken in de berekening</h2>
      <p>Je hebt alle parken uitgesloten. Haal er onderaan eentje terug.</p></div>`;
    appendExcludedParks(el);bindExcludedParks(el);
    return;
  }

  const filtered=activeParks.filter(passesFilter);
  const anyFav=filtered.some(p=>parkMetrics(p).avgFav>0);
  const rows=filtered.map(p=>({p,m:parkMetrics(p)}));
  rows.sort((a,b)=> sortKey==="weak"
    ? b.m.minFav-a.m.minFav||b.m.minScore-a.m.minScore||b.m.avgScore-a.m.avgScore
    : b.m.avgFav-a.m.avgFav||b.m.avgScore-a.m.avgScore);

  const maxVal=rows.reduce((m,r)=>Math.max(m, sortKey==="weak"?r.m.minFav:r.m.avgFav),0);

  let html=controlsHTML();

  if(IS_ADMIN){
    const d=dirtyParks();
    html+=`<div class="adminbar"><b>Admin-modus</b><span class="sp"></span><button class="expbtn" id="expall" ${d.length?'':'disabled'}>Exporteer ${d.length||''} park${d.length===1?'':'en'}</button></div>`;
  }

  const filtersOn=countryFilter.size>0||searchQuery.trim();
  if(filtered.length===0){
    html+=`<div class="filter-summary">0 van ${activeParks.length} parken voldoen aan de filters · <a id="clr-filters">filters wissen</a></div>`;
  } else if(filtersOn){
    html+=`<div class="filter-summary"><b>${filtered.length}</b> van ${activeParks.length} parken · <a id="clr-filters">filters wissen</a></div>`;
  }

  if(!anyFav && filtered.length>0){
    html+='<div class="hint">Nog geen voorkeuren — parken staan op aantal haalbare attracties. Klap een lid open en zet eigenschappen of types.</div>';
  }

  el.innerHTML=html;

  rows.forEach(row=>{
    const{p,m}=row;
    const card=document.createElement("div");
    card.className="park-card"+(openParks[p]?" open":"");
    const bigVal=sortKey==="weak"?m.minFav:m.avgFav.toFixed(1);
    const bigLbl=sortKey==="weak"?`favorieten voor ${m.weakKid.k.name}`:"favorieten gem.";
    const altVal=sortKey==="weak"?m.avgFav.toFixed(1):m.minFav;
    const altLbl=sortKey==="weak"?"gem. p.p.":`zwakste (${m.weakKid.k.name})`;
    const begTxt=m.begNeeded===0?`<span class="pill-warn zero">geen begeleider</span>`:`<span class="pill-warn">tot ${m.begNeeded} tegelijk begeleiden</span>`;
    const barPct=maxVal>0?Math.round((sortKey==="weak"?m.minFav:m.avgFav)/maxVal*100):0;
    card.innerHTML=`
      <div class="row" data-p="${p}">
        ${avatarHTML(p)}
        <div class="body">
          <div class="name">${p}${flagOf(p)}</div>
          <div class="meta">
            <span><b>${m.samen}</b>/${m.total} samen haalbaar</span>
            <span class="sep"></span>
            ${begTxt}
          </div>
          <div class="bar"><i style="width:${barPct}%"></i></div>
        </div>
        <div class="score">
          <b>${bigVal}</b><span class="unit">${bigLbl}</span>
          <span class="alt"><b>${altVal}</b> ${altLbl}</span>
        </div>
      </div>
      <div class="detail">${rideDetail(p)}</div>`;
    el.appendChild(card);
  });

  el.querySelectorAll(".row[data-p]").forEach(h=>h.onclick=()=>{
    const p=h.dataset.p;openParks[p]=!openParks[p];renderParken();
  });
  const ea=document.getElementById("expall"); if(ea)ea.onclick=exportDirty;
  bindControls(el);
  bindDetail(el);
  const clr=el.querySelector("#clr-filters"); if(clr)clr.onclick=()=>{countryFilter.clear();searchQuery="";renderViews();};
  el.querySelectorAll("[data-excl-p]").forEach(b=>b.onclick=e=>{e.stopPropagation();
    excludedParks[b.dataset.exclP]=true; saveParty(); renderViews();});
  appendExcludedParks(el);
  bindExcludedParks(el);
}

function emptyParkenHTML(){
  if(people.length===0){
    return `<div class="empty">
      <div class="art">\u{1F9ED}</div>
      <h2>Eerst je gezelschap</h2>
      <p>Magikal Kompas rankt parken op wat haalbaar én leuk is voor wie meegaat. Voeg minstens één lid toe — lengte bepaalt de haalbaarheid, voorkeuren bepalen het plezier.</p>
      <button class="cta" id="empty-add">+ Eerste lid toevoegen</button>
    </div>`;
  }
  return `<div class="empty">
    <div class="art">\u{1F465}</div>
    <h2>Vink minstens één lid aan</h2>
    <p>Je hebt leden in het gezelschap, maar nog niemand aangevinkt. Vink ze aan in de zijbalk om parken te ranken.</p>
  </div>`;
}
function emptyVolgordeHTML(){
  if(people.length===0){
    return `<div class="empty">
      <div class="art">\u{1F3A2}</div>
      <h2>Eerst gezelschap én park</h2>
      <p>De volgorde verandert per gezelschap. Voeg leden toe en kies daarna een park.</p>
      <button class="cta" id="empty-add">+ Eerste lid toevoegen</button>
      <div class="alt-link">Al een gezelschap? Kies dan eerst <u id="go-parken">welk park</u>.</div>
    </div>`;
  }
  return `<div class="empty">
    <div class="art">\u{1F465}</div>
    <h2>Vink minstens één lid aan</h2>
    <p>Vink leden aan in de zijbalk om de volgorde te zien.</p>
  </div>`;
}
function bindEmpty(el){
  const add=el.querySelector("#empty-add"); if(add)add.onclick=addMemberPrompt;
  const gp=el.querySelector("#go-parken"); if(gp)gp.onclick=()=>switchTab("parken");
}

function appendExcludedParks(el){
  const excluded=parks.filter(p=>!isParkOn(p));
  if(!excluded.length)return;
  const sec=document.createElement("div"); sec.className="excluded-parks";
  sec.innerHTML=`<div class="grp-lbl">Niet meegerekend · ${excluded.length}</div>`+
    excluded.map(p=>`<div class="park-mini">
      ${avatarHTML(p)}
      <div class="park-name">${p}</div>
      <button class="linkbtn" data-incl-p="${p}">Terug meenemen</button>
    </div>`).join("");
  el.appendChild(sec);
}
function bindExcludedParks(el){
  el.querySelectorAll("[data-incl-p]").forEach(b=>b.onclick=()=>{
    delete excludedParks[b.dataset.inclP]; saveParty(); renderViews();});
}
function rideDetail(p){
  const kids=selected(),rs=ridesOf(p);const g={samen:[],kleintjes:[],deels:[],niet:[]};
  rs.forEach(r=>{const st=kids.map(k=>({k,s:status(k,r)}));
    const can=st.filter(x=>canDo(x.s)).length,hardOut=st.some(x=>isHardOut(x.s));
    if(st.every(x=>canDo(x.s)))g.samen.push({r,st});else if(can===0)g.niet.push({r,st});
    else if(!hardOut)g.kleintjes.push({r,st});else g.deels.push({r,st});});
  const block=(title,arr)=>{if(!arr.length)return"";let h=`<div class="grp-lbl">${title} · ${arr.length}</div>`;
    arr.forEach(({r,st})=>{const id=rid(r),ty=effType(r),props=effProps(r);
      const liked=st.some(x=>canDo(x.s)&&!joy(x.k.name,r).ex&&joy(x.k.name,r).j>=2);
      const ptags=props.map(pr=>`<span class="ptag">${PEMO[pr]}</span>`).join("");
      const dots=st.map(x=>`<div class="dot ${x.s}" title="${x.k.name}">${dotSym(x,r)}${dotMark(x,r)}</div>`).join("");
      const thumb=rideThumbHTML(r);
      h+=`<div class="ride" data-id="${id}">${thumb}<div class="ride-n"><b>${r.att}</b> ${liked?'<em class="lk">♥</em>':''}
          <span class="r-meta"><span class="tchip">${TEMO[ty]} ${TNL[ty]}</span>${ptags}</span></div>
        <div class="dots">${dots}</div></div>
        <div class="editor ${openEditors[id]?'open':''}" data-ed="${id}">${openEditors[id]?editorHTML(r):''}</div>`;});
    return h;};
  const jump=`<div class="park-actions top"><a class="jumpbtn" href="#/wat-eerst/${SLUG_OF[p]}">Plan dit park →</a></div>`;
  return jump+block("Hele gezelschap samen",g.samen)+block("Voor de kleintjes (ouderen ontgroeid)",g.kleintjes)
    +block("Niet voor iedereen",g.deels)+block("Voor niemand (nog te klein)",g.niet)
    +`<div class="park-actions"><button class="linkbtn danger" data-excl-p="${p}">Park uit berekening halen</button></div>`;
}
function editorHTML(r){const id=rid(r),ty=effType(r),props=new Set(effProps(r));let admin="";
  if(IS_ADMIN){const tsel=TYPES.map(t=>`<button class="cbtn ${t===ty?'on':''}" data-stype="${id}" data-t="${t}">${TEMO[t]} ${TNL[t]}</button>`).join("");
    const ptog=PROPS.map(pr=>`<button class="cbtn ${props.has(pr)?'on':''}" data-sprop="${id}" data-p="${pr}">${PEMO[pr]} ${PNL[pr]}</button>`).join("");
    admin=`<div class="ed-lbl">Type beweging <small>(admin)</small></div><div class="cbtns">${tsel}</div>
      <div class="ed-lbl">Eigenschappen <small>(admin)</small></div><div class="cbtns">${ptog}</div>`;
  } else { admin=`<div class="guestnote">Type & eigenschappen zijn vaste gegevens.</div>`; }
  const fov=selected().map(k=>{const cur=forceOv[k.name]&&forceOv[k.name][id]?forceOv[k.name][id]:"auto";
    const opts=[["love","♥"],["auto","auto"],["no","✕"]].map(([v,l])=>
      `<button class="tri ${cur===v?'on':''}" data-fov="${id}" data-name="${k.name}" data-v="${v}">${l}</button>`).join("");
    return `<div class="ovrow"><span>${k.name}</span><div class="trigrp">${opts}</div></div>`;}).join("");
  return admin+`<div class="ed-lbl">Forceer per lid <small>(jouw uitzondering)</small></div>${fov}`;
}
function bindDetail(root){
  root.querySelectorAll(".ride").forEach(rrow=>rrow.onclick=e=>{
    if(e.target.closest("[data-lb]"))return;
    const id=rrow.dataset.id;openEditors[id]=!openEditors[id];renderViews();});
  root.querySelectorAll("[data-lb]").forEach(img=>img.onclick=e=>{e.stopPropagation();openLightbox(img.dataset.lb);});
  if(IS_ADMIN){
    root.querySelectorAll("[data-stype]").forEach(b=>b.onclick=e=>{e.stopPropagation();typeOv[b.dataset.stype]=b.dataset.t;renderViews();});
    root.querySelectorAll("[data-sprop]").forEach(b=>b.onclick=e=>{e.stopPropagation();
      const id=b.dataset.sprop,p=b.dataset.p,cur=effProps(RIDES.find(r=>rid(r)===id)).includes(p);
      (propOv[id]=propOv[id]||{})[p]=!cur;renderViews();});}
  root.querySelectorAll("[data-fov]").forEach(b=>b.onclick=e=>{e.stopPropagation();
    const n=b.dataset.name,id=b.dataset.fov,v=b.dataset.v;forceOv[n]=forceOv[n]||{};
    if(v==="auto")delete forceOv[n][id];else forceOv[n][id]=v;saveParty();renderViews();});
  root.querySelectorAll(".editor").forEach(ed=>ed.onclick=e=>e.stopPropagation());
}
function openLightbox(id){
  const r=RIDES.find(x=>rid(x)===id); if(!r||!r.image||!r.image.url)return;
  let lb=document.getElementById("lightbox");
  if(!lb){lb=document.createElement("div");lb.id="lightbox";lb.className="lightbox";document.body.appendChild(lb);}
  const img=r.image;
  const lic=img.license?`<span class="lb-lic">${img.license}</span>`:"";
  const src=img.source_page?`<a class="lb-src" href="${img.source_page}" target="_blank" rel="noopener">bron</a>`:"";
  lb.innerHTML=`<div class="lb-inner">
    <button class="lb-x" aria-label="Sluiten">✕</button>
    <img class="lb-img" src="${img.url}" alt="${r.att}">
    <div class="lb-attr">
      <div class="lb-title">${r.att} — ${r.park}</div>
      <div class="lb-meta">${img.attribution||""} ${lic} ${src}</div>
    </div>
  </div>`;
  lb.classList.add("show");
  const close=()=>{lb.classList.remove("show");document.removeEventListener("keydown",onKey);};
  const onKey=e=>{if(e.key==="Escape")close();};
  document.addEventListener("keydown",onKey);
  lb.onclick=e=>{if(e.target===lb)close();};
  lb.querySelector(".lb-x").onclick=e=>{e.stopPropagation();close();};
  lb.querySelector(".lb-inner").onclick=e=>e.stopPropagation();
  lb.querySelector(".lb-img").onclick=e=>e.stopPropagation();
}
function exportDirty(){
  dirtyParks().forEach(park=>{const src=(window.PARK_DATA||[]).find(p=>p.park===park);
    const out={park:src.park,meta:Object.assign({},src.meta,{updated:new Date().toISOString().slice(0,10)}),
      rides:ridesOf(park).map(r=>({att:r.att,oms:r.oms,beg:r.beg,zelf:r.zelf,max:r.max,
        min_age_beg:r.min_age_beg!=null?r.min_age_beg:null,
        min_age_zelf:r.min_age_zelf!=null?r.min_age_zelf:null,
        max_age:r.max_age!=null?r.max_age:null,
        type:effType(r),props:effProps(r),
        tag_source:(typeOv[rid(r)]||propOv[rid(r)])?"admin":r.tag_source||"auto-v1",
        tag_confidence:(typeOv[rid(r)]||propOv[rid(r)])?"verified":r.tag_confidence||"unverified",
        source_url:r.source_url||""}))};
    const slug=park.toLowerCase().replace(/ /g,"-").replace(/é/g,"e");
    const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=slug+".json";a.click();URL.revokeObjectURL(a.href);});
}

/* ================= Wat eerst? ================= */
function rideGroupScore(r){
  const kids=selected();
  let score=0,favCount=0,canCount=0;
  kids.forEach(k=>{
    const s=status(k,r); if(!canDo(s))return; canCount++;
    const J=joy(k.name,r); if(J.ex)return;
    score+=J.j; if(J.j>=2)favCount++;
  });
  return{score,favCount,canCount,total:kids.length};
}
function topRankedPark(activeParks){
  const rows=activeParks.map(p=>({p,m:parkMetrics(p)}));
  rows.sort((a,b)=> sortKey==="weak"?b.m.minFav-a.m.minFav||b.m.minScore-a.m.minScore||b.m.avgScore-a.m.avgScore
    :b.m.avgFav-a.m.avgFav||b.m.avgScore-a.m.avgScore);
  return rows[0].p;
}
function renderVolgorde(){
  const el=document.getElementById("view-volgorde");
  if(selected().length===0){el.innerHTML=emptyVolgordeHTML();bindEmpty(el);return;}
  const activeParks=parks.filter(isParkOn);
  if(activeParks.length===0){
    el.innerHTML=`<div class="empty"><div class="art">\u{1F6AB}</div>
      <h2>Geen parken in de berekening</h2>
      <p>Ga eerst naar "Welk park?" en haal een uitsluiting terug.</p>
      <button class="cta" id="go-parken">→ Welk park?</button></div>`;
    el.querySelector("#go-parken").onclick=()=>switchTab("parken");
    return;
  }
  if(!selectedPark||!activeParks.includes(selectedPark)){selectedPark=topRankedPark(activeParks);writeHash();}
  const kids=selected();
  const rides=ridesOf(selectedPark).map(r=>Object.assign({r},rideGroupScore(r)));
  rides.sort((a,b)=>b.score-a.score||b.favCount-a.favCount||b.canCount-a.canCount||a.r.att.localeCompare(b.r.att));
  const list=rides.map(({r,score,favCount})=>{
    const ty=effType(r),props=effProps(r);
    const ptags=props.map(pr=>`<span class="ptag">${PEMO[pr]}</span>`).join("");
    const liked=favCount>0;
    const thumb=rideThumbHTML(r);
    return `<div class="ride-row">
      <div class="rr-main">${thumb}<div class="rr-text">
        <div><span class="att">${r.att}</span>${liked?'<span class="heart">♥</span>':''}</div>
        <div class="tags"><span class="tchip">${TEMO[ty]} ${TNL[ty]}</span>${ptags}</div>
      </div></div>
      <div class="dots">${kids.map(k=>{const s=status(k,r);const x={k,s};
        return `<div class="dot ${s}" title="${k.name}">${dotSym(x,r)}${dotMark(x,r)}</div>`;}).join("")}</div>
      <div class="joy">${score}</div>
    </div>`;
  }).join("");
  const haalbaar=rides.filter(x=>x.canCount>0).length;

  const pickerCard=`<div class="parkpicker">
    ${avatarHTML(selectedPark)}
    <div class="nm">${selectedPark}${flagOf(selectedPark)}</div>
    <button class="chg" id="picker-toggle">${parkpickerOpen?"Sluiten":"Wissel ▾"}</button>
  </div>`;
  const pickerList=parkpickerOpen?`<div class="parkpicker-list">
    ${activeParks.map(p=>`<div class="pp-item ${p===selectedPark?'on':''}" data-vp="${p}">
      ${avatarHTML(p)}<span>${p}</span>${flagOf(p)}
    </div>`).join("")}
  </div>`:"";

  el.innerHTML=pickerCard+pickerList+
    `<div class="grp-lbl">Volgorde voor ${selectedPark} · ${haalbaar}/${rides.length} haalbaar</div>${list}`;

  el.querySelector("#picker-toggle").onclick=()=>{parkpickerOpen=!parkpickerOpen;renderVolgorde();};
  el.querySelectorAll(".pp-item").forEach(b=>b.onclick=()=>{selectedPark=b.dataset.vp;parkpickerOpen=false;writeHash();renderVolgorde();});
  el.querySelectorAll("[data-lb]").forEach(img=>img.onclick=e=>{e.stopPropagation();openLightbox(img.dataset.lb);});
}

/* ================= delen-paneel ================= */
function openShare(){
  const panel=document.getElementById("sharepanel");
  const included=new Set(people.map(p=>p.name));
  const draw=()=>{
    const names=[...included];
    const ageDesc=p=>{const r=ageRange(p,new Date()); if(!r)return null; return r.lo===r.hi?`${r.lo} j`:`${r.lo}–${r.hi} j`;};
    const sumDesc=p=>[p.h!=null?`${p.h} cm`:null,ageDesc(p)].filter(Boolean).join(" · ")||"geen lengte";
    const list=people.map(p=>`<div class="sharerow" data-shname="${p.name}">
      <div class="chk ${included.has(p.name)?'on':''}"><svg viewBox="0 0 24 24"><polyline points="4,12 10,18 20,6"/></svg></div>
      <span class="sr-name">${p.name}</span><span class="muted">${sumDesc(p)}</span></div>`).join("");
    const url=names.length?shareURL(names):"";
    const linkBlock=url?`<div class="qr" id="qr"></div>
      <div class="urlbox"><input id="shurl" readonly value="${url}"><button class="expbtn" id="shcopy">Kopieer</button></div>`
      :`<p class="muted" style="margin-top:8px">Vink minstens één lid aan om een link te maken.</p>`;
    panel.innerHTML=`<div class="sheet">
      <div class="sheet-h"><b>Deelnemers delen</b><button class="x" id="shclose">✕</button></div>
      <p class="muted">Vink aan wie je wil delen. Naam, lengte, voorkeuren en uitzonderingen reizen mee — alleen voor de aangevinkte leden. Niks gaat naar een server. De ontvanger kiest zelf wat te doen als een naam al bestaat.</p>
      <div class="sharelist">${list}</div>
      ${linkBlock}
    </div>`;
    panel.classList.add("show");
    document.getElementById("shclose").onclick=()=>panel.classList.remove("show");
    panel.querySelectorAll("[data-shname]").forEach(row=>row.onclick=()=>{
      const n=row.dataset.shname; if(included.has(n))included.delete(n);else included.add(n); draw();});
    if(url){
      document.getElementById("shcopy").onclick=()=>{const i=document.getElementById("shurl");
        i.select();try{navigator.clipboard.writeText(url);}catch(e){document.execCommand&&document.execCommand("copy");}
        document.getElementById("shcopy").textContent="Gekopieerd";};
      const qel=document.getElementById("qr");
      if(window.QRCode){ try{ new window.QRCode(qel,{text:url,width:200,height:200,correctLevel:window.QRCode.CorrectLevel.L}); }
        catch(e){ qel.innerHTML='<span class="muted">QR niet beschikbaar; gebruik de link.</span>'; } }
      else { qel.innerHTML='<span class="muted">QR-bibliotheek niet geladen; gebruik de link.</span>'; }
    }
  };
  draw();
  panel.onclick=e=>{if(e.target===panel)panel.classList.remove("show");};
}

function openMergePanel(d,conflicts,nonConflicts){
  const panel=document.getElementById("sharepanel");
  const choices={}; conflicts.forEach(p=>choices[p.name]="keep");
  const draw=()=>{
    const rows=conflicts.map(p=>{
      const cur=choices[p.name], ex=people.find(x=>x.name===p.name);
      const btn=(v,l)=>`<button class="tri wide ${cur===v?'on':''}" data-mc="${p.name}" data-v="${v}">${l}</button>`;
      const ageD=q=>{const rg=ageRange(q,new Date()); if(!rg)return null; return rg.lo===rg.hi?`${rg.lo} j`:`${rg.lo}–${rg.hi} j`;};
      const desc=q=>[q.h!=null?`${q.h} cm`:"geen lengte",ageD(q)].filter(Boolean).join(" · ");
      return `<div class="mergerow"><div class="mr-info"><b>${p.name}</b><span class="muted">bestaat al (${desc(ex)}) — inkomend ${desc(p)}</span></div>
        <div class="trigrp">${btn("keep","Behouden")}${btn("overwrite","Overschrijven")}${btn("add","Toevoegen")}</div></div>`;
    }).join("");
    const nc=nonConflicts.length?`<p class="muted" style="margin-top:10px">Nieuwe leden worden toegevoegd: <b>${nonConflicts.map(p=>p.name).join(", ")}</b>.</p>`:"";
    panel.innerHTML=`<div class="sheet">
      <div class="sheet-h"><b>Inkomende leden</b><button class="x" id="mclose">✕</button></div>
      <p class="muted">Deze namen bestaan al op dit toestel. Kies per lid wat je wil doen. "Toevoegen" geeft het inkomende lid een nieuwe naam (bv. "${conflicts[0].name} 2").</p>
      <div class="mergelist">${rows}</div>
      ${nc}
      <div class="mergeact"><button class="expbtn" id="mapply">Toepassen</button></div>
    </div>`;
    panel.classList.add("show");
    document.getElementById("mclose").onclick=()=>panel.classList.remove("show");
    panel.querySelectorAll("[data-mc]").forEach(b=>b.onclick=()=>{choices[b.dataset.mc]=b.dataset.v;draw();});
    document.getElementById("mapply").onclick=()=>{applyMerge(d,nonConflicts,choices);panel.classList.remove("show");};
  };
  draw();
  panel.onclick=e=>{if(e.target===panel)panel.classList.remove("show");};
}

/* ================= settings popover ================= */
function openSettings(){
  document.getElementById("settings").classList.add("show");
  document.getElementById("scrim").classList.add("show");
}
function closeSettings(){
  document.getElementById("settings").classList.remove("show");
  document.getElementById("scrim").classList.remove("show");
}

/* ================= hash-routing =================
   URL is single source of truth voor tab + gekozen park, zodat refresh
   (en deel-links binnen één toestel) state bewaren. Zie ADR-017. */
const SLUG_OF={}, NAME_OF={};
parks.forEach(p=>{
  const s=p.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
  SLUG_OF[p]=s; NAME_OF[s]=p;
});
function routeFromHash(){
  const h=location.hash||"";
  if(h.startsWith("#c="))return null; // deel-link, elders afgehandeld
  const m=h.match(/^#\/?([^/?]*)\/?([^/?]*)/);
  if(!m||!m[1])return{tab:"parken",park:null};
  if(m[1]==="wat-eerst"){
    const slug=decodeURIComponent(m[2]||"");
    return{tab:"volgorde",park:NAME_OF[slug]||null};
  }
  return{tab:"parken",park:null};
}
let _writingHash=false;
function writeHash(){
  const h=tab==="volgorde"
    ?(selectedPark?"#/wat-eerst/"+SLUG_OF[selectedPark]:"#/wat-eerst")
    :"#/parken";
  if(location.hash===h)return;
  _writingHash=true;
  history.replaceState(null,"",location.pathname+location.search+h);
  _writingHash=false;
}
window.addEventListener("hashchange",()=>{
  if(_writingHash)return;
  const r=routeFromHash(); if(!r)return;
  tab=r.tab;
  if(r.tab==="volgorde"&&r.park)selectedPark=r.park;
  ["parken","volgorde"].forEach(v=>document.getElementById("view-"+v).style.display=tab===v?"":"none");
  render();
});

/* ================= mode-switch + render ================= */
function renderViews(){ tab==="parken"?renderParken():renderVolgorde(); }
function render(){ renderAppBar(); renderRail(); renderViews(); }

function switchTab(name){
  tab=name; openPopover=null;
  ["parken","volgorde"].forEach(v=>document.getElementById("view-"+v).style.display=tab===v?"":"none");
  writeHash();
  render();
}

/* ================= wiring ================= */
document.getElementById("rail-modes").addEventListener("click",e=>{const b=e.target.closest(".big-mode");if(b)switchTab(b.dataset.m);});
document.getElementById("modes-mob").addEventListener("click",e=>{const b=e.target.closest(".mode");if(b)switchTab(b.dataset.m);});

const _cog=document.getElementById("cogbtn"); if(_cog)_cog.onclick=openSettings;
document.getElementById("rail-settings").onclick=openSettings;
document.getElementById("rail-about").onclick=()=>alert("Magikal Kompas — een persoonlijk hulpje om parken én attracties te kiezen op basis van lengte en voorkeuren. Alles blijft op dit toestel.");
document.getElementById("rail-share").onclick=openShare;
document.getElementById("set-share").onclick=()=>{closeSettings();openShare();};
document.getElementById("scrim").onclick=closeSettings;

const _partypill=document.getElementById("partypill");
_partypill.onclick=()=>document.getElementById("rail").classList.add("show");

const _langPills=[document.getElementById("lang-pill-mob"),document.getElementById("lang-pill-desk")].filter(Boolean);
_langPills.forEach(sel=>sel.onchange=()=>{_langPills.forEach(o=>{if(o!==sel)o.value=sel.value;});});
document.getElementById("rail-close").onclick=()=>document.getElementById("rail").classList.remove("show");

document.addEventListener("click",e=>{
  if(!e.target.closest(".ctrl")&&!e.target.closest(".popover")){
    if(openPopover){openPopover=null;renderViews();}
  }
});

if(IS_ADMIN)document.body.classList.add("admin");
if(importFromHash()){/* geladen uit deel-link */}
const _bootRoute=routeFromHash();
if(_bootRoute){
  tab=_bootRoute.tab;
  if(_bootRoute.tab==="volgorde"&&_bootRoute.park)selectedPark=_bootRoute.park;
}
["parken","volgorde"].forEach(v=>document.getElementById("view-"+v).style.display=tab===v?"":"none");
writeHash();
render();
