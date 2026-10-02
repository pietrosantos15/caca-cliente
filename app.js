/* ====== utilidades ====== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {get(k,d){try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const hav = (a,b,c,d) => {const R=6371,r=Math.PI/180,dx=(c-a)*r,dy=(d-b)*r,x=Math.sin(dx/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(x))};

/* ====== nichos -> tags OSM ====== */
const NICHES = [
 {l:"Restaurantes",k:["restaurante","restaurant"],f:["amenity=restaurant"]},
 {l:"Lanchonetes",k:["lanchonete","fast food","hamburgueria","pizzaria"],f:["amenity=fast_food"]},
 {l:"Cafeterias",k:["cafe","cafeteria"],f:["amenity=cafe"]},
 {l:"Bares",k:["bar","pub","boteco"],f:["amenity=bar|pub"]},
 {l:"Padarias",k:["padaria","confeitaria"],f:["shop=bakery"]},
 {l:"Salão de beleza",k:["salao","beleza","cabeleireiro","cabeleireira","barbearia","barbeiro","manicure","estetica"],f:["shop=hairdresser|beauty"]},
 {l:"Academias",k:["academia","fitness","crossfit"],f:["leisure=fitness_centre"]},
 {l:"Clínicas / médicos",k:["clinica","medico","consultorio","fisioterapia"],f:["amenity=clinic|doctors"]},
 {l:"Dentista",k:["dentista","odontologia","dentist"],f:["amenity=dentist"]},
 {l:"Veterinária",k:["veterinaria","veterinario","vet"],f:["amenity=veterinary"]},
 {l:"Pet shop",k:["pet shop","petshop","pet"],f:["shop=pet"]},
 {l:"Oficina mecânica",k:["oficina","mecanica","mecanico","auto center"],f:["shop=car_repair"]},
 {l:"Autopeças",k:["autopecas","auto pecas","pecas"],f:["shop=car_parts"]},
 {l:"Imobiliária",k:["imobiliaria","corretor","imoveis"],f:["office=estate_agent"]},
 {l:"Advogado",k:["advogado","advocacia","escritorio de advocacia"],f:["office=lawyer"]},
 {l:"Contabilidade",k:["contabilidade","contador"],f:["office=accountant"]},
 {l:"Loja de roupas",k:["roupa","moda","boutique","loja de roupas"],f:["shop=clothes"]},
 {l:"Floricultura",k:["floricultura","flores"],f:["shop=florist"]},
 {l:"Farmácia",k:["farmacia","drogaria"],f:["amenity=pharmacy"]},
 {l:"Pousada / hotel",k:["pousada","hotel","hostel"],f:["tourism=hotel|guest_house|hostel"]},
 {l:"Autoescola",k:["autoescola","auto escola","cfc"],f:["amenity=driving_school"]},
 {l:"Escola de idiomas",k:["idiomas","ingles","curso de ingles"],f:["amenity=language_school"]},
 {l:"Eletricista / encanador",k:["eletricista","encanador","marceneiro","pintor","serviços","servicos"],f:["craft=electrician|plumber|carpenter|painter|hvac"]},
 {l:"Tatuagem",k:["tatuagem","tatuador","tattoo"],f:["shop=tattoo"]},
 {l:"Ótica",k:["otica","oculos"],f:["shop=optician"]},
 {l:"Supermercado / mercado",k:["mercado","supermercado","mercearia"],f:["shop=supermarket|convenience"]},
 {l:"Material de construção",k:["material de construcao","construcao","ferragens"],f:["shop=hardware|doityourself"]},
 {l:"Lavanderia",k:["lavanderia","lava rapido","lavagem"],f:["shop=laundry","amenity=car_wash"]},
];
$("nl").innerHTML = NICHES.map(n => `<option value="${esc(n.l)}">`).join("");
function resolveNiche(q){
  const t = norm(q);
  const direct = q.trim().match(/^([\w:]+)=([\w|:-]+)$/);
  if(direct) return {f:[q.trim()], label:q.trim()};
  const hit = NICHES.find(n => norm(n.l) === t) || NICHES.find(n => n.k.some(k => k === t)) || NICHES.find(n => n.k.some(k => t.includes(k) && k.length > 3));
  if(hit) return {f:hit.f, label:hit.l.toLowerCase()};
  return {name:t, label:q.trim().toLowerCase()};
}

