(() => {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STAGES = [["novo", "Novo"], ["contactado", "Contactado"], ["respondeu", "Respondeu"], ["reuniao", "Reunião"], ["fechado", "Fechado ✅"], ["perdido", "Perdido"]];
  const TL = { hot: "Quente", warm: "Morno", cold: "Frio" };
  const QOVR = { "Clínicas / médicos": "clínica médica", "Eletricista / encanador": "eletricista", "Marcenaria / móveis planejados": "marcenaria móveis planejados", "Supermercado / mercado": "supermercado", "Pousada / hotel": "pousada", "Loja de roupas": "loja de roupas", "Autoescola": "autoescola", "Escola de idiomas": "escola de idiomas", "Cafeterias": "cafeteria", "Padarias": "padaria", "Restaurantes": "restaurante", "Lanchonetes": "lanchonete", "Academias": "academia", "Farmácia": "farmácia", "Ótica": "ótica", "Lavanderia": "lavanderia", "Bares": "bar", "Dentista": "dentista", "Advogado": "advogado", "Contabilidade": "contabilidade", "Imobiliária": "imobiliária", "Floricultura": "floricultura", "Veterinária": "veterinária", "Pet shops": "pet shop", "Oficina mecânica": "oficina mecânica", "Autopeças": "autopeças", "Estúdio de tatuagem": "estúdio de tatuagem", "Energia solar": "energia solar", "Pilates": "pilates", "Personal trainer": "personal trainer", "Salão de beleza": "salão de beleza", "Material de construção": "material de construção" };
  const nq = n => QOVR[n.l] || n.l.toLowerCase();

  let leads = {}, cfg = { me: "Pietro", city: "Sorocaba", nicho: "Dentista", mode: "detail", max: 60, bairros: "", customTpl: "", query: "" };
  let tempOn = { hot: true, warm: true, cold: true };
  let job = null, waiter = null, stopQueue = false;

  const store = {
    async load() { try { const r = await chrome.storage.local.get(["gl_leads", "gl_cfg"]); leads = r.gl_leads || {}; cfg = { ...cfg, ...(r.gl_cfg || {}) }; } catch (e) { /* fora da extensão */ } },
    saveLeads() { try { chrome.storage.local.set({ gl_leads: leads }); } catch (e) {} },
    saveCfg() { try { chrome.storage.local.set({ gl_cfg: cfg }); } catch (e) {} }
  };
  const nicheObj = () => NICHES_EXT.find(n => n.l === cfg.nicho) || NICHES_EXT[0];
  const setStatus = (t, err) => { $("status").textContent = t; $("status").style.color = err ? "#c0392b" : ""; };

  /* ---------- lista ---------- */
  function visible() {
    const q = $("q").value.trim().toLowerCase(), fn = $("fNicho").value, fs = $("fStage").value, ph = $("onlyPhone").checked;
    return Object.values(leads).filter(l => tempOn[l.temp] && (!fn || l.nicho === fn) && (!fs || l.stage === fs) && (!ph || l.phone) &&
      (!q || (l.name + " " + l.addr).toLowerCase().includes(q))).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }
  function render() {
    const all = Object.values(leads), list = visible();
    $("count").textContent = `${all.length} salvos · ${all.filter(l => l.temp === "hot").length} quentes`;
    const fnSel = $("fNicho"), cur = fnSel.value;
    const nichos = [...new Set(all.map(l => l.nicho))].sort();
    fnSel.innerHTML = '<option value="">Todos os nichos</option>' + nichos.map(n => `<option ${n === cur ? "selected" : ""}>${esc(n)}</option>`).join("");
    if (!list.length) { $("list").innerHTML = `<div class="empty">${all.length ? "Nenhum lead com esses filtros." : "Nenhum lead ainda. Abra uma pesquisa no Google Maps e clique em “Coletar”."}</div>`; return; }
    $("list").innerHTML = list.slice(0, 300).map(l => {
      const text = GL.message(l, cfg, NICHE_TPL, DEFAULT_TPL), wa = GL.waLink(l, text);
      const siteTxt = l.siteKind === "none" ? "sem site" : l.siteKind === "social" ? "só rede social" : l.siteKind === "weak" ? "site simples/link" : "tem site";
      return `<article class="lead ${l.temp}" data-id="${esc(l.id)}">
        <div class="top"><b>${esc(l.name)}</b><span class="tag ${l.temp}">${TL[l.temp]} ${l.score}</span></div>
        <div class="meta">${esc(l.cat || l.nicho)}${l.rating ? " · ⭐ " + l.rating + (l.reviews ? " (" + l.reviews + ")" : "") : ""}</div>
        <div class="info">${l.addr ? esc(l.addr) + "<br>" : ""}${l.phone ? "📞 " + esc(GL.fmtPhone(l.phone)) : "<span class='muted'>sem telefone</span>"} · <b>${siteTxt}</b>${l.site ? ` · <a href="${esc(l.site)}" target="_blank" rel="noopener">abrir</a>` : ""}</div>
        <div class="acts">
          ${wa ? `<a class="wa" href="${esc(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : (l.phone ? `<a href="tel:+${esc(l.phone)}">Ligar</a>` : "")}
          ${l.url ? `<a href="${esc(l.url)}" target="_blank" rel="noopener">Maps</a>` : ""}
          <button data-a="copy" type="button">Copiar msg</button>
          <select data-a="stage" aria-label="Etapa">${STAGES.map(s => `<option value="${s[0]}" ${s[0] === l.stage ? "selected" : ""}>${s[1]}</option>`).join("")}</select>
          <button data-a="del" type="button" title="Remover">🗑</button>
        </div>
        <textarea data-a="notes" rows="1" placeholder="Anotações…">${esc(l.notes)}</textarea>
      </article>`;
    }).join("") + (list.length > 300 ? `<div class="empty">Mostrando 300 de ${list.length}. Use os filtros ou exporte o CSV.</div>` : "");
  }

  $("list").addEventListener("change", e => {
    const a = e.target.dataset.a, id = e.target.closest(".lead")?.dataset.id; if (!id || !leads[id]) return;
    if (a === "stage") { leads[id].stage = e.target.value; store.saveLeads(); render(); }
    if (a === "notes") { leads[id].notes = e.target.value; store.saveLeads(); }
  });
  $("list").addEventListener("click", async e => {
    const b = e.target.closest("button"); if (!b) return;
    const id = b.closest(".lead")?.dataset.id, l = leads[id]; if (!l) return;
    if (b.dataset.a === "del") { delete leads[id]; store.saveLeads(); render(); }
    if (b.dataset.a === "copy") { try { await navigator.clipboard.writeText(GL.message(l, cfg, NICHE_TPL, DEFAULT_TPL)); b.textContent = "Copiado ✓"; setTimeout(() => (b.textContent = "Copiar msg"), 1500); } catch (_) {} }
  });

  /* ---------- coleta ---------- */
  function upsert(raw) {
    if (!raw || !raw.id || !raw.name) return;
    const ctx = job || { nicho: cfg.nicho, m: nicheObj().m, city: cfg.city };
    const l = GL.finalize(raw, ctx), old = leads[l.id];
    if (old) { l.stage = old.stage; l.notes = old.notes; l.nicho = old.nicho; l.m = old.m; if (!raw.detailed && old.phone && !l.phone) { l.phone = old.phone; l.whatsapp = old.whatsapp; l.score = GL.score(l); l.temp = GL.tempOf(l.score); } }
    leads[l.id] = l;
  }
  const mapsUrl = (extra) => `https://www.google.com/maps/search/${encodeURIComponent([$("query").value.trim() || nq(nicheObj()), extra ? "em " + extra + "," : "em", cfg.city].filter(Boolean).join(" "))}`;
  const isMaps = u => /^https:\/\/www\.google\.(com|com\.br)\/maps/.test(u || "");
  async function activeTab() { const [t] = await chrome.tabs.query({ active: true, currentWindow: true }); return t; }

  chrome.runtime.onMessage.addListener(m => {
    if (!m || m.from !== "garimpo") return;
    if (m.t === "lead") { upsert(m.lead); render(); }
    if (m.t === "progress") setStatus(m.phase === "scroll" ? `Carregando resultados… ${m.n}` : `Lendo ${m.n}/${m.total}…`);
    if (m.t === "done") { store.saveLeads(); render(); setStatus(`Pronto: ${m.total} empresas lidas${m.stopped ? " (parado)" : ""}.`); if (waiter) { waiter(); waiter = null; } }
    if (m.t === "error") { setStatus(m.msg, true); if (waiter) { waiter(); waiter = null; } }
  });

  async function sendTo(tabId, msg, tries = 12) {
    for (let i = 0; i < tries; i++) {
      try { const r = await chrome.tabs.sendMessage(tabId, { to: "garimpo-content", ...msg }); if (r) return r; } catch (e) { /* ainda carregando */ }
      await new Promise(r => setTimeout(r, 1000));
    }
    return null;
  }
  function setRunning(on) { $("run").hidden = on; $("queue").disabled = on; $("stop").hidden = !on; }

  async function runOne(tabId) {
    job = { nicho: cfg.nicho, m: nicheObj().m, city: cfg.city };
    const r = await sendTo(tabId, { t: "scrape", mode: cfg.mode === "fast" ? "fast" : "detail", max: +cfg.max || 60 });
    if (!r) { setStatus("A página do Maps não respondeu. Recarregue a aba do Maps (F5) e tente de novo.", true); return false; }
    if (r.busy) { setStatus("Já existe uma coleta em andamento nesta aba.", true); return false; }
    await new Promise(res => { waiter = res; });
    return true;
  }

  $("run").onclick = async () => {
    const tab = await activeTab();
    if (!tab || !isMaps(tab.url)) { setStatus("A aba ativa não é o Google Maps. Clique em “Abrir no Maps” ou abra uma pesquisa lá.", true); return; }
    setRunning(true); setStatus("Iniciando…");
    await runOne(tab.id); setRunning(false);
  };
  $("stop").onclick = async () => { stopQueue = true; const t = await activeTab(); if (t) sendTo(t.id, { t: "stop" }, 1); setStatus("Parando…"); };
  $("open").onclick = async () => { const t = await activeTab(); const url = mapsUrl(); if (t && isMaps(t.url)) chrome.tabs.update(t.id, { url }); else chrome.tabs.create({ url }); };

  $("queue").onclick = async () => {
    const bairros = $("bairros").value.split("\n").map(s => s.trim()).filter(Boolean);
    if (!bairros.length) { setStatus("Escreva pelo menos um bairro (um por linha).", true); return; }
    let tab = await activeTab(); if (!tab) return;
    stopQueue = false; setRunning(true);
    for (let i = 0; i < bairros.length && !stopQueue; i++) {
      setStatus(`Fila ${i + 1}/${bairros.length}: ${bairros[i]}…`);
      await chrome.tabs.update(tab.id, { url: mapsUrl(bairros[i]) });
      await new Promise(r => setTimeout(r, 4500));
      const ok = await runOne(tab.id); if (!ok) break;
      if (i < bairros.length - 1 && !stopQueue) { setStatus(`Fila ${i + 1}/${bairros.length} concluída. Aguardando antes da próxima…`); await new Promise(r => setTimeout(r, 8000 + Math.random() * 7000)); }
    }
    setRunning(false); if (stopQueue) setStatus("Fila interrompida.");
  };

  $("diag").onclick = async () => {
    const t = await activeTab(), out = $("diagout"); out.hidden = false;
    if (!t || !isMaps(t.url)) { out.textContent = "A aba ativa não é o Google Maps."; return; }
    const r = await sendTo(t.id, { t: "ping" }, 3);
    out.textContent = r ? JSON.stringify(r, null, 2) : "A página não respondeu (recarregue a aba do Maps).";
  };

  /* ---------- config / filtros / export ---------- */
  function fillSelects() {
    $("nicho").innerHTML = NICHES_EXT.map(n => `<option ${n.l === cfg.nicho ? "selected" : ""}>${esc(n.l)}</option>`).join("");
    $("fStage").innerHTML = '<option value="">Todas as etapas</option>' + STAGES.map(s => `<option value="${s[0]}">${s[1]}</option>`).join("");
  }
  function loadCfgToUI() { $("city").value = cfg.city; $("me").value = cfg.me; $("mode").value = cfg.mode; $("max").value = cfg.max; $("bairros").value = cfg.bairros; $("tpl").value = cfg.customTpl; $("query").value = cfg.query || nq(nicheObj()); }
  function readCfg() { cfg.nicho = $("nicho").value; cfg.city = $("city").value.trim() || "Sorocaba"; cfg.me = $("me").value.trim() || "Pietro"; cfg.mode = $("mode").value; cfg.max = +$("max").value || 60; cfg.bairros = $("bairros").value; cfg.customTpl = $("tpl").value; cfg.query = $("query").value; store.saveCfg(); }
  $("nicho").onchange = () => { cfg.nicho = $("nicho").value; $("query").value = nq(nicheObj()); readCfg(); };
  ["city", "me", "mode", "max", "bairros", "tpl", "query"].forEach(id => $(id).addEventListener("change", () => { readCfg(); render(); }));
  document.querySelectorAll(".chip").forEach(c => c.onclick = () => { tempOn[c.dataset.t] = !tempOn[c.dataset.t]; c.classList.toggle("on", tempOn[c.dataset.t]); render(); });
  ["onlyPhone", "fNicho", "fStage"].forEach(id => $(id).addEventListener("change", render));
  $("q").addEventListener("input", render);

  const download = (name, text, type) => { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); };
  $("csv").onclick = () => download(`garimpo-${new Date().toISOString().slice(0, 10)}.csv`, GL.toCSV(visible()), "text/csv;charset=utf-8");
  $("bak").onclick = () => download(`garimpo-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(leads), "application/json");
  $("restore").onclick = () => $("file").click();
  $("file").onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try { const o = JSON.parse(await f.text()); let n = 0; Object.values(o).forEach(l => { if (l && l.id && l.name) { leads[l.id] = { ...leads[l.id], ...l }; n++; } }); store.saveLeads(); render(); setStatus(n + " leads restaurados."); }
    catch (_) { setStatus("Arquivo de backup inválido.", true); }
    e.target.value = "";
  };
  $("clear").onclick = () => { if (confirm("Apagar TODOS os leads salvos na extensão? (faça um backup antes)")) { leads = {}; store.saveLeads(); render(); } };

  (async () => { await store.load(); fillSelects(); loadCfgToUI(); render(); })();
})();
