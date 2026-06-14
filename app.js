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
const TEMO={thrill_coaster:"\u{1F3A2}",family_coaster:"\u{1F39F}\uFE0F",kiddie_coaster:"\u{1F68C}",
spinning_coaster:"\u{1F300}",drop_tower:"\u{1F5FC}",pirate_ship:"\u26F5",top_spin:"\u{1F504}",
teacups:"\u2615",carousel:"\u{1F3A0}",wave_swinger:"\u{1FA82}",ferris_wheel:"\u{1F3A1}",
flat_spinner:"\u{1F365}",water_ride:"\u{1F6A3}",water_battle:"\u{1F52B}",dark_ride:"\u{1F311}",
transport:"\u{1F682}",kiddie_flat:"\u{1F9F8}",playground:"\u{1F6DD}",show:"\u{1F3AD}",funhouse:"\u{1F3AA}"};
const PROPS=["nat","hoog","snel","inversies","draait","schommelt","donker"];
const PNL={nat:"Nat worden",hoog:"Hoog",snel:"Snel",inversies:"Over de kop",draait:"Rondjes draaien",schommelt:"Schommelen",donker:"In het donker"};
const PEMO={nat:"\u{1F4A6}",hoog:"\u{1F5FC}",snel:"\u{1F4A8}",inversies:"\u{1F501}",draait:"\u{1F300}",schommelt:"\u26F5",donker:"\u{1F311}"};

/* ---- WERELD ---- */
const PARKMETA={}; const RIDES=[];
(window.PARK_DATA||[]).forEach(p=>{PARKMETA[p.park]=p.meta||{};
  p.rides.forEach(r=>RIDES.push(Object.assign({park:p.park},r)));});
const parks=(window.PARK_DATA||[]).map(p=>p.park);

/* ---- GEZELSCHAP (per toestel + deelbaar) ---- */
const SKEY="ppm_party_v1";
let people=[{name:"Alex",h:144,on:true},{name:"Emma",h:130,on:true},{name:"Max",h:115,on:true},
{name:"Anna",h:101,on:true},{name:"Sofia",h:81,on:true}];
let typePref={}, propPref={}, forceOv={};
let excludedParks={};
function applyConfig(d){ if(!d)return; if(d.people)people=d.people;
  typePref=d.typePref||{}; propPref=d.propPref||{}; forceOv=d.forceOv||{};
  excludedParks=d.excludedParks||{}; }
(function load(){ try{const s=localStorage.getItem(SKEY); if(s)applyConfig(JSON.parse(s)); }catch(e){} })();
function saveParty(){ try{localStorage.setItem(SKEY,JSON.stringify({people,typePref,propPref,forceOv,excludedParks}));}catch(e){} }
const isParkOn=p=>!excludedParks[p];

/* ---- ADMIN-correcties ---- */
let typeOv={}, propOv={};
const dirtyParks=()=>{const s=new Set();RIDES.forEach(r=>{const id=rid(r);if(typeOv[id]||propOv[id])s.add(r.park);});return[...s];};

/* ---- UI-state ---- */
let lens="weak", tab="parken", kidIdx=0;
let openParks={}, openEditors={};
let expanded=null, memberTab={};   // expanded = naam van open lidkaart; memberTab[naam]='props'|'types'
const HMIN=70,HMAX=200;
const rid=r=>r.park+"|"+r.att;

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

function status(h,r){ if(r.max&&h>r.max)return r.max>=GENUINE_MAX?"groot":"ontgroeid";
  if(h>=r.zelf)return "alleen"; if(h>=r.beg)return "begeleid"; return "klein"; }
const canDo=s=>s==="alleen"||s==="begeleid";
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
function childPark(name,h,p){let score=0,fav=0,doable=0;
  ridesOf(p).forEach(r=>{if(!canDo(status(h,r)))return;const J=joy(name,r);
    if(J.ex)return;doable++;score+=J.j;if(J.j>=2)fav++;});return{score,fav,doable};}
