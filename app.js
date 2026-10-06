/* ====== utilidades ====== */
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {get(k,d){try{return JSON.parse(localStorage.getItem(k)) ?? d}catch{return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
const hav = (a,b,c,d) => {const R=6371,r=Math.PI/180,dx=(c-a)*r,dy=(d-b)*r,x=Math.sin(dx/2)**2+Math.cos(a*r)*Math.cos(c*r)*Math.sin(dy/2)**2;return 2*R*Math.asin(Math.sqrt(x))};

/* ====== nichos -> tags OSM ====== */
const NICHES = [
 {l:"Restaurantes",k:["restaurante","restaurant"],f:["amenity=restaurant"],m:"comida"},
 {l:"Lanchonetes",k:["lanchonete","fast food","hamburgueria","pizzaria"],f:["amenity=fast_food"],m:"comida"},
 {l:"Cafeterias",k:["cafe","cafeteria"],f:["amenity=cafe"],m:"comida"},
 {l:"Bares",k:["bar","pub","boteco"],f:["amenity=bar|pub"],m:"comida"},
 {l:"Padarias",k:["padaria","confeitaria"],f:["shop=bakery"],m:"comida"},
 {l:"Salão de beleza",k:["salao","beleza","cabeleireiro","cabeleireira","barbearia","barbeiro","manicure","estetica"],f:["shop=hairdresser|beauty"],g:["salão de beleza","barbearia"],m:"beleza"},
 {l:"Academias",k:["academia","fitness","crossfit"],f:["leisure=fitness_centre"],m:"academia"},
 {l:"Clínicas / médicos",k:["clinica","medico","consultorio","fisioterapia","psicologo","psicologia","nutricionista","saude"],f:["amenity=clinic|doctors","healthcare=clinic|doctor|centre|physiotherapist|psychotherapist|alternative|audiologist|podiatrist|speech_therapist|occupational_therapist|nutrition_counselling"],z:["clínica","consultório","médico"],m:"clinica"},
 {l:"Dentista",k:["dentista","odontologia","dentist"],f:["amenity=dentist","healthcare=dentist"],z:["dentista","odontologia"],m:"clinica"},
 {l:"Veterinária",k:["veterinaria","veterinario","vet"],f:["amenity=veterinary"],m:"pet"},
 {l:"Pet shops",k:["pet shop","petshop","pet"],f:["shop=pet"],m:"pet"},
 {l:"Oficina mecânica",k:["oficina","mecanica","mecanico","auto center"],f:["shop=car_repair"],m:"auto"},
 {l:"Autopeças",k:["autopecas","auto pecas","pecas"],f:["shop=car_parts"],m:"auto"},
 {l:"Imobiliária",k:["imobiliaria","corretor","imoveis"],f:["office=estate_agent"],m:"imoveis"},
 {l:"Advogado",k:["advogado","advocacia","escritorio de advocacia"],f:["office=lawyer"],m:"profissional"},
 {l:"Contabilidade",k:["contabilidade","contador"],f:["office=accountant"],m:"profissional"},
 {l:"Loja de roupas",k:["roupa","moda","boutique","loja de roupas"],f:["shop=clothes"],m:"loja"},
 {l:"Floricultura",k:["floricultura","flores"],f:["shop=florist"],m:"loja"},
 {l:"Farmácia",k:["farmacia","drogaria"],f:["amenity=pharmacy"],m:"loja"},
 {l:"Pousada / hotel",k:["pousada","hotel","hostel"],f:["tourism=hotel|guest_house|hostel"],m:"hospedagem"},
 {l:"Autoescola",k:["autoescola","auto escola","cfc"],f:["amenity=driving_school"],m:"ensino"},
 {l:"Escola de idiomas",k:["idiomas","ingles","curso de ingles"],f:["amenity=language_school"],m:"ensino"},
 {l:"Eletricista / encanador",k:["eletricista","encanador","marceneiro","pintor","serviços","servicos"],f:["craft=electrician|plumber|carpenter|painter|hvac"],m:"servicos"},
 {l:"Tatuagem",k:["tatuagem","tatuador","tattoo"],f:["shop=tattoo"],m:"beleza"},
 {l:"Ótica",k:["otica","oculos"],f:["shop=optician"],m:"loja"},
 {l:"Supermercado / mercado",k:["mercado","supermercado","mercearia"],f:["shop=supermarket|convenience"],m:"loja"},
 {l:"Material de construção",k:["material de construcao","construcao","ferragens"],f:["shop=hardware|doityourself"],m:"loja"},
 {l:"Lavanderia",k:["lavanderia","lava rapido","lavagem"],f:["shop=laundry","amenity=car_wash"],m:"servicos"},
];
$("nl").innerHTML = NICHES.map(n => `<option value="${esc(n.l)}">`).join("");
function resolveNiche(q){
  const t = norm(q);
  const direct = q.trim().match(/^([\w:]+)=([\w|:-]+)$/);
  if(direct) return {f:[q.trim()], label:q.trim()};
  const hit = NICHES.find(n => norm(n.l) === t) || NICHES.find(n => n.k.some(k => k === t)) || NICHES.find(n => n.k.some(k => t.includes(k) && k.length > 3));
  if(hit) return {f:hit.f, z:hit.z || [hit.k[0]], label:hit.l.toLowerCase(), m:hit.m, g:hit.g};
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
const NICHE_TPL = {clinica: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para clínicas e consultórios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site próprio. Hoje, antes de escolher onde se consultar, muita gente pesquisa no celular: quer ver os serviços, o horário, o endereço e como marcar. Quem não aparece direito acaba perdendo esse paciente para outra clínica.\n\nEu faço uma página simples e organizada para a sua clínica, com:\n• especialidades, serviços e equipe;\n• horário de atendimento e endereço no mapa;\n• um botão para o paciente marcar a consulta direto no seu WhatsApp.\n\nAssim você passa mais confiança e recebe mais pedidos de consulta, sem a secretária precisar explicar tudo toda vez.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  comida: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para restaurantes, padarias e lanchonetes aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente decide onde comer olhando o celular: quer ver o cardápio, o horário e como chegar. Quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• cardápio com fotos e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente fazer o pedido ou a reserva direto no seu WhatsApp.\n\nAssim você recebe mais pedidos, sem depender só de indicação ou de aplicativo de entrega.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  beleza: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para salões e estúdios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe onde se cuidar olhando fotos dos trabalhos no celular. Quem não aparece direito acaba perdendo cliente para outro lugar.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• fotos dos seus trabalhos;\n• serviços e preços;\n• horário e endereço no mapa;\n• um botão para a cliente agendar direto no seu WhatsApp.\n\nAssim sua agenda enche mais, sem você precisar responder as mesmas perguntas toda hora.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  academia: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para academias e estúdios de treino aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente escolhe onde treinar pesquisando no celular: quer ver as aulas, os horários e os planos. Quem não aparece direito acaba perdendo aluno para outra academia.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• modalidades, aulas e horários;\n• planos e preços;\n• fotos do espaço e endereço no mapa;\n• um botão para o aluno marcar uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais alunos novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  pet: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para pet shops e clínicas veterinárias aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente procura um lugar de confiança para o pet pelo celular, antes de ir até o local. Quem não aparece direito acaba perdendo cliente para outro.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• serviços como banho e tosa, consultas e produtos;\n• horário e endereço no mapa;\n• um botão para o cliente agendar direto no seu WhatsApp.\n\nAssim você recebe mais clientes novos, sem depender só de indicação ou de rede social.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  auto: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para oficinas e lojas de autopeças aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, quando o carro dá problema, muita gente procura no celular alguém de confiança perto de casa. Quem não aparece direito acaba perdendo cliente para outra oficina.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• serviços, marcas atendidas e fotos do espaço;\n• horário e endereço no mapa;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  profissional: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para escritórios e profissionais aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de contratar alguém, muita gente pesquisa no celular para ver se pode confiar. Quem não aparece direito acaba perdendo esse cliente para outro profissional.\n\nEu faço uma página simples e bonita para o seu escritório, com:\n• apresentação e áreas de atuação;\n• endereço e horário de atendimento;\n• um botão para o cliente falar direto com você no WhatsApp.\n\nAssim você passa mais confiança e recebe mais pedidos de contato.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  imoveis: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para imobiliárias e corretores aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje quem procura imóvel começa a busca pelo celular, olhando fotos e valores. Quem não aparece direito acaba perdendo cliente para outra imobiliária.\n\nEu faço uma página simples e bonita para a sua imobiliária, com:\n• imóveis com fotos e valores;\n• apresentação da equipe e endereço no mapa;\n• um botão para o cliente pedir uma visita direto no seu WhatsApp.\n\nAssim você recebe mais contatos de interessados, sem depender só de portais e indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  loja: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para lojas aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente pesquisa no celular antes de ir comprar: quer ver os produtos, o horário e onde fica. Quem não aparece direito acaba perdendo cliente para outra loja.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• produtos com fotos e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente consultar ou encomendar direto no seu WhatsApp.\n\nAssim você recebe mais clientes e encomendas, sem depender só de quem passa na porta.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  hospedagem: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para pousadas e hotéis aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje quem vai viajar escolhe onde ficar olhando fotos e preços no celular. Quem não aparece direito acaba perdendo hóspede para outro lugar.\n\nEu faço uma página simples e bonita para a sua pousada, com:\n• fotos dos quartos e da estrutura;\n• valores, localização e como chegar;\n• um botão para o hóspede reservar direto no seu WhatsApp.\n\nAssim você recebe mais reservas diretas, sem pagar comissão para site de reservas.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  ensino: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para escolas e cursos aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, antes de se matricular, muita gente pesquisa no celular: quer ver os cursos, os horários e os valores. Quem não aparece direito acaba perdendo aluno para outra escola.\n\nEu faço uma página simples e bonita para a sua escola, com:\n• cursos, turmas e horários;\n• valores e endereço no mapa;\n• um botão para o aluno pedir informações ou uma aula experimental direto no seu WhatsApp.\n\nAssim você recebe mais matrículas, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂",
  servicos: "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para prestadores de serviço aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje, quando alguém precisa de um serviço, procura no celular e chama quem parece mais confiável. Quem não aparece direito acaba perdendo esse cliente.\n\nEu faço uma página simples e bonita para o seu trabalho, com:\n• serviços e fotos de trabalhos feitos;\n• região atendida e horário;\n• um botão para o cliente pedir orçamento direto no seu WhatsApp.\n\nAssim você recebe mais pedidos de orçamento, sem depender só de indicação.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂"};
const PREV_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
const DEFAULT_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} na internet e vi que vocês ainda não têm um site. Hoje muita gente procura {nicho} pelo celular antes de ir até o local, e quem não aparece acaba perdendo cliente.\n\nEu faço uma página simples e bonita para o seu negócio, com:\n• fotos, serviços e preços;\n• horário de funcionamento e endereço no mapa;\n• um botão para o cliente chamar direto no seu WhatsApp.\n\nAssim você recebe mais clientes novos, sem depender só de indicação ou redes sociais.\n\nPosso te mostrar um exemplo rápido, sem compromisso? Se não fizer sentido, tudo bem 🙂";
const PREV3_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
const OLD_TPL = "Olá, tudo bem? Meu nome é {eu}, sou estudante de Análise e Desenvolvimento de Sistemas no SENAI, e faço sites para negócios aqui da região de {cidade}.\n\nPesquisei a {nome} no Google e no mapa e vi que vocês ainda não têm um site ou página própria. Hoje muita gente procura {nicho} pelo celular antes de ir ao local, e quem não aparece direito acaba perdendo cliente para o concorrente.\n\nEu crio páginas simples e profissionais (landing pages) para negócios locais, com:\n• fotos, serviços e preços;\n• horário e localização no mapa;\n• botão direto para o seu WhatsApp, para o cliente já chamar e agendar.\n\nA ideia é você receber mais contatos de clientes novos, sem depender só de indicação ou rede social.\n\nPosso te mandar um exemplo rápido, sem compromisso? Se não fizer sentido, sem problema nenhum 🙂";
let cfg = store.get("gc_cfg", {me:"Pietro", cc:"55", tpl:DEFAULT_TPL});
if(!cfg.me) cfg.me = "Pietro";
if(cfg.tpl === OLD_TPL || cfg.tpl === PREV_TPL || cfg.tpl === PREV3_TPL){ cfg.tpl = DEFAULT_TPL; store.set("gc_cfg", cfg); }
let leads = [], ctx = null, selId = null, filt = {wa:false, ig:false, em:false, site:false}, tempSel = {hot:false, warm:false, cold:false}, view = "map";
const stageOf = l => S[l.id]?.stage || "novo";
const saveS = () => store.set("gc_state", S);
const saveCfg = () => store.set("gc_cfg", cfg);
const tplFor = l => (cfg.tpl === DEFAULT_TPL && NICHE_TPL[l.tplKey]) || cfg.tpl;
const msgFor = l => tplFor(l).replaceAll("{nome}", l.name).replaceAll("{nicho}", l.nicho || "comércios").replaceAll("{cidade}", l.city || "sua cidade").replaceAll("{eu}", cfg.me || "Pietro");
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
  return `[out:json][timeout:25][maxsize:67108864];(${parts.join("")});out center tags qt;`;
}
const OVERPASS_EPS = ["https://overpass-api.de/api/interpreter","https://lz4.overpass-api.de/api/interpreter","https://overpass.openstreetmap.fr/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter"];
const BROWSER_EPS = OVERPASS_EPS.slice(0, 2);   // os que aceitam chamada direta do navegador (CORS) mesmo em *.vercel.app
const qCache = new Map();   // consulta -> {t, j}: repetir a mesma busca não consulta os servidores de novo
// fetch com limite de tempo próprio: servidor travado não segura a busca inteira
function fetchT(url, o, ms, outer){
  const c = new AbortController(), t = setTimeout(() => c.abort(), ms), on = () => c.abort();
  outer?.addEventListener("abort", on);
  return fetch(url, {...o, signal:c.signal}).finally(() => { clearTimeout(t); outer?.removeEventListener("abort", on); });
}
// Tenta os caminhos em sequência: o próximo só entra se o atual falhar ou demorar mais que `stagger`.
// Evita estourar o limite por IP dos servidores públicos (429/504). Resultado vazio só vale se 2 caminhos concordarem.
function hedged(fns, stagger){
  return new Promise((resolve, reject) => {
    let started = 0, pending = fns.length, empties = 0, empty = null, lastErr, done = false, timer;
    const finish = (fn, v) => { if(done) return; done = true; clearTimeout(timer); fn(v); };
    const next = () => {
      if(done || started >= fns.length) return;
      const run = fns[started++];
      clearTimeout(timer);
      if(started < fns.length) timer = setTimeout(next, stagger);
      run().then(j => {
        if(j.elements.length) return finish(resolve, j);
        empty = empty || j; empties++;
        if(empties >= 2 || --pending === 0) finish(resolve, empty); else next();
      }, e => {
        lastErr = e;
        if(--pending === 0) empty ? finish(resolve, empty) : finish(reject, lastErr); else next();
      });
    };
    next();
  });
}
async function overpassOnce(q, ctl){
  const tryEp = ep => async () => {
    const r = await fetchT(ep, {method:"POST", body:"data="+encodeURIComponent(q), headers:{"Content-Type":"application/x-www-form-urlencoded"}}, 15000, ctl.signal);
    if(!r.ok) throw new Error(new URL(ep).host+" respondeu "+r.status);
    const j = await r.json(); if(!j || !Array.isArray(j.elements)) throw new Error("Resposta inválida do Overpass");
    // 200 + lista vazia + "remark" = servidor estourou tempo/memória (falha, não "sem resultados")
    if(j.remark && /runtime error|timed out|out of memory/i.test(j.remark)) throw new Error(new URL(ep).host+" sobrecarregado: "+j.remark);
    return j;
  };
  // proxy do próprio site (IP da Vercel) e navegador do usuário (IP dele) são "filas" diferentes nos servidores públicos
  const viaProxy = async () => {
    const r = await fetchT("/api/overpass", {method:"POST", body:q, headers:{"Content-Type":"text/plain"}}, 30000, ctl.signal);
    if(!r.ok){ const e = await r.json().catch(() => ({})); throw new Error(e.error || "Proxy respondeu "+r.status); }
    const j = await r.json(); if(!j || !Array.isArray(j.elements)) throw new Error("Resposta inválida do proxy");
    return j;
  };
  const web = location.protocol.startsWith("http") && !/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  return hedged(web ? [viaProxy, ...BROWSER_EPS.map(tryEp)] : OVERPASS_EPS.map(tryEp), 2500);
}
async function overpass(q){
  const hit = qCache.get(q);
  if(hit && Date.now() - hit.t < 15*60*1000) return hit.j;
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 32000);
  try{
    const j = await overpassOnce(q, ctl);
    if(j.elements.length){ if(qCache.size >= 20) qCache.delete(qCache.keys().next().value); qCache.set(q, {t:Date.now(), j}); }
    return j;
  }finally{ clearTimeout(timer); ctl.abort(); }   // cancela os caminhos que sobraram
}
// Fonte reserva/complementar: busca por nome no Nominatim (outro serviço do OSM, não depende do Overpass).
// Devolve no mesmo formato dos elementos do Overpass para reaproveitar o build().
async function nominatimPlaces(nq, lat, lon, rad){
  const terms = nq.z || (nq.f ? null : [nq.label]);
  if(!terms) return [];
  const dLat = rad/111.32, dLon = rad/(111.32*Math.cos(lat*Math.PI/180));
  const vb = [lon-dLon, lat+dLat, lon+dLon, lat-dLat].map(x => x.toFixed(5)).join(",");
  const OK = ["amenity","healthcare","shop","office","tourism","leisure","craft"], out = [], seen = new Set();
  for(let i = 0; i < terms.length; i++){
    if(i) await new Promise(r => setTimeout(r, 1100));   // política do Nominatim: no máximo 1 requisição por segundo
    const r = await fetchT("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=40&bounded=1&extratags=1&addressdetails=1&accept-language=pt-BR&viewbox="+vb+"&q="+encodeURIComponent(terms[i]), {}, 12000);
    if(!r.ok) throw new Error("Nominatim respondeu "+r.status);
    for(const p of await r.json()){
      const name = p.name || p.namedetails?.name, key = p.osm_type+p.osm_id;
      if(!name || seen.has(key) || !OK.includes(p.category)) continue;
      if(nq.m === "clinica" && (p.type === "veterinary" || p.type === "pet")) continue;
      seen.add(key);
      const a = p.address || {};
      out.push({type:p.osm_type, id:p.osm_id, lat:+p.lat, lon:+p.lon, tags:Object.assign({}, p.extratags, {name,
        "addr:street":a.road, "addr:housenumber":a.house_number, "addr:suburb":a.suburb || a.neighbourhood, "addr:city":a.city || a.town || a.village})});
    }
  }
  return out;
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
  const l = {id: el.type[0]+el.id, name:t.name, lat, lon, dist, addr, street:t["addr:street"]||"", hn:!!t["addr:housenumber"], phone, whatsapp, waKind, insta, face, email, hours:t.opening_hours||"", hasSite, site:t.website||t["contact:website"]||t.url||"",
    score, temp: score >= 70 ? "hot" : score >= 45 ? "warm" : "cold", city:ctx.cityShort, nicho:ctx.label, tplKey:ctx.m,
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
/* ====== fonte complementar: Google Places (via /api/places, opcional) ====== */
async function fetchPlaces(nq, g, rad){
  if(!location.protocol.startsWith("http")) return [];
  try{
    const r = await fetch("/api/places", {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({queries: nq.g || [nq.label || nq.name], lat:g.lat, lon:g.lon, radius: Math.round(rad*1000)})});
    if(!r.ok) return [];
    return (await r.json()).places || [];
  }catch{ return []; }
}
const slug = s => norm(s).replace(/[^a-z0-9]/g, "");
// junta os resultados do Google aos do OSM: completa quem já existe e acrescenta quem faltava
function mergePlaces(osmLeads, places){
  const added = [];
  places.forEach(p => {
    const el = {type:"google", id:p.id, lat:p.lat, lon:p.lon, tags:{name:p.name, phone:p.phone, website:p.site}};
    const l = build(el); if(!l || l.dist > ctx.rad) return;
    const key = slug(p.name);
    const twin = osmLeads.find(o => slug(o.name) === key || (hav(o.lat,o.lon,l.lat,l.lon) < 0.05 && (slug(o.name).includes(key) || key.includes(slug(o.name)))));
    if(twin){
      if(l.hasSite && !twin.hasSite){ twin.hasSite = true; twin.site = p.site; }
      if(!twin.hn && /\d/.test(p.addr||'')){ twin.addr = (p.addr||'').replace(/, Brasil$/, '').replace(/, \d{5}-\d{3}/, ''); twin.hn = true; }
      if(!twin.phone && l.phone){ twin.phone = l.phone; twin.whatsapp = l.whatsapp; twin.waKind = l.waKind; }
      return;
    }
    l.src = "google"; l.hn = true; l.osm = p.maps || l.google; l.addr = (p.addr || "").replace(/, Brasil$/, "").replace(/, \d{5}-\d{3}/, "");
    added.push(l);
  });
  return osmLeads.concat(added);
}
const hasContact = l => !!(l.phone || l.whatsapp || l.insta || l.face || l.email);

async function search(niche, city, rad){
  const btn = $("go"); btn.disabled = true; toast("Localizando cidade…");
  try{
    const nq = resolveNiche(niche);
    const g = await geocode(city);
    ctx = {lat:g.lat, lon:g.lon, rad, label:nq.label, m:nq.m, cityShort:city.split(",")[0].trim()};
    map.setView([g.lat,g.lon], rad > 15 ? 10 : rad > 8 ? 11 : rad > 3 ? 12 : 13);
    if(circle) circle.remove(); circle = L.circle([g.lat,g.lon], {radius:rad*1000, color:"#3b82f6", weight:1.5, fillOpacity:.03}).addTo(map);
    toast("Buscando em "+(g.name||city)+"… pode levar alguns segundos");
    let elements = [], ovErr = null;
    try{ elements = (await overpass(buildQuery(nq, g.lat, g.lon, rad))).elements || []; }
    catch(e){ ovErr = e; }
    // Overpass falhou ou trouxe poucos resultados? usa/complementa com o Nominatim
    if(ovErr || elements.length < 10){
      toast(ovErr ? "Servidor principal ocupado, usando a fonte reserva…" : "Poucos resultados, buscando também pelo nome…");
      try{
        const extra = await nominatimPlaces(nq, g.lat, g.lon, rad), ids = new Set(elements.map(e => e.type+e.id));
        elements = elements.concat(extra.filter(e => !ids.has(e.type+e.id)));
      }catch(e){ /* sem a fonte reserva, segue só com o que o Overpass trouxe */ }
    }
    if(ovErr && !elements.length) throw new Error("Os servidores do OpenStreetMap estão sobrecarregados. Tente de novo em 1 minuto ou diminua o raio. ("+(ovErr.message||"sem resposta")+")");
    const seen = new Set();
    leads = elements.map(build).filter(Boolean).filter(l => l.dist <= rad).filter(l => !seen.has(l.id) && seen.add(l.id));
    toast("Buscando também no Google…");
    leads = mergePlaces(leads, await fetchPlaces(nq, g, rad));
    checkDDD(leads);
    selId = null;
    const h = store.get("gc_hist", []).filter(x => !(x.niche===niche && x.city===city));
    h.unshift({niche, city, rad}); store.set("gc_hist", h.slice(0,10));
    toast(ovErr && leads.length ? "Servidor principal ocupado: lista parcial (fonte reserva). Busque de novo em alguns minutos para completar." : leads.length ? "" : "Nada encontrado. Aumente o raio ou tente outro nicho (o OSM pode ter poucos dados aí).", !leads.length);
    renderAll();
    fillNumbers();
  }catch(e){ toast(e.message || String(e), true); }
  finally{ btn.disabled = false; }
}

/* ====== listas e render ====== */
function visible(){
  let a = leads.filter(l => filt.site || !l.hasSite);
  if(filt.wa) a = a.filter(l => l.whatsapp);
  if(filt.ig) a = a.filter(l => l.insta || l.face);
  if(filt.em) a = a.filter(l => l.email);
  // temperatura: sem nenhuma marcada mostra todas; marcando, mostra só as escolhidas
  if(tempSel.hot || tempSel.warm || tempSel.cold) a = a.filter(l => tempSel[l.temp]);
  const by = $("sort").value;
  return a.sort((x,y) => by==="dist" ? x.dist-y.dist : by==="name" ? x.name.localeCompare(y.name) : y.score-x.score);
}
/* ====== completa o número da rua (OSM às vezes não tem) ====== */
let numTok = 0;
const revCache = store.get("gc_rev", {});
async function fillNumbers(){
  const tok = ++numTok;
  const todo = leads.filter(l => !l.hn && l.dist != null);
  for(const l of todo){
    if(tok !== numTok) return;
    const key = l.lat.toFixed(5)+","+l.lon.toFixed(5);
    if(!(key in revCache)){
      try{
        const r = await fetchT("https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=pt-BR&lat="+l.lat+"&lon="+l.lon, {}, 10000);
        if(!r.ok) throw 0;
        const a = (await r.json()).address || {};
        revCache[key] = a.house_number ? {n:a.house_number, road:a.road||"", sub:a.suburb||a.neighbourhood||"", city:a.city||a.town||a.village||""} : null;
        store.set("gc_rev", revCache);
      }catch{ await new Promise(r => setTimeout(r, 2500)); continue; }
      await new Promise(r => setTimeout(r, 1100));
    }
    const c = revCache[key];
    if(!c || tok !== numTok) continue;
    // só aceita se a rua bate com a do cadastro (ou se o cadastro não tinha rua)
    if(l.street && norm(l.street) !== norm(c.road)) continue;
    const city = l.addr.split(" · ").pop();
    l.addr = [[c.road || l.street, c.n].filter(Boolean).join(", "), c.sub, l.street ? "" : c.city].filter(Boolean).join(" · ") + (l.street && l.addr.includes(" · ") ? " · " + l.addr.split(" · ").slice(1).join(" · ") : "") + " (nº aprox.)";
    l.hn = true;
    const el = document.querySelector('.card[data-id="'+l.id+'"] .addr'); if(el) el.textContent = (l.addr || "Endereço não informado") + " · " + l.dist.toFixed(1) + " km";
  }
}
function renderAll(){ renderList(); renderMap(); renderKanban(); renderDash(); }

function renderList(){
  const has = leads.length > 0;
  ["exp","filters","chips","tempChips","fireWrap"].forEach(i => $(i).hidden = !has);
  if(!has){ $("list").innerHTML = ""; return; }
  const base = leads.filter(l => filt.site || !l.hasSite);
  document.querySelectorAll("#tempChips .chip").forEach(c => c.querySelector("span").textContent = base.filter(l => l.temp === c.dataset.t).length);
  const vis = visible(), noSite = leads.filter(l => !l.hasSite);
  const rich = noSite.filter(hasContact).length;
  $("stats").innerHTML = `<b>${noSite.length}</b> sem site (de ${leads.length} no raio) · <b>${rich}/${noSite.length}</b> com contato`;
  const q = vis.filter(l => l.whatsapp && stageOf(l) === "novo").length;
  $("fire").textContent = `🚀 Modo disparo (${q})`; $("fire").disabled = !q;
  $("list").innerHTML = vis.map(l => `<div class="card ${l.id===selId?"sel":""} ${stageOf(l)!=="novo"?"done":""}" data-id="${l.id}">
    <div class="row1"><b>${esc(l.name)}</b><span class="temp"><span class="tb ${l.temp}">${{hot:"Quente",warm:"Morno",cold:"Frio"}[l.temp]}</span>${l.score}</span></div>
    <div class="addr">${esc(l.addr || "Endereço não informado")}${l.addr && !l.hn ? " <i title='O mapa não tem o número deste endereço. Use o botão Buscar para ver no Google.'>(sem nº)</i>" : ""} · ${l.dist.toFixed(1)} km</div>
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
      <a class="btn" href="${esc(l.osm)}" target="_blank" rel="noopener">${l.src === "google" ? "Google" : "OSM"}</a>
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
    <div class="addr">Dica: deixando o modelo igual ao padrão, o app usa um texto diferente para cada tipo de negócio (clínica, salão, restaurante…). Se você alterar o texto, ele vale para todos.</div>
    <div class="acts"><button class="pri btn" id="cSave" type="button">Salvar</button><button class="btn" id="cReset" type="button">Restaurar modelo padrão</button><button class="btn" id="cClose" type="button">Cancelar</button></div>`);
  m.querySelector("#cClose").onclick = () => m.remove();
  m.querySelector("#cReset").onclick = () => { m.querySelector("#cTpl").value = DEFAULT_TPL; };
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
document.querySelectorAll("#tempChips .chip").forEach(c => c.onclick = () => { tempSel[c.dataset.t] = !tempSel[c.dataset.t]; c.classList.toggle("on", tempSel[c.dataset.t]); renderAll(); });
document.querySelectorAll(".chip[data-f]").forEach(c => c.onclick = () => { filt[c.dataset.f] = !filt[c.dataset.f]; c.classList.toggle("on", filt[c.dataset.f]); renderAll(); });
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
