// Proxy server-side do Overpass: evita bloqueio de origem (403) dos espelhos para domínios *.vercel.app.
const EPS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];
const UA = "garimpo-local/1.0 (+https://github.com/pietrosantos15)";
const EP_TIMEOUT_MS = 15000;  // tempo máximo por servidor
const STAGGER_MS = 2500;     // espera antes de acionar o próximo servidor (se o anterior ainda não respondeu)
const CACHE_TTL = 10 * 60 * 1000, CACHE_MAX = 30;
const cache = new Map();     // consulta -> {t, j}; vale enquanto a instância serverless estiver "quente"

async function tryEp(ep, q, outer){
  // limite de tempo por servidor: um espelho travado não segura os demais
  const c = new AbortController(), t = setTimeout(() => c.abort(), EP_TIMEOUT_MS), on = () => c.abort();
  outer.addEventListener("abort", on);
  try{ return await tryEpInner(ep, q, c.signal); }
  finally{ clearTimeout(t); outer.removeEventListener("abort", on); }
}
async function tryEpInner(ep, q, signal){
  const r = await fetch(ep, {
    method: "POST", signal,
    headers: {"Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, "Accept": "application/json"},
    body: "data=" + encodeURIComponent(q),
  });
  if(!r.ok) throw new Error(new URL(ep).host + " respondeu " + r.status);
  const j = await r.json();
  if(!j || !Array.isArray(j.elements)) throw new Error(new URL(ep).host + " resposta inválida");
  // o Overpass devolve 200 + lista vazia + "remark" quando estoura tempo/memória: isso é falha, não "nenhum resultado"
  if(j.remark && /runtime error|timed out|out of memory/i.test(j.remark)) throw new Error(new URL(ep).host + " falhou: " + j.remark);
  return j;
}

// Pede a UM servidor por vez: o próximo só é acionado se o atual falhar ou demorar mais que `stagger`.
// Evita estourar o limite por IP dos servidores públicos (429/504). Resultado vazio só vale se 2 servidores concordarem.
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

module.exports = async (req, res) => {
  if(req.method !== "POST"){ res.status(405).json({error: "use POST"}); return; }
  const q = typeof req.body === "string" ? req.body : (req.body && req.body.q) || "";
  if(!q || q.length > 20000){ res.status(400).json({error: "consulta inválida"}); return; }
  const hit = cache.get(q);
  if(hit && Date.now() - hit.t < CACHE_TTL){ res.status(200).json(hit.j); return; }
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 28000);
  try{
    const j = await hedged(EPS.map(ep => () => tryEp(ep, q, ctl.signal)), STAGGER_MS);
    ctl.abort();
    if(j.elements.length){
      if(cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(q, {t: Date.now(), j});
    }
    res.status(200).json(j);
  }catch(e){
    res.status(502).json({error: String((e && e.message) || e)});
  }finally{ clearTimeout(timer); }
};