function parkMetrics(p){const kids=selected();
  const per=kids.map(k=>({k,...childPark(k.name,k.h,p)}));
  const favs=per.map(x=>x.fav),scores=per.map(x=>x.score);
  const minFav=Math.min(...favs),avgFav=favs.reduce((a,b)=>a+b,0)/favs.length;
  const minScore=Math.min(...scores),avgScore=scores.reduce((a,b)=>a+b,0)/scores.length;
  let weakKid=per[0];per.forEach(x=>{if(x.fav<weakKid.fav||(x.fav===weakKid.fav&&x.score<weakKid.score))weakKid=x;});
  let samen=0,begNeeded=0;
  ridesOf(p).forEach(r=>{const st=kids.map(k=>status(k.h,r));
    if(st.every(canDo)){samen++;begNeeded=Math.max(begNeeded,st.filter(s=>s==="begeleid").length);}});
  return{minFav,avgFav,minScore,avgScore,weakKid,samen,begNeeded,total:ridesOf(p).length,per};}

/* ================= leden + voorkeuren (samen) ================= */
function renderMembers(){
  const el=document.getElementById("people"); el.innerHTML="";
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
      body=`<div class="m-body">
        <div class="ruler"><div class="ticks">${ticks}</div>
          <input type="range" min="${HMIN}" max="${HMAX}" value="${p.h}" step="1" data-i="${i}" style="--fill:${fill}%">
          <div class="scale"><span>${HMIN}</span><span>${HMAX} cm</span></div></div>
        <div class="subtabs"><div class="subtab ${mt==='props'?'on':''}" data-mt="props" data-name="${p.name}">Eigenschappen</div>
          <div class="subtab ${mt==='types'?'on':''}" data-mt="types" data-name="${p.name}">Types</div></div>
        ${ctrl}
        <div class="m-actions"><button class="linkbtn danger" data-del="${p.name}">Verwijder lid</button></div></div>`;
    }
    card.innerHTML=`<div class="m-head" data-name="${p.name}">
      <div class="chk ${p.on?'on':''}" data-i="${i}"><svg viewBox="0 0 24 24"><polyline points="4,12 10,18 20,6"/></svg></div>
      <div class="p-name">${p.name}</div>
      <div class="p-val">${p.h}<small> cm</small></div>
      <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9,6 15,12 9,18"/></svg>
      </div>${body}`;
    el.appendChild(card);
  });
  const add=document.createElement("div"); add.className="addmember"; add.id="addmember";
  add.innerHTML='<span class="plus">+</span> Lid toevoegen';
  el.appendChild(add);
  add.onclick=()=>{
    const raw=prompt("Naam van het nieuwe lid?","");
    if(!raw)return;
    const name=raw.trim(); if(!name)return;
    if(people.some(p=>p.name===name)){alert("Die naam bestaat al.");return;}
    people.push({name,h:120,on:true}); expanded=name; saveParty(); render();
  };
  // bindings
  el.querySelectorAll(".chk").forEach(c=>c.onclick=e=>{e.stopPropagation();
    people[c.dataset.i].on=!people[c.dataset.i].on; saveParty(); render();});
  el.querySelectorAll(".m-head").forEach(h=>h.onclick=()=>{
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
      s.closest(".member").querySelector(".p-val").innerHTML=s.value+'<small> cm</small>';};
    s.onchange=()=>{saveParty();renderViews();};});
  el.querySelectorAll(".subtab").forEach(b=>b.onclick=()=>{memberTab[b.dataset.name]=b.dataset.mt;renderMembers();});
  el.querySelectorAll("[data-pp]").forEach(b=>b.onclick=()=>{
    (propPref[b.dataset.name]=propPref[b.dataset.name]||{})[b.dataset.pp]=b.dataset.v; saveParty(); renderMembers(); renderViews();});
  el.querySelectorAll("[data-tp]").forEach(b=>b.onclick=()=>{
    (typePref[b.dataset.name]=typePref[b.dataset.name]||{})[b.dataset.tp]=+b.dataset.v; saveParty(); renderMembers(); renderViews();});
}