/* ====== telefones ====== */
function normPhone(raw, cc){
  const first = String(raw).split(/[;,\/]| ou /)[0];
  let d = first.replace(/\D/g, "");
  if(first.trim().startsWith("00")) d = d.slice(2);
  if(!d) return null;
  if(cc === "55"){
    if(d.startsWith("55") && (d.length === 12 || d.length === 13)) return d;
    d = d.replace(/^0+/, "");
    if(d.length === 10 || d.length === 11) return "55" + d;
    return null;
  }
  return d.startsWith(cc) ? d : cc + d;
}
function fmtPhone(n, cc){
  if(cc === "55" && n.startsWith("55")){
    const l = n.slice(2), r = l.slice(2);
    return `(${l.slice(0,2)}) ${r.length === 9 ? r.slice(0,5)+"-"+r.slice(5) : r.slice(0,4)+"-"+r.slice(4)}`;
  }
  return "+" + n;
}
const isBRMobile = n => n.startsWith("55") && n.length === 13 && n[4] === "9";

/* ====== estado ====== */
const STAGES = [["novo","Novo"],["contactado","Contactado"],["respondeu","Respondeu"],["reuniao","Reunião"],["fechado","Fechado ✅"],["perdido","Perdido"]];
const stageName = k => STAGES.find(s => s[0] === k)[1];
let S = store.get("gc_state", {});           // id -> {stage, notes, manual, snap}
const DEFAULT_TPL = "Olá, tudo bem? Aqui é {eu}, desenvolvedor web aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
const OLD_TPL = "Olá, tudo bem? Meu nome é Pietro e eu trabalho com programação. Vi que a {nome} atua em {cidade} mas não encontrei um site de vocês. Faço páginas simples que ajudam {nicho} a receber mais clientes pelo WhatsApp. Posso te mostrar um exemplo rápido, sem compromisso?";
let cfg = store.get("gc_cfg", {me:"", cc:"55", tpl:DEFAULT_TPL});
if(cfg.tpl === OLD_TPL){ cfg.tpl = DEFAULT_TPL; store.set("gc_cfg", cfg); }
let leads = [], ctx = null, selId = null, filt = {wa:false, ig:false, em:false, site:false}, view = "map";
const stageOf = l => S[l.id]?.stage || "novo";
const saveS = () => store.set("gc_state", S);
const saveCfg = () => store.set("gc_cfg", cfg);
const msgFor = l => cfg.tpl.replaceAll("{nome}", l.name).replaceAll("{nicho}", l.nicho || "comércios").replaceAll("{cidade}", l.city || "sua cidade").replaceAll("{eu}", cfg.me || "um desenvolvedor web");
const waLink = l => l.whatsapp ? `https://wa.me/${l.whatsapp}?text=${encodeURIComponent(msgFor(l))}` : "";
function setStage(l, stage){
  S[l.id] = Object.assign(S[l.id] || {}, {stage, snap:l});
  if(stage === "novo" && !S[l.id].notes && !S[l.id].manual) delete S[l.id];
  saveS();
}
function applyManual(l){
  const m = S[l.id]?.manual; if(!m) return l;
  const n = normPhone(m, cfg.cc); if(n){ l.phone = n; l.whatsapp = n; l.waKind = "informado por você"; }
  return l;
}

/* ====== mapa ====== */
const map = L.map("map", {zoomControl:true}).setView([-15.78,-47.93], 4);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom:19, attribution:"© OpenStreetMap"}).addTo(map);
const layer = L.layerGroup().addTo(map); let circle = null; const markers = {};
const COLORS = {hot:"#ef6a3c", warm:"#f0a020", cold:"#8593a3"};

function toast(t, err){ const m = $("msgbar"); m.textContent = t; m.className = err ? "err" : ""; m.hidden = !t; }

