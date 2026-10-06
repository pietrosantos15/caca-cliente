// Proxy server-side do Overpass: evita bloqueio de origem (403) dos espelhos para domínios *.vercel.app.
// Além de tentar vários espelhos, guarda cada resultado no banco online (Upstash Redis, mesmas variáveis do /api/db):
//  - repetir a busca nas próximas 24h não consulta os servidores públicos;
//  - se todos os espelhos caírem, devolve o último resultado salvo (até 7 dias) marcado como `stale`;
//  - "disjuntor": depois de uma rodada em que todos falharam, por 3 minutos responde `down` na hora, sem esperar 30s.
const crypto = require("crypto");
// OVERPASS_EPS na Vercel (URLs separadas por vírgula) substitui a lista: útil para um espelho privado/pago
const EPS = String(process.env.OVERPASS_EPS || "").split(",").map(s => s.trim()).filter(Boolean);
if(!EPS.length) EPS.push(
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://z.overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
);
const UA = "garimpo-local/1.0 (+https://github.com/pietrosantos15)";
const EP_TIMEOUT_MS = 15000;  // tempo máximo por servidor
const STAGGER_MS = 2500;     // espera antes de acionar o próximo servidor (se o anterior ainda não respondeu)
const CACHE_TTL = 10 * 60 * 1000, CACHE_MAX = 30;
const cache = new Map();     // consulta -> {t, j}; vale enquanto a instância serverless estiver "quente"

// cache persistente (opcional: só se KV_REST_API_URL/TOKEN existirem na Vercel)
const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KV_FRESH_MS = 24 * 3600 * 1000;   // até aqui o resultado salvo vale como "novo" (não consulta o Overpass)
const KV_KEEP_S = 7 * 24 * 3600;        // depois disso ainda serve como reserva quando os servidores caem
const KV_MAX = 900 * 1024;              // limite por registro no Upstash gratuito (~1 MB)
const DOWN_S = 180;                     // disjuntor: quanto tempo considerar o Overpass "fora" após todos falharem
let downUntil = 0;                      // disjuntor em memória (por instância); o Redis compartilha entre instâncias

async function redis(cmds){   // melhor esforço: qualquer falha do banco vira null e a busca segue normalmente
  if(!DB_URL || !DB_TOKEN) return null;
  try{
    const r = await fetch(DB_URL.replace(/\/$/, "") + "/pipeline", {
      method: "POST", headers: {Authorization: "Bearer " + DB_TOKEN, "Content-Type": "application/json"},
      body: JSON.stringify(cmds), signal: AbortSignal.timeout(4000),
    });
    if(!r.ok) return null;
    return (await r.json()).map(o => (o && !o.error) ? o.result : null);
  }catch(e){ return null; }
}
const kvKey = q => "ov:" + crypto.createHash("sha1").update(q).digest("hex");

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
  res.setHeader("Cache-Control", "no-store");
  if(req.method !== "POST"){ res.status(405).json({error: "use POST"}); return; }
  const q = typeof req.body === "string" ? req.body : (req.body && req.body.q) || "";
  if(!q || q.length > 20000){ res.status(400).json({error: "consulta inválida"}); return; }
  const hit = cache.get(q);
  if(hit && Date.now() - hit.t < CACHE_TTL){ res.status(200).json({...hit.j, source: "memoria"}); return; }

  // resultado salvo no banco + estado do disjuntor, numa chamada só
  const key = kvKey(q), kv = await redis([["GET", key], ["GET", "ov:down"]]);
  let saved = null;
  if(kv && kv[0]){ try{ saved = JSON.parse(kv[0]); }catch(e){ saved = null; } }
  if(saved && saved.j && Array.isArray(saved.j.elements) && Date.now() - saved.t < KV_FRESH_MS){
    cache.set(q, {t: Date.now(), j: saved.j});
    res.status(200).json({...saved.j, source: "banco", cachedAt: saved.t}); return;
  }
  const stale = () => saved && saved.j && saved.j.elements && saved.j.elements.length ? {...saved.j, stale: true, cachedAt: saved.t, source: "banco"} : null;
  const isDown = Date.now() < downUntil || !!(kv && kv[1]);
  if(isDown){   // todos os espelhos falharam há menos de 3 min: não faz o usuário esperar 30 s de novo
    const s = stale();
    if(s){ res.status(200).json(s); return; }
    res.status(503).json({error: "Servidores do OpenStreetMap fora do ar (verificado há poucos minutos).", down: true}); return;
  }

  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 28000);
  try{
    const j = await hedged(EPS.map(ep => () => tryEp(ep, q, ctl.signal)), STAGGER_MS);
    ctl.abort();
    if(j.elements.length){
      if(cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(q, {t: Date.now(), j});
      const blob = JSON.stringify({t: Date.now(), j});
      if(blob.length <= KV_MAX) await redis([["SET", key, blob, "EX", KV_KEEP_S]]);
    }
    res.status(200).json({...j, source: "overpass"});
  }catch(e){
    downUntil = Date.now() + DOWN_S * 1000;
    await redis([["SET", "ov:down", "1", "EX", DOWN_S]]);
    const s = stale();
    if(s){ res.status(200).json(s); return; }
    const msg = e && e.name === "AbortError" ? "nenhum espelho do Overpass respondeu a tempo" : String((e && e.message) || e);
    res.status(502).json({error: "Servidores do OpenStreetMap fora do ar (" + msg + ").", down: true});
  }finally{ clearTimeout(timer); }
};
