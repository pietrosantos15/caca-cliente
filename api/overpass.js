// Proxy server-side do Overpass: evita bloqueio de origem (403) dos espelhos para domínios *.vercel.app.
const EPS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];
const UA = "garimpo-local/1.0 (+https://github.com/pietrosantos15)";

async function tryEp(ep, q, signal){
  const r = await fetch(ep, {
    method: "POST", signal,
    headers: {"Content-Type": "application/x-www-form-urlencoded", "User-Agent": UA, "Accept": "application/json"},
    body: "data=" + encodeURIComponent(q),
  });
  if(!r.ok) throw new Error(ep + " respondeu " + r.status);
  const j = await r.json();
  if(!j || !Array.isArray(j.elements)) throw new Error(ep + " resposta inválida");
  // o Overpass devolve 200 + lista vazia + "remark" quando estoura tempo/memória: isso é falha, não "nenhum resultado"
  if(j.remark && /runtime error|timed out|out of memory/i.test(j.remark)) throw new Error(ep + " falhou: " + j.remark);
  return j;
}

// aceita o primeiro resultado com dados; "vazio" só vale se 2 servidores concordarem (ou se for o último a responder)
function firstGood(tasks){
  return new Promise((resolve, reject) => {
    let pending = tasks.length, empties = 0, empty = null, lastErr;
    tasks.forEach(p => p.then(j => {
      if(j.elements.length){ resolve(j); return; }
      empty = empty || j; empties++;
      if(empties >= 2 || --pending === 0) resolve(empty);
    }, e => { lastErr = e; if(--pending === 0) empty ? resolve(empty) : reject(lastErr); }));
  });
}

module.exports = async (req, res) => {
  if(req.method !== "POST"){ res.status(405).json({error: "use POST"}); return; }
  const q = typeof req.body === "string" ? req.body : (req.body && req.body.q) || "";
  if(!q || q.length > 20000){ res.status(400).json({error: "consulta inválida"}); return; }
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 28000);
  try{
    const j = await firstGood(EPS.map(ep => tryEp(ep, q, ctl.signal)));
    ctl.abort();
    if(j.elements.length) res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    res.status(200).json(j);
  }catch(e){
    res.status(502).json({error: String((e && e.message) || e)});
  }finally{ clearTimeout(timer); }
};