/* ================= parken ================= */
function renderParken(){
  const el=document.getElementById("view-parken");
  if(selected().length===0){el.innerHTML='<div class="empty">Vink minstens \u00e9\u00e9n lid aan.</div>';return;}
  const activeParks=parks.filter(isParkOn);
  if(activeParks.length===0){el.innerHTML='<div class="empty">Geen parken in de berekening. Voeg er onderaan eentje terug toe.</div>';appendExcludedParks(el);bindExcludedParks(el);return;}
  const anyFav=activeParks.some(p=>parkMetrics(p).avgFav>0);
  const rows=activeParks.map(p=>({p,m:parkMetrics(p)}));
  rows.sort((a,b)=> lens==="weak"?b.m.minFav-a.m.minFav||b.m.minScore-a.m.minScore||b.m.avgScore-a.m.avgScore
    :b.m.avgFav-a.m.avgFav||b.m.avgScore-a.m.avgScore);
  let html=anyFav?"":'<div class="hint">Nog geen voorkeuren \u2014 parken staan op aantal haalbare attracties. Klap een lid open en zet eigenschappen of types.</div>';
  if(IS_ADMIN){const d=dirtyParks();
    html+=`<div class="adminbar"><b>Admin-modus</b><span class="sp"></span><button class="expbtn" id="expall" ${d.length?'':'disabled'}>Exporteer ${d.length||''} park${d.length===1?'':'en'}</button></div>`;}
  el.innerHTML=html;
  rows.forEach((row,idx)=>{const{p,m}=row;const div=document.createElement("div");
    div.className="park"+(openParks[p]?" open":"");
    const head=lens==="weak"?`<b>${m.minFav}</b><span>favorieten voor<br>${m.weakKid.k.name}</span>`
      :`<b>${m.avgFav.toFixed(1)}</b><span>favorieten<br>gemiddeld</span>`;
    const other=lens==="weak"?`gem. ${m.avgFav.toFixed(1)} fav p.p.`:`zwakste: ${m.minFav} (${m.weakKid.k.name})`;
    const begTxt=m.begNeeded===0?`<span class="beg zero">geen begeleider</span>`:`<span class="beg">tot ${m.begNeeded} tegelijk begeleiden</span>`;
    div.innerHTML=`<div class="park-h" data-p="${p}"><div class="rank">${idx+1}</div>
      <div class="park-main"><div class="park-name">${p}</div>
        <div class="park-sub">${other} &middot; ${m.samen} samen haalbaar</div><div>${begTxt}</div></div>
      <div class="park-num">${head}</div>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9,6 15,12 9,18"/></svg></div>
      <div class="detail">${rideDetail(p)}</div>`;
    el.appendChild(div);});
  el.querySelectorAll(".park-h").forEach(h=>h.onclick=()=>{const p=h.dataset.p;openParks[p]=!openParks[p];renderParken();});
  const ea=document.getElementById("expall"); if(ea)ea.onclick=exportDirty;
  bindDetail(el);
  el.querySelectorAll("[data-excl-p]").forEach(b=>b.onclick=e=>{e.stopPropagation();
    excludedParks[b.dataset.exclP]=true; saveParty(); renderViews();});
  appendExcludedParks(el);
  bindExcludedParks(el);
}
function appendExcludedParks(el){
  const excluded=parks.filter(p=>!isParkOn(p));
  if(!excluded.length)return;
  const sec=document.createElement("div"); sec.className="excluded-parks";
  sec.innerHTML=`<div class="grp-lbl">Niet meegerekend &middot; ${excluded.length}</div>`+
    excluded.map(p=>`<div class="park-mini"><div class="park-name">${p}</div>
      <button class="linkbtn" data-incl-p="${p}">Terug meenemen</button></div>`).join("");
  el.appendChild(sec);
}
function bindExcludedParks(el){
  el.querySelectorAll("[data-incl-p]").forEach(b=>b.onclick=()=>{
    delete excludedParks[b.dataset.inclP]; saveParty(); renderViews();});
}
function rideDetail(p){
  const kids=selected(),rs=ridesOf(p);const g={samen:[],kleintjes:[],deels:[],niet:[]};
  rs.forEach(r=>{const st=kids.map(k=>({k,s:status(k.h,r)}));
    const can=st.filter(x=>canDo(x.s)).length,hardOut=st.some(x=>x.s==="klein"||x.s==="groot");
    if(st.every(x=>canDo(x.s)))g.samen.push({r,st});else if(can===0)g.niet.push({r,st});
    else if(!hardOut)g.kleintjes.push({r,st});else g.deels.push({r,st});});
  const block=(title,arr)=>{if(!arr.length)return"";let h=`<div class="grp-lbl">${title} &middot; ${arr.length}</div>`;
    arr.forEach(({r,st})=>{const id=rid(r),ty=effType(r),props=effProps(r);
      const liked=st.some(x=>canDo(x.s)&&!joy(x.k.name,r).ex&&joy(x.k.name,r).j>=2);
      const ptags=props.map(pr=>`<span class="ptag">${PEMO[pr]}</span>`).join("");
      const dots=st.map(x=>{const J=canDo(x.s)?joy(x.k.name,r):null;let mark="";
        if(J){if(J.ex)mark='<u class="no">\u2715</u>';else if(J.j>=2)mark='<u>\u2665</u>';}
        const sym=x.s==="alleen"?"\u2713":x.s==="begeleid"?"B":x.s==="klein"?(r.beg-x.k.h):x.s==="ontgroeid"?"\u2014":"\u2715";
        return `<div class="dot ${x.s}" title="${x.k.name}">${sym}${mark}</div>`;}).join("");
      h+=`<div class="ride" data-id="${id}"><div class="ride-n"><b>${r.att}</b> ${liked?'<em class="lk">\u2665</em>':''}
          <span class="meta"><span class="tchip">${TEMO[ty]} ${TNL[ty]}</span>${ptags}</span></div>
        <div class="dots">${dots}</div></div>
        <div class="editor ${openEditors[id]?'open':''}" data-ed="${id}">${openEditors[id]?editorHTML(r):''}</div>`;});
    return h;};
  return block("Hele gezelschap samen",g.samen)+block("Voor de kleintjes (ouderen ontgroeid)",g.kleintjes)
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
    const opts=[["love","\u2665"],["auto","auto"],["no","\u2715"]].map(([v,l])=>
      `<button class="tri ${cur===v?'on':''}" data-fov="${id}" data-name="${k.name}" data-v="${v}">${l}</button>`).join("");
    return `<div class="ovrow"><span>${k.name}</span><div class="trigrp">${opts}</div></div>`;}).join("");
  return admin+`<div class="ed-lbl">Forceer per lid <small>(jouw uitzondering)</small></div>${fov}`;
}
function bindDetail(root){
  root.querySelectorAll(".ride").forEach(rrow=>rrow.onclick=()=>{const id=rrow.dataset.id;openEditors[id]=!openEditors[id];renderViews();});
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
function exportDirty(){
  dirtyParks().forEach(park=>{const src=(window.PARK_DATA||[]).find(p=>p.park===park);
    const out={park:src.park,meta:Object.assign({},src.meta,{updated:new Date().toISOString().slice(0,10)}),
      rides:ridesOf(park).map(r=>({att:r.att,oms:r.oms,beg:r.beg,zelf:r.zelf,max:r.max,type:effType(r),props:effProps(r),
        tag_source:(typeOv[rid(r)]||propOv[rid(r)])?"admin":r.tag_source||"auto-v1",
        tag_confidence:(typeOv[rid(r)]||propOv[rid(r)])?"verified":r.tag_confidence||"unverified",
        source_url:r.source_url||""}))};
    const slug=park.toLowerCase().replace(/ /g,"-").replace(/é/g,"e");
    const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=slug+".json";a.click();URL.revokeObjectURL(a.href);});
}

/* ================= Per lid ================= */
function renderKind(){
  const el=document.getElementById("view-kind");const on=people.filter(p=>p.on);
  if(on.length===0){el.innerHTML='<div class="empty">Vink minstens \u00e9\u00e9n lid aan.</div>';return;}
  if(kidIdx>=people.length||!people[kidIdx].on)kidIdx=people.indexOf(on[0]);
  const kid=people[kidIdx];
  const pills=people.map((p,i)=>p.on?`<div class="pill ${i===kidIdx?'on':''}" data-k="${i}">${p.name}</div>`:"").join("");
  let al=0,be=0,kl=0,og=0;
  RIDES.forEach(r=>{if(!isParkOn(r.park))return;const s=status(kid.h,r);if(s==="alleen")al++;else if(s==="begeleid")be++;else if(s==="klein")kl++;else if(s==="ontgroeid")og++;});
  const ogBox=og>0?`<div class="kbox"><b>${og}</b><span>ontgroeid</span></div>`:"";
  let pprk="";parks.filter(isParkOn).forEach(p=>{const rs=ridesOf(p);let can=0,rel=0,beg=0;
    rs.forEach(r=>{const s=status(kid.h,r);if(s==="ontgroeid")return;rel++;if(canDo(s))can++;if(s==="begeleid")beg++;});
    const pct=Math.round(can/(rel||1)*100);
    pprk+=`<div class="ride" style="cursor:default"><div class="ride-n"><b>${p}</b><span>${beg?beg+' met begeleider':'alles alleen wat past'}</span></div>
      <div class="park-num"><b style="font-size:18px">${can}/${rel}</b><span>${pct}%</span></div></div>`;});
  el.innerHTML=`<div class="kidpick">${pills}</div>
    <div class="kstat"><div class="kbox al"><b>${al}</b><span>alleen</span></div>
      <div class="kbox be"><b>${be}</b><span>begeleid</span></div>
      <div class="kbox"><b>${kl}</b><span>te klein</span></div>${ogBox}</div>
    <div class="park" style="cursor:default"><div class="detail" style="display:block;border-top:none;padding-top:4px">
      <div class="grp-lbl">Per park &middot; wat ${kid.name} (${kid.h} cm) kan</div>${pprk}</div></div>`;
  el.querySelectorAll(".kidpick .pill").forEach(b=>b.onclick=()=>{kidIdx=+b.dataset.k;renderKind();});
}

/* ================= delen-paneel ================= */
function openShare(){
  const panel=document.getElementById("sharepanel");
  const included=new Set(people.map(p=>p.name));
  const draw=()=>{
    const names=[...included];
    const list=people.map(p=>`<div class="sharerow" data-shname="${p.name}">
      <div class="chk ${included.has(p.name)?'on':''}"><svg viewBox="0 0 24 24"><polyline points="4,12 10,18 20,6"/></svg></div>
      <span class="sr-name">${p.name}</span><span class="muted">${p.h} cm</span></div>`).join("");
    const url=names.length?shareURL(names):"";
    const linkBlock=url?`<div class="qr" id="qr"></div>
      <div class="urlbox"><input id="shurl" readonly value="${url}"><button class="expbtn" id="shcopy">Kopieer</button></div>`
      :`<p class="muted" style="margin-top:8px">Vink minstens \u00e9\u00e9n lid aan om een link te maken.</p>`;
    panel.innerHTML=`<div class="sheet">
      <div class="sheet-h"><b>Leden overzetten</b><button class="x" id="shclose">\u2715</button></div>
      <p class="muted">Vink aan wie je wil overzetten. Naam, lengte, voorkeuren en uitzonderingen reizen mee \u2014 alleen voor de aangevinkte leden. Niks gaat naar een server. De ontvanger kiest zelf wat te doen als een naam al bestaat.</p>
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
      return `<div class="mergerow"><div class="mr-info"><b>${p.name}</b><span class="muted">bestaat al (${ex.h} cm) \u2014 inkomend ${p.h} cm</span></div>
        <div class="trigrp">${btn("keep","Behouden")}${btn("overwrite","Overschrijven")}${btn("add","Toevoegen")}</div></div>`;
    }).join("");
    const nc=nonConflicts.length?`<p class="muted" style="margin-top:10px">Nieuwe leden worden toegevoegd: <b>${nonConflicts.map(p=>p.name).join(", ")}</b>.</p>`:"";
    panel.innerHTML=`<div class="sheet">
      <div class="sheet-h"><b>Inkomende leden</b><button class="x" id="mclose">\u2715</button></div>
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

function renderViews(){ tab==="parken"?renderParken():renderKind(); }
function render(){ renderMembers(); renderViews(); }

document.getElementById("lens").onclick=e=>{const t=e.target.closest(".pill");if(!t)return;
  lens=t.dataset.l;document.querySelectorAll("#lens .pill").forEach(p=>p.classList.toggle("on",p===t));renderParken();};
document.querySelector(".tabs").onclick=e=>{const t=e.target.closest(".tab");if(!t)return;
  tab=t.dataset.tab;document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("on",x===t));
  ["parken","kind"].forEach(v=>document.getElementById("view-"+v).style.display=tab===v?"":"none");
  document.getElementById("lensrow").style.display=(tab==="parken")?"flex":"none";
  renderViews();};
document.getElementById("sharebtn").onclick=openShare;

if(IS_ADMIN)document.body.classList.add("admin");
if(importFromHash()){/* geladen uit deel-link */}
render();
