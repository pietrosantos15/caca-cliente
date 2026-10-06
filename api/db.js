// Banco online do Garimpo Local (Upstash Redis via REST). Guarda buscas salvas e o estado (status, notas, modelo de mensagem)
// para acessar de qualquer computador. Protegido por senha (variável GARIMPO_SENHA na Vercel).
const crypto = require("crypto");
const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SENHA = process.env.GARIMPO_SENHA;
const MAX_BLOB = 900 * 1024;   // limite de tamanho por registro (o Upstash gratuito aceita ~1 MB por requisição)

async function redis(cmds){
  const r = await fetch(DB_URL.replace(/\/$/, "") + "/pipeline", {method: "POST", headers: {Authorization: "Bearer " + DB_TOKEN, "Content-Type": "application/json"}, body: JSON.stringify(cmds)});
  if(!r.ok) throw new Error("Banco respondeu " + r.status);
  const out = await r.json();
  return out.map(o => { if(o.error) throw new Error(o.error); return o.result; });
}
const same = (a, b) => { const h = x => crypto.createHash("sha256").update(String(x)).digest(); return crypto.timingSafeEqual(h(a), h(b)); };

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if(req.method !== "POST"){ res.status(405).json({error: "use POST"}); return; }
  const faltam = [!DB_URL && "KV_REST_API_URL", !DB_TOKEN && "KV_REST_API_TOKEN", !SENHA && "GARIMPO_SENHA"].filter(Boolean);
  if(faltam.length){ res.status(501).json({error: "Banco online não configurado na Vercel. Faltam: " + faltam.join(", ") + "."}); return; }
  if(!same(req.headers["x-garimpo-key"] || "", SENHA)){
    await new Promise(r => setTimeout(r, 600));   // atrapalha tentativa de adivinhar a senha
    res.status(401).json({error: "Senha incorreta."}); return;
  }
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const id = String(b.id || "").slice(0, 200);
  try{
    switch(b.op){
      case "ping": res.status(200).json({ok: true}); return;
      case "list": {
        const [flat] = await redis([["HGETALL", "gl:meta"]]);
        const items = [];
        for(let i = 0; i < (flat || []).length; i += 2){ try{ items.push(JSON.parse(flat[i + 1])); }catch{} }
        res.status(200).json({items}); return;
      }
      case "get": { if(!id) break; const [blob] = await redis([["HGET", "gl:data", id]]); res.status(blob ? 200 : 404).json(blob ? {blob} : {error: "não encontrada"}); return; }
      case "put": {
        if(!id || typeof b.blob !== "string" || !b.meta) break;
        if(b.blob.length > MAX_BLOB){ res.status(413).json({error: "Busca grande demais para guardar online (" + Math.round(b.blob.length / 1024) + " KB). Diminua o raio."}); return; }
        await redis([["HSET", "gl:data", id, b.blob], ["HSET", "gl:meta", id, JSON.stringify({...b.meta, id})]]);
        res.status(200).json({ok: true}); return;
      }
      case "del": { if(!id) break; await redis([["HDEL", "gl:data", id], ["HDEL", "gl:meta", id]]); res.status(200).json({ok: true}); return; }
      case "state_get": { const [blob] = await redis([["GET", "gl:state"]]); res.status(200).json({blob: blob || null}); return; }
      case "state_put": {
        if(typeof b.blob !== "string") break;
        if(b.blob.length > MAX_BLOB){ res.status(413).json({error: "Estado grande demais para sincronizar."}); return; }
        await redis([["SET", "gl:state", b.blob]]); res.status(200).json({ok: true}); return;
      }
    }
    res.status(400).json({error: "operação inválida"});
  }catch(e){ res.status(502).json({error: String((e && e.message) || e)}); }
};
