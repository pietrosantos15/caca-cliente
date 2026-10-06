// Banco online do Garimpo Local (Upstash Redis via REST). Guarda buscas salvas e o estado (status, notas, modelo de mensagem)
// para acessar de qualquer computador. Protegido por senha (variável GARIMPO_SENHA na Vercel).
const crypto = require("crypto");
const DB_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const DB_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
// GARIMPO_SENHA: uma senha só ("minhasenha") = um usuário; ou vários usuários, cada um com seus próprios dados: "pietro:senha1,ana:senha2"
const USERS = String(process.env.GARIMPO_SENHA || "").split(",").map(x => x.trim()).filter(Boolean).map((x, i, a) => {
  const k = x.indexOf(":"); return a.length === 1 && k < 0 ? {id: "u", pass: x} : (k > 0 ? {id: x.slice(0, k).toLowerCase().replace(/[^a-z0-9_-]/g, ""), pass: x.slice(k + 1)} : null);
}).filter(u => u && u.id && u.pass);
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
  const faltam = [!DB_URL && "KV_REST_API_URL", !DB_TOKEN && "KV_REST_API_TOKEN", !USERS.length && "GARIMPO_SENHA"].filter(Boolean);
  if(faltam.length){ res.status(501).json({error: "Banco online não configurado na Vercel. Faltam: " + faltam.join(", ") + "."}); return; }
  const given = req.headers["x-garimpo-key"] || "";
  let user = null; for(const u of USERS) if(same(given, u.pass)) user = u;   // percorre todos para não revelar qual acertou pelo tempo
  if(!user){
    await new Promise(r => setTimeout(r, 600));   // atrapalha tentativa de adivinhar a senha
    res.status(401).json({error: "Senha incorreta."}); return;
  }
  const KM = "gl:" + user.id + ":meta", KD = "gl:" + user.id + ":data", KS = "gl:" + user.id + ":state";
  const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const id = String(b.id || "").slice(0, 200);
  try{
    switch(b.op){
      case "ping": res.status(200).json({ok: true, user: user.id}); return;
      case "list": {
        const [flat] = await redis([["HGETALL", KM]]);
        const items = [];
        for(let i = 0; i < (flat || []).length; i += 2){ try{ items.push(JSON.parse(flat[i + 1])); }catch{} }
        res.status(200).json({items}); return;
      }
      case "get": { if(!id) break; const [blob] = await redis([["HGET", KD, id]]); res.status(blob ? 200 : 404).json(blob ? {blob} : {error: "não encontrada"}); return; }
      case "put": {
        if(!id || typeof b.blob !== "string" || !b.meta) break;
        if(b.blob.length > MAX_BLOB){ res.status(413).json({error: "Busca grande demais para guardar online (" + Math.round(b.blob.length / 1024) + " KB). Diminua o raio."}); return; }
        await redis([["HSET", KD, id, b.blob], ["HSET", KM, id, JSON.stringify({...b.meta, id})]]);
        res.status(200).json({ok: true}); return;
      }
      case "del": { if(!id) break; await redis([["HDEL", KD, id], ["HDEL", KM, id]]); res.status(200).json({ok: true}); return; }
      case "state_get": { const [blob] = await redis([["GET", KS]]); res.status(200).json({blob: blob || null}); return; }
      case "state_put": {
        if(typeof b.blob !== "string") break;
        if(b.blob.length > MAX_BLOB){ res.status(413).json({error: "Estado grande demais para sincronizar."}); return; }
        await redis([["SET", KS, b.blob]]); res.status(200).json({ok: true}); return;
      }
    }
    res.status(400).json({error: "operação inválida"});
  }catch(e){ res.status(502).json({error: String((e && e.message) || e)}); }
};