/* ====== busca ====== */
async function geocode(q){
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=pt-BR" + (cfg.cc === "55" ? "&countrycodes=br" : "") + "&q=" + encodeURIComponent(q));
  if(!r.ok) throw new Error("Falha ao localizar a cidade (Nominatim).");
  const j = await r.json(); if(!j.length) throw new Error("Cidade não encontrada. Tente 'Cidade, Estado'.");
  return {lat:+j[0].lat, lon:+j[0].lon, name:(j[0].display_name||"").split(",").slice(0,3).join(",").trim()};
}
function buildQuery(nq, lat, lon, rad){
  const around = `(around:${Math.round(rad*1000)},${lat},${lon})`;
  let parts;
  if(nq.f) parts = nq.f.map(f => { const [k,v] = f.split("="); const c = v.includes("|") ? `["${k}"~"^(${v})$"]` : `["${k}"="${v}"]`; return `nwr${c}["name"]${around};`; });
  else parts = [`nwr["name"~"${nq.name.replace(/[^a-z0-9 ]/g,"")}",i]${around};`];
  return `[out:json][timeout:25][maxsize:67108864];(${parts.join("")});out center tags;`;
}
const OVERPASS_EPS = ["https://overpass.openstreetmap.fr/api/interpreter","https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter"];
async function overpassOnce(q, ctl){
  // dispara em todos os servidores ao mesmo tempo; vale o primeiro que responder bem
  const tryEp = async ep => {
    const r = await fetch(ep, {method:"POST", body:"data="+encodeURIComponent(q), headers:{"Content-Type":"application/x-www-form-urlencoded"}, signal:ctl.signal});
    if(!r.ok) throw new Error("Overpass respondeu "+r.status);
    const j = await r.json(); if(!j || !Array.isArray(j.elements)) throw new Error("Resposta inválida do Overpass");
    return j;
  };
  return Promise.any(OVERPASS_EPS.map(tryEp));
}
async function overpass(q){
  let last;
  for(let i = 0; i < 2; i++){
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    try{ const j = await overpassOnce(q, ctl); ctl.abort(); return j; }
    catch(e){ last = e.errors?.[0] || e; if(i === 0) toast("Servidor ocupado, tentando de novo…"); await new Promise(r => setTimeout(r, 1500)); }
    finally{ clearTimeout(timer); }
  }
  throw new Error("Os servidores do OpenStreetMap estão sobrecarregados. Tente de novo em instantes ou diminua o raio. ("+(last?.message||"sem resposta")+")");
}
function build(el){
  const t = el.tags || {}, lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon; if(lat == null) return null;
  const cc = cfg.cc || "55";
  const hasSite = !!(t.website || t["contact:website"] || t.url || t["contact:url"]);
  const waTag = t["contact:whatsapp"] || t.whatsapp;
  const phones = [t.phone, t["contact:phone"], t.mobile, t["contact:mobile"]].filter(Boolean).map(p => normPhone(p, cc)).filter(Boolean);
  const wa = waTag ? normPhone(waTag, cc) : null;
  let phone = phones[0] || null, whatsapp = null, waKind = "";
  if(wa){ whatsapp = wa; waKind = "confirmado"; phone = phone || wa; }
  else { const m = phones.find(isBRMobile); if(m){ whatsapp = m; waKind = "provável (celular)"; } }
  const ig = t["contact:instagram"] || t.instagram, fb = t["contact:facebook"] || t.facebook;
  const insta = ig ? (ig.startsWith("http") ? ig : "https://instagram.com/" + ig.replace(/^@/,"")) : "";
  const face = fb ? (fb.startsWith("http") ? fb : "https://facebook.com/" + fb) : "";
  const email = t.email || t["contact:email"] || "";
  const addr = [[t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(", "), t["addr:suburb"] || t["addr:neighbourhood"], t["addr:city"]].filter(Boolean).join(" · ");
  const dist = hav(ctx.lat, ctx.lon, lat, lon);
  let score = 20;
  if(phone) score += 25; if(whatsapp) score += waKind === "confirmado" ? 25 : 15;
  if(insta || face) score += 8; if(email) score += 5; if(t.opening_hours) score += 5; if(addr) score += 5; if(dist <= ctx.rad/2) score += 5;
  if(hasSite) score -= 40;
  score = Math.max(0, Math.min(100, score));
  const l = {id: el.type[0]+el.id, name:t.name, lat, lon, dist, addr, phone, whatsapp, waKind, insta, face, email, hours:t.opening_hours||"", hasSite, site:t.website||t["contact:website"]||t.url||"",
    score, temp: score >= 70 ? "hot" : score >= 45 ? "warm" : "cold", city:ctx.cityShort, nicho:ctx.label,
    osm:`https://www.openstreetmap.org/${el.type}/${el.id}`, google:"https://www.google.com/search?q="+encodeURIComponent(`"${t.name}" ${ctx.cityShort}`)};
  return applyManual(l);
}
// descarta WhatsApp com DDD diferente do predominante na região (evita número de outra cidade/homônimo)
function checkDDD(arr){
  const dd = l => l.phone && l.phone.startsWith("55") ? l.phone.slice(2,4) : null;
  const cnt = {}; arr.forEach(l => { const d = dd(l); if(d) cnt[d] = (cnt[d]||0)+1; });
  const top = Object.entries(cnt).sort((a,b) => b[1]-a[1])[0];
  if(!top || top[1] < 3) return;
  arr.forEach(l => { const d = dd(l);
    if(d && d !== top[0] && l.waKind !== "informado por você"){ l.dddWarn = d; l.whatsapp = null; l.waKind = ""; } });
}
const hasContact = l => !!(l.phone || l.whatsapp || l.insta || l.face || l.email);

async function search(niche, city, rad){
  const btn = $("go"); btn.disabled = true; toast("Localizando cidade…");
  try{
    const nq = resolveNiche(niche);
    const g = await geocode(city);
    ctx = {lat:g.lat, lon:g.lon, rad, label:nq.label, cityShort:city.split(",")[0].trim()};
    map.setView([g.lat,g.lon], rad > 15 ? 10 : rad > 8 ? 11 : rad > 3 ? 12 : 13);
    if(circle) circle.remove(); circle = L.circle([g.lat,g.lon], {radius:rad*1000, color:"#3b82f6", weight:1.5, fillOpacity:.03}).addTo(map);
    toast("Buscando em "+(g.name||city)+"… pode levar alguns segundos");
    const data = await overpass(buildQuery(nq, g.lat, g.lon, rad));
    const seen = new Set();
    leads = (data.elements||[]).map(build).filter(Boolean).filter(l => l.dist <= rad).filter(l => !seen.has(l.id) && seen.add(l.id));
    checkDDD(leads);
    selId = null;
    const h = store.get("gc_hist", []).filter(x => !(x.niche===niche && x.city===city));
    h.unshift({niche, city, rad}); store.set("gc_hist", h.slice(0,10));
    toast(leads.length ? "" : "Nada encontrado. Aumente o raio ou tente outro nicho (o OSM pode ter poucos dados aí).", !leads.length);
    renderAll();
  }catch(e){ toast(e.message || String(e), true); }
  finally{ btn.disabled = false; }
}

/* ====== listas e render ====== */
function visible(){
  let a = leads.filter(l => filt.site || !l.hasSite);
  if(filt.wa) a = a.filter(l => l.whatsapp);
  if(filt.ig) a = a.filter(l => l.insta || l.face);
  if(filt.em) a = a.filter(l => l.email);
  const by = $("sort").value;
  return a.sort((x,y) => by==="dist" ? x.dist-y.dist : by==="name" ? x.name.localeCompare(y.name) : y.score-x.score);
}
function renderAll(){ renderList(); renderMap(); renderKanban(); renderDash(); }

function renderList(){
  const has = leads.length > 0;
  ["exp","filters","chips","fireWrap"].forEach(i => $(i).hidden = !has);
  if(!has){ $("list").innerHTML = ""; return; }
  const vis = visible(), noSite = leads.filter(l => !l.hasSite);
  const rich = noSite.filter(hasContact).length;
  $("stats").innerHTML = `<b>${noSite.length}</b> sem site (de ${leads.length} no raio) · <b>${rich}/${noSite.length}</b> com contato`;
  const q = vis.filter(l => l.whatsapp && stageOf(l) === "novo").length;
  $("fire").textContent = `🚀 Modo disparo (${q})`; $("fire").disabled = !q;
  $("list").innerHTML = vis.map(l => `<div class="card ${l.id===selId?"sel":""} ${stageOf(l)!=="novo"?"done":""}" data-id="${l.id}">
    <div class="row1"><b>${esc(l.name)}</b><span class="temp"><span class="tb ${l.temp}">${{hot:"Quente",warm:"Morno",cold:"Frio"}[l.temp]}</span>${l.score}</span></div>
    <div class="addr">${esc(l.addr || "Endereço não informado")} · ${l.dist.toFixed(1)} km</div>
    ${l.phone ? `<div>📞 ${esc(fmtPhone(l.phone, cfg.cc))}${l.dddWarn ? ` <span class="tag" title="O DDD deste número é diferente do predominante na região. Confira antes de ligar.">⚠ DDD ${esc(l.dddWarn)} diferente da região</span>` : ""}</div>` : ""}
    <div class="acts">
      ${l.whatsapp ? `<a class="btn wa" data-act="wa" href="${esc(waLink(l))}" target="_blank" rel="noopener">💬 WhatsApp</a>` : ""}
      <button class="btn" data-act="det" type="button">📝 Detalhes</button>
      <a class="btn" href="${esc(l.google)}" target="_blank" rel="noopener">🔍 Buscar</a>
    </div>
    <div class="acts">
      ${hasContact(l) ? `${l.whatsapp?`<span class="tag">WhatsApp ${esc(l.waKind)}</span>`:""}${l.insta?`<a class="tag" href="${esc(l.insta)}" target="_blank" rel="noopener">Instagram</a>`:""}${l.face?`<a class="tag" href="${esc(l.face)}" target="_blank" rel="noopener">Facebook</a>`:""}${l.email?`<span class="tag">${esc(l.email)}</span>`:""}` : `<span class="tag">nenhum contato encontrado</span>`}
      ${l.hasSite ? `<span class="tag site">tem site</span>` : ""}
      ${stageOf(l)!=="novo" ? `<span class="tag stg">${stageName(stageOf(l))}</span>` : ""}
    </div></div>`).join("") || `<div class="addr">Nenhum lead com esses filtros.</div>`;
}

function renderMap(){
  layer.clearLayers(); for(const k in markers) delete markers[k];
  visible().forEach(l => {
    const mk = L.circleMarker([l.lat,l.lon], {radius:l.id===selId?10:7, color:l.id===selId?"#16a34a":"#fff", weight:2, fillColor:stageOf(l)!=="novo"?"#8593a3":COLORS[l.temp], fillOpacity:.95})
      .bindPopup(`<b>${esc(l.name)}</b><br>${l.phone ? esc(fmtPhone(l.phone,cfg.cc))+"<br>" : ""}${l.whatsapp ? `<a href="${esc(waLink(l))}" target="_blank" rel="noopener">💬 Chamar no WhatsApp</a>` : "<i>sem WhatsApp</i>"}`)
      .on("click", () => select(l.id, false)).addTo(layer);
    markers[l.id] = mk;
  });
}
function select(id, fly){
  selId = id; renderList(); renderMap();
  const l = leads.find(x => x.id === id);
  if(fly && l){ map.flyTo([l.lat,l.lon], Math.max(map.getZoom(),15), {duration:.6}); setTimeout(() => markers[id]?.openPopup(), 650); }
  document.querySelector(`.card[data-id="${id}"]`)?.scrollIntoView({block:"nearest", behavior:"smooth"});
}

function allTracked(){
  const m = new Map();
  leads.filter(l => !l.hasSite || filt.site).forEach(l => m.set(l.id, l));
  Object.entries(S).forEach(([id, v]) => { if(v.snap && !m.has(id)) m.set(id, applyManual(v.snap)); });
  return [...m.values()];
}
function renderKanban(){
  const all = allTracked();
  $("kanban").innerHTML = `<div class="kan">${STAGES.map(([k,n]) => {
    const items = all.filter(l => stageOf(l) === k);
    return `<div class="col" data-stage="${k}"><h4>${n}<span>${items.length}</span></h4>${items.map(l => `<div class="kc" draggable="true" data-id="${l.id}">
      <b>${esc(l.name)}</b><span class="addr">${esc(l.city||"")} · ${esc(l.nicho||"")}</span>
      ${l.phone ? `<span>📞 ${esc(fmtPhone(l.phone,cfg.cc))}</span>` : ""}
      <div class="acts">${l.whatsapp?`<a class="btn wa" href="${esc(waLink(l))}" target="_blank" rel="noopener" data-act="wa">💬</a>`:""}<button class="btn" data-act="det" type="button">📝</button></div></div>`).join("")}</div>`;
  }).join("")}</div>`;
}
function renderDash(){
  const all = allTracked(), n = all.length || 1;
  const cnt = k => all.filter(l => stageOf(l) === k).length;
  const bar = (label, v, max, color) => `<div class="bar"><span>${label}</span><div><i style="width:${max?Math.round(v/max*100):0}%;${color?`background:${color}`:""}"></i></div><b>${v}</b></div>`;
  const worked = all.length - cnt("novo");
  $("dash").innerHTML = `
    <div class="grid">
      <div class="kpi"><b>${all.length}</b><span>Leads rastreados</span></div>
      <div class="kpi"><b>${all.filter(l=>l.whatsapp).length}</b><span>Com WhatsApp</span></div>
      <div class="kpi"><b>${all.filter(l=>l.temp==="hot").length}</b><span>Leads quentes</span></div>
      <div class="kpi"><b>${worked}</b><span>Já abordados</span></div>
      <div class="kpi"><b>${cnt("fechado")}</b><span>Fechados (${Math.round(cnt("fechado")/Math.max(worked,1)*100)}% dos abordados)</span></div>
    </div>
    <div class="box"><h3>Funil</h3>${STAGES.map(([k,nm]) => bar(nm, cnt(k), n)).join("")}</div>
    <div class="box"><h3>Temperatura</h3>${bar("Quente",all.filter(l=>l.temp==="hot").length,n,COLORS.hot)}${bar("Morno",all.filter(l=>l.temp==="warm").length,n,COLORS.warm)}${bar("Frio",all.filter(l=>l.temp==="cold").length,n,COLORS.cold)}</div>
    <div class="box"><h3>Contatos disponíveis</h3>${bar("Telefone",all.filter(l=>l.phone).length,n)}${bar("WhatsApp",all.filter(l=>l.whatsapp).length,n)}${bar("Instagram/FB",all.filter(l=>l.insta||l.face).length,n)}${bar("E-mail",all.filter(l=>l.email).length,n)}</div>`;
}

/* ====== modais ====== */
function modal(html){ const d = document.createElement("div"); d.className = "modal"; d.innerHTML = `<div class="mbox">${html}</div>`; d.onclick = e => { if(e.target === d) d.remove(); }; document.body.appendChild(d); return d; }
const findLead = id => leads.find(l => l.id === id) || (S[id] && applyManual(S[id].snap));

function detail(id){
  const l = findLead(id); if(!l) return;
  const m = modal(`<h3>${esc(l.name)}</h3>
    <div class="addr">${esc(l.addr || "Endereço não informado")} · ${esc(l.nicho||"")} · ${esc(l.city||"")}</div>
    <div class="two"><label>Etapa<select id="dSt">${STAGES.map(([k,n]) => `<option value="${k}" ${stageOf(l)===k?"selected":""}>${n}</option>`).join("")}</select></label>
    <label>WhatsApp/telefone encontrado por você<input id="dMan" value="${esc(S[l.id]?.manual||"")}" placeholder="(11) 91234-5678"></label></div>
    <label>Anotações<textarea id="dNotes" rows="3">${esc(S[l.id]?.notes||"")}</textarea></label>
    <div>Mensagem sugerida:</div><pre>${esc(msgFor(l))}</pre>
    <div class="acts">${l.whatsapp?`<a class="btn wa" href="${esc(waLink(l))}" target="_blank" rel="noopener">💬 Abrir WhatsApp</a>`:""}
      <button class="btn" id="dCp" type="button">Copiar mensagem</button>
      <a class="btn" href="${esc(l.google)}" target="_blank" rel="noopener">🔍 Google</a>
      <a class="btn" href="${esc(l.osm)}" target="_blank" rel="noopener">OSM</a>
      ${l.insta?`<a class="btn" href="${esc(l.insta)}" target="_blank" rel="noopener">Instagram</a>`:""}${l.face?`<a class="btn" href="${esc(l.face)}" target="_blank" rel="noopener">Facebook</a>`:""}
      ${l.site?`<a class="btn" href="${esc(l.site)}" target="_blank" rel="noopener">Site atual</a>`:""}</div>
    <div class="acts"><button class="pri btn" id="dSave" type="button">Salvar</button><button class="btn" id="dClose" type="button">Fechar</button></div>`);
  m.querySelector("#dClose").onclick = () => m.remove();
  m.querySelector("#dCp").onclick = e => navigator.clipboard.writeText(msgFor(l)).then(() => e.target.textContent = "Copiado ✓");
  m.querySelector("#dSave").onclick = () => {
    const st = m.querySelector("#dSt").value, man = m.querySelector("#dMan").value.trim(), notes = m.querySelector("#dNotes").value.trim();
    S[l.id] = Object.assign(S[l.id] || {}, {stage:st, manual:man, notes, snap:l});
    if(st === "novo" && !man && !notes) delete S[l.id];
    saveS();
    const live = leads.find(x => x.id === l.id); if(live) applyManual(live);
    m.remove(); renderAll();
  };
}
function editMsg(){
  const m = modal(`<h3>Mensagem do WhatsApp</h3>
    <div class="two"><label>Seu nome / marca<input id="cMe" value="${esc(cfg.me)}" placeholder="Seu nome"></label><label>DDI do país<input id="cCc" value="${esc(cfg.cc)}"></label></div>
    <label>Modelo — variáveis: {nome} {nicho} {cidade} {eu}<textarea id="cTpl" rows="6">${esc(cfg.tpl)}</textarea></label>
    <div class="acts"><button class="pri btn" id="cSave" type="button">Salvar</button><button class="btn" id="cClose" type="button">Cancelar</button></div>`);
  m.querySelector("#cClose").onclick = () => m.remove();
  m.querySelector("#cSave").onclick = () => { cfg = {me:m.querySelector("#cMe").value.trim(), cc:m.querySelector("#cCc").value.trim()||"55", tpl:m.querySelector("#cTpl").value}; saveCfg(); m.remove(); renderAll(); };
}
function history(){
  const h = store.get("gc_hist", []);
  const m = modal(`<h3>Buscas anteriores</h3>${h.map((x,i) => `<div class="hist" data-i="${i}"><span><b>${esc(x.niche)}</b> · ${esc(x.city)}</span><span>${x.rad} km</span></div>`).join("") || "<div class='addr'>Nenhuma busca ainda.</div>"}
    <button class="btn" id="hClose" type="button">Fechar</button>`);
  m.querySelector("#hClose").onclick = () => m.remove();
  m.querySelectorAll(".hist").forEach(el => el.onclick = () => { const x = h[+el.dataset.i]; $("niche").value = x.niche; $("city").value = x.city; $("radius").value = x.rad; $("rv").textContent = x.rad; m.remove(); search(x.niche, x.city, x.rad); });
}
function fireMode(){
  const queue = visible().filter(l => l.whatsapp && stageOf(l) === "novo"); let i = 0;
  const m = modal(""); const box = m.firstChild;
  const draw = () => {
    if(i >= queue.length){ box.innerHTML = `<h3>Fila concluída 🎉</h3><div>Você abordou ${queue.filter(l=>stageOf(l)!=="novo").length} leads. Acompanhe as respostas no Kanban.</div><button class="btn" id="fx" type="button">Fechar</button>`; box.querySelector("#fx").onclick = () => { m.remove(); renderAll(); }; return; }
    const l = queue[i];
    box.innerHTML = `<h3>🚀 Modo disparo · ${i+1}/${queue.length}</h3><b style="font-size:16px">${esc(l.name)}</b>
      <div class="addr">${esc(l.addr||"")} · ${esc(fmtPhone(l.whatsapp,cfg.cc))} · WhatsApp ${esc(l.waKind)}</div><pre>${esc(msgFor(l))}</pre>
      <div class="acts"><button class="btn wa" id="fGo" type="button">💬 Abrir WhatsApp e marcar contactado</button><button class="btn" id="fSkip" type="button">Pular</button><button class="btn" id="fX" type="button">Parar</button></div>
      <div class="addr">Você confirma e envia cada mensagem manualmente no WhatsApp — nada é enviado automaticamente.</div>`;
    box.querySelector("#fGo").onclick = () => { window.open(waLink(l), "_blank", "noopener"); setStage(l, "contactado"); i++; draw(); };
    box.querySelector("#fSkip").onclick = () => { i++; draw(); };
    box.querySelector("#fX").onclick = () => { m.remove(); renderAll(); };
  };
  draw();
}

/* ====== exportação ====== */
function rows(){
  return visible().map(l => ({"Nome":l.name,"Score":l.score,"Temperatura":{hot:"Quente",warm:"Morno",cold:"Frio"}[l.temp],"Etapa":stageName(stageOf(l)),"Telefone":l.phone?fmtPhone(l.phone,cfg.cc):"","WhatsApp":l.whatsapp?"+"+l.whatsapp:"","Status WhatsApp":l.waKind,"Link WhatsApp":waLink(l),"Endereço":l.addr,"Distância (km)":+l.dist.toFixed(2),"Instagram":l.insta,"Facebook":l.face,"E-mail":l.email,"Tem site":l.hasSite?"sim":"não","Anotações":S[l.id]?.notes||"","Mensagem":msgFor(l),"Google":l.google,"OSM":l.osm}));
}
const fname = ext => `leads-${norm(ctx?.cityShort||"busca").replace(/\W+/g,"-")}-${norm(ctx?.label||"").replace(/\W+/g,"-")}.${ext}`;
$("csv").onclick = () => {
  const r = rows(); if(!r.length) return;
  const q = v => `"${String(v ?? "").replace(/"/g,'""')}"`, cols = Object.keys(r[0]);
  const blob = new Blob(["﻿" + cols.map(q).join(";") + "\r\n" + r.map(x => cols.map(c => q(x[c])).join(";")).join("\r\n")], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = fname("csv"); a.click(); URL.revokeObjectURL(a.href);
};
$("xlsx").onclick = () => {
  if(typeof XLSX === "undefined"){ toast("Biblioteca do Excel não carregou (sem internet?). Use o CSV.", true); return; }
  const ws = XLSX.utils.json_to_sheet(rows()), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Leads"); XLSX.writeFile(wb, fname("xlsx"));
};

/* ====== eventos ====== */
$("f").onsubmit = e => { e.preventDefault(); search($("niche").value.trim(), $("city").value.trim(), +$("radius").value); };
$("radius").oninput = () => $("rv").textContent = $("radius").value;
$("sort").onchange = renderAll;
$("editMsg").onclick = editMsg; $("hist").onclick = history; $("fire").onclick = fireMode;
$("theme").onclick = () => { const d = document.documentElement.dataset.theme !== "dark"; document.documentElement.dataset.theme = d ? "dark" : "light"; $("theme").textContent = d ? "☀️" : "🌙"; store.set("gc_theme", d ? "dark" : "light"); };
if(store.get("gc_theme") === "dark") $("theme").click();
document.querySelectorAll(".tabs button").forEach(b => b.onclick = () => {
  view = b.dataset.v; $("app").dataset.view = view;
  document.querySelectorAll(".tabs button").forEach(x => x.classList.toggle("on", x === b));
  if(view === "map") setTimeout(() => map.invalidateSize(), 50); else { renderKanban(); renderDash(); }
});
document.querySelectorAll(".chip").forEach(c => c.onclick = () => { filt[c.dataset.f] = !filt[c.dataset.f]; c.classList.toggle("on", filt[c.dataset.f]); renderAll(); });
$("list").addEventListener("click", e => {
  const card = e.target.closest(".card"); if(!card) return;
  const id = card.dataset.id, act = e.target.closest("[data-act]")?.dataset.act;
  if(act === "det"){ detail(id); return; }
  if(act === "wa"){ const l = leads.find(x => x.id === id); if(l && stageOf(l) === "novo"){ setStage(l, "contactado"); setTimeout(renderAll, 0); } return; }
  if(e.target.closest("a")) return;
  select(id, true);
});
$("kanban").addEventListener("click", e => {
  const kc = e.target.closest(".kc"); if(!kc) return; const act = e.target.closest("[data-act]")?.dataset.act;
  if(act === "det") detail(kc.dataset.id);
});
let dragId = null;
$("kanban").addEventListener("dragstart", e => { const kc = e.target.closest(".kc"); if(kc){ dragId = kc.dataset.id; e.dataTransfer.effectAllowed = "move"; } });
$("kanban").addEventListener("dragover", e => { const c = e.target.closest(".col"); if(c){ e.preventDefault(); document.querySelectorAll(".col.over").forEach(x => x.classList.remove("over")); c.classList.add("over"); } });
$("kanban").addEventListener("drop", e => {
  const c = e.target.closest(".col"); if(!c || !dragId) return; e.preventDefault();
  const l = findLead(dragId); if(l){ setStage(l, c.dataset.stage); renderAll(); } dragId = null;
});
